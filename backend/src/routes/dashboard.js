import express from 'express';
import { query, queryOne } from '../db.js';
import { asyncHandler } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

async function count(sql, params = []) {
  const row = await queryOne(sql, params);
  return Number(row?.count ?? 0);
}

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [
      users,
      complaints,
      complaintsResolved,
      students,
      studentsAtRisk,
      teachers,
      products,
      lowStock,
      revenue,
      sales,
      unreadNotifications,
      personalComplaints,
      openComplaints,
      loans,
      announcements,
    ] = await Promise.all([
      count("SELECT COUNT(*) AS count FROM users WHERE status = 'active'"),
      count('SELECT COUNT(*) AS count FROM complaints'),
      count("SELECT COUNT(*) AS count FROM complaints WHERE status = 'resolved'"),
      count('SELECT COUNT(*) AS count FROM students'),
      count("SELECT COUNT(*) AS count FROM students WHERE status = 'at-risk'"),
      count('SELECT COUNT(*) AS count FROM teachers'),
      count('SELECT COUNT(*) AS count FROM products'),
      count("SELECT COUNT(*) AS count FROM products WHERE status IN ('low-stock','out-of-stock')"),
      queryOne('SELECT COALESCE(SUM(amount), 0) AS total FROM sales'),
      count('SELECT COUNT(*) AS count FROM sales'),
      count(
        'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND `read` = 0',
        [req.user.id]
      ),
      count('SELECT COUNT(*) AS count FROM complaints WHERE user_id = ?', [req.user.id]),
      count("SELECT COUNT(*) AS count FROM complaints WHERE user_id = ? AND status != 'resolved'", [
        req.user.id,
      ]),
      count('SELECT COUNT(*) AS count FROM loan_records WHERE user_id = ?', [req.user.id]),
      query('SELECT id, title, `date`, category FROM announcements ORDER BY `date` DESC LIMIT 3'),
    ]);

    const platform = {
      users,
      complaints,
      complaintsResolved,
      students,
      studentsAtRisk,
      teachers,
      products,
      lowStock,
      revenue: Number(revenue.total),
      sales,
    };

    const personal = {
      unreadNotifications,
      complaints: personalComplaints,
      openComplaints,
      loans,
    };

    res.json({ platform, personal, announcements });
  })
);

export default router;
