const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { pool } = require('../config/database');
const { query } = require('../config/database');
const authService = require('../services/auth.service');

async function initDatabase() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(schema);
  console.log('Base de datos inicializada correctamente.');

  // Crear usuario administrador por defecto si no existe
  try {
    const res = await query('SELECT id FROM users WHERE email = $1', ['admin@admin.com']);
    if (!res.rowCount) {
      await authService.createUser({
        name: 'Administrador',
        email: 'admin@admin.com',
        password: '12admin',
        role: 'admin',
      });
      console.log('Usuario administrador creado: admin@admin.com');
    } else {
      console.log('Usuario administrador ya existe.');
    }
  } catch (err) {
    console.error('Error al asegurar usuario administrador:', err.message);
  }
}

initDatabase()
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos.');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
