const express = require('express');
// Importa todas as funções necessárias
const { registerUser, loginUser, getMe, getSchoolsForRegistration } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Importa o nosso "segurança"

const router = express.Router();

// Rotas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
// --- NOVA ROTA PÚBLICA ---
router.get('/schools', getSchoolsForRegistration); // Rota para buscar escolas para o cadastro
// --- FIM NOVA ROTA ---

// Rota protegida: só funciona se o professor estiver logado (com token)
router.get('/me', protect, getMe);

module.exports = router;
