const crypto = require('crypto');
require('dotenv').config();

const { query, pool } = require('../src/config/database');

async function setAdminPassword() {
  const email = 'admin@admin.com';
  const name = 'Administrador';
  const password = '12admin';

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  const password_hash = `${salt}:${hash}`;

  try {
    const res = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rowCount) {
      await query('UPDATE users SET password_hash = $1, role = $2, active = TRUE WHERE email = $3', [
        password_hash,
        'admin',
        email,
      ]);
      console.log('Usuario administrador actualizado:', email);
    } else {
      await query(
        'INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, TRUE)',
        [name, email, password_hash, 'admin'],
      );
      console.log('Usuario administrador creado:', email);
    }
  } catch (err) {
    console.error('Error al crear/actualizar admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setAdminPassword();
