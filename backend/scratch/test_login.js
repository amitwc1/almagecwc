const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkLogin() {
  const email = 'amit.wc.india@gmail.com';
  const password = 'rekha@#12';
  
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gec_alumni'
  });
  
  const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (users.length === 0) {
    console.log('User not found');
  } else {
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('User found:', user.email);
    console.log('Password Match:', isMatch);
  }
  
  await conn.end();
}

checkLogin();
