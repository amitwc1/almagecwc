const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gec_alumni'
  });

  console.log('Starting migration...');

  // 1. Profiles Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      bio TEXT,
      phone VARCHAR(20),
      location VARCHAR(255),
      profile_image VARCHAR(500),
      linkedin VARCHAR(255),
      github VARCHAR(255),
      portfolio VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Table "profiles" ready.');

  // 2. Education Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS education (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      college VARCHAR(255) NOT NULL,
      degree VARCHAR(255) NOT NULL,
      branch VARCHAR(255),
      start_year INT,
      end_year INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Table "education" ready.');

  // 3. Experience Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS experience (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      company VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      start_date DATE,
      end_date DATE,
      currently_working BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Table "experience" ready.');

  // 4. Skills Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      skill_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Table "skills" ready.');

  // Sync existing users to have a profile entry if they don't
  const [users] = await conn.query('SELECT id FROM users');
  for (const user of users) {
    await conn.query('INSERT IGNORE INTO profiles (user_id) VALUES (?)', [user.id]);
  }
  console.log('Profile entries synced for existing users.');

  await conn.end();
  console.log('Migration completed successfully.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
