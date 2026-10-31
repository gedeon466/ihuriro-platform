# IHURIRO Rwanda

Full-stack citizen services platform: React + Vite frontend, Express API, MySQL database.

## Run locally

1. Open the **XAMPP Control Panel** and start **MySQL** (Apache is not required).
2. Configure the API in `backend/.env` (defaults match a stock XAMPP install):
   `MYSQL_HOST=127.0.0.1`, `MYSQL_PORT=3306`, `MYSQL_USER=root`, `MYSQL_PASSWORD=`, `MYSQL_DATABASE=ihuriro_app`.
3. Install and start:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   The API creates the `ihuriro_app` database and all tables on first start, then seeds demo data.
4. In a second terminal:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:5173. Vite proxies `/api` to http://localhost:4000.

## Demo accounts

Password for every account: `Ihuriro@2026`

| Account | Email |
| --- | --- |
| Admin | admin@ihuriro.rw |
| Citizen | citizen@ihuriro.rw |
| Parent | parent@ihuriro.rw |
| Teacher | teacher@ihuriro.rw |
| Business | business@ihuriro.rw |
| Health | health@ihuriro.rw |
| Government | government@ihuriro.rw |

## Useful commands

```bash
cd backend
npm run seed     # create demo accounts/data if missing
npm run reset    # clear data and reseed
npm run db:init  # create database + tables only
npm run smoke    # end-to-end API checks (server must be running)
```
