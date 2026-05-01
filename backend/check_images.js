const { pool } = require('./services_config/db');

async function check() {
  try {
    const [rows] = await pool.query('SELECT u.name, ap.profile_image FROM users u JOIN alumni_profiles ap ON u.id = ap.user_id LIMIT 10');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
