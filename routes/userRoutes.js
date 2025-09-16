const express = require('express');
const { registerUser } = require('../controllers/userController');

const router = express.Router();

// Rota para cadastro de usuários
router.post('/register', registerUser);

module.exports = router;
