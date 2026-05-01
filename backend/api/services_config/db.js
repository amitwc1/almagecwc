const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gec_alumni',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

const initializeDatabase = async () => {
  try {
    console.log(`Connecting to DB: ${process.env.DB_HOST} with user: ${process.env.DB_USER}`);
    const db = await pool.getConnection();
    console.log('✅ Connected to MySQL database');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'alumni', 'admin') NOT NULL DEFAULT 'student',
        avatar_url VARCHAR(255),
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Profiles table (normalized)
    await db.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        department VARCHAR(100),
        graduation_year INT,
        roll_number VARCHAR(50) UNIQUE,
        job_title VARCHAR(255),
        company VARCHAR(255),
        location VARCHAR(255),
        bio TEXT,
        skills TEXT,
        linkedin_url VARCHAR(255),
        github_url VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Connections table
    await db.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content TEXT NULL,

        message_type ENUM('text', 'image', 'pdf', 'audio') DEFAULT 'text',
        file_url VARCHAR(255),
        file_name VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        reference_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ─── Migrations: Add columns to pre-existing tables ────────────────
    
    // Add columns to profiles if they don't exist
    try {
      await db.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
      await db.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year INT`);
      await db.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50) UNIQUE`);
    } catch (e) {}

    // Add columns to messages if they don't exist
    try {
      await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type ENUM('text', 'image', 'pdf', 'audio') DEFAULT 'text'`);
      await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(255)`);
      await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`);
    } catch (e) {}

    db.release();
    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
};

module.exports = { pool, initializeDatabase };
