const crypto = require('crypto');
const { query } = require('../config/database');

const TOKEN_SECRET = process.env.JWT_SECRET || 'electri-incom-local-secret';
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function createToken(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = base64Url(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: expiresAt,
    }),
  );
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = token.split('.');

  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return user;
}

function normalizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

async function login({ email, password, role }) {
  const result = await query('SELECT * FROM users WHERE email = $1 AND active = TRUE', [
    email,
  ]);

  if (!result.rowCount || !verifyPassword(password, result.rows[0].password_hash)) {
    const error = new Error('Credenciales incorrectas');
    error.status = 401;
    throw error;
  }

  const user = result.rows[0];

  if (role && user.role !== role) {
    const error = new Error('El rol seleccionado no coincide con el usuario');
    error.status = 403;
    throw error;
  }

  return {
    token: createToken(user),
    user: normalizeUser(user),
  };
}

async function listUsers() {
  const result = await query(
    `SELECT id, name, email, role, active, created_at
     FROM users
     ORDER BY created_at DESC`,
  );

  return result.rows.map(normalizeUser);
}

async function createUser(payload) {
  const role = payload.role === 'admin' ? 'admin' : 'staff';
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, active, created_at`,
    [payload.name, payload.email, hashPassword(payload.password), role],
  );

  return normalizeUser(result.rows[0]);
}

async function updateUserStatus(id, active) {
  const result = await query(
    `UPDATE users
     SET active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, active, created_at`,
    [id, active],
  );

  if (!result.rowCount) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  return normalizeUser(result.rows[0]);
}

module.exports = {
  createUser,
  listUsers,
  login,
  updateUserStatus,
  verifyToken,
};
