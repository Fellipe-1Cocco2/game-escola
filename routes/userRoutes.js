const express = require('express');
// Importa ambas as funções do controller
const { registerUser, loginUser, getProfessorData } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Rota para cadastro de usuários
router.post('/register', registerUser);

// Nova rota para login de usuários
router.post('/login', loginUser);

// Rota protegida: só pode ser acessada com um token válido
// Usada para buscar os dados do professor para o dashboard
router.get('/me', protect, getProfessorData);

module.exports = router;
