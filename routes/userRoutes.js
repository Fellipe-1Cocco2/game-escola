const express = require('express');
// Importa todas as funções necessárias
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Importa o nosso "segurança"

const router = express.Router();

// Rotas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rota protegida: só funciona se o usuário estiver logado (com token)
router.get('/me', protect, getMe);

module.exports = router;

