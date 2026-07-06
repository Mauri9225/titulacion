const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body));
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    res.json(await authService.listUsers());
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.message = 'Ya existe un usuario con ese correo';
    }
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await authService.updateUserStatus(req.params.id, req.body.active);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  listUsers,
  login,
  updateUserStatus,
};
