-- IHURIRO MySQL schema (XAMPP / MariaDB 10.4+)
-- The API creates the database and applies this file automatically on startup.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(30),
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  password_hash VARCHAR(255) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(160) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_complaints_user (user_id, created_at),
  INDEX idx_complaints_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ideas (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60),
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_ideas_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ideas_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  `date` DATE NOT NULL,
  category VARCHAR(60) NOT NULL,
  content TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_announcements_date (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `date` DATE NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'system',
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, `read`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  `class` VARCHAR(20) NOT NULL,
  attendance DECIMAL(5,1) NOT NULL DEFAULT 0,
  performance DECIMAL(5,1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  date_of_birth VARCHAR(20),
  gender VARCHAR(10),
  academic_year VARCHAR(20),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(30),
  parent_email VARCHAR(254),
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  INDEX idx_students_class (`class`, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_absences (
  id VARCHAR(40) PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL,
  `date` DATE NOT NULL,
  kind VARCHAR(20) NOT NULL DEFAULT 'absence',
  remarks VARCHAR(255) NULL,
  guardian_user_id VARCHAR(40) NULL,
  guardian_contact VARCHAR(254) NULL,
  sms TEXT NOT NULL,
  sms_source VARCHAR(20) NOT NULL DEFAULT 'local',
  created_by VARCHAR(40) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_absences_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_absences_student_date (student_id, `date`),
  INDEX idx_absences_guardian (guardian_user_id, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_attendance (
  id VARCHAR(40) PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL,
  school_id VARCHAR(40) NULL,
  class_id VARCHAR(40) NULL,
  `date` DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'present',
  remarks VARCHAR(255) NULL,
  recorded_by VARCHAR(40) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_attendance_student_date (student_id, `date`),
  INDEX idx_attendance_date (`date`),
  INDEX idx_attendance_school_date (school_id, `date`),
  INDEX idx_attendance_class_date (class_id, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subjects JSON NOT NULL,
  classes JSON NOT NULL,
  students INT NOT NULL DEFAULT 0,
  phone VARCHAR(30),
  email VARCHAR(254),
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30),
  email VARCHAR(254),
  address VARCHAR(255),
  notes VARCHAR(500),
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  low_stock_alert INT NOT NULL DEFAULT 8,
  description VARCHAR(500),
  supplier_id VARCHAR(40),
  expiry_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'in-stock',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  INDEX idx_products_status (status),
  INDEX idx_products_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40),
  product VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  `date` DATE NOT NULL,
  customer VARCHAR(120),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sales_date (`date`, created_at),
  INDEX idx_sales_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(40) PRIMARY KEY,
  product_id VARCHAR(40),
  product_name VARCHAR(120) NOT NULL,
  type VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  reason VARCHAR(40) NOT NULL DEFAULT 'other',
  supplier_id VARCHAR(40),
  supplier_name VARCHAR(120),
  expiry_date DATE,
  note VARCHAR(255),
  user_id VARCHAR(40),
  user_name VARCHAR(120),
  `date` DATE NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_movements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_movements_date (`date`, created_at),
  INDEX idx_stock_movements_type (type),
  INDEX idx_stock_movements_reason (reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_records (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40),
  type VARCHAR(10) NOT NULL DEFAULT 'loan',
  counterparty VARCHAR(160) NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  `date` DATE NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_loans_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40),
  action VARCHAR(60) NOT NULL,
  resource VARCHAR(40) NOT NULL,
  resource_id VARCHAR(64),
  detail JSON,
  ip VARCHAR(64),
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  district VARCHAR(60) NOT NULL,
  level VARCHAR(60) NOT NULL,
  students INT NOT NULL DEFAULT 0,
  teachers INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  teacher VARCHAR(100) NOT NULL,
  students INT NOT NULL DEFAULT 0,
  room VARCHAR(40),
  subjects INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_classes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  teacher VARCHAR(100),
  classes JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  `class` VARCHAR(20) NOT NULL,
  `date` DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_lessons_date (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  `class` VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  submitted INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_assignments_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
  id VARCHAR(40) PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  term VARCHAR(20) NOT NULL DEFAULT 'Term 1',
  academic_year VARCHAR(20),
  marks DECIMAL(5,1) NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_results_student (student_id),
  INDEX idx_results_term (term, academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_topics (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  excerpt TEXT NOT NULL,
  read_minutes INT NOT NULL DEFAULT 4,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_health_topics_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'General',
  questions JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_quizzes_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS government_services (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements JSON NOT NULL,
  steps JSON NOT NULL,
  fee VARCHAR(120) NOT NULL,
  processing_time VARCHAR(120) NOT NULL,
  office VARCHAR(160) NOT NULL,
  contact VARCHAR(160),
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_government_services_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
