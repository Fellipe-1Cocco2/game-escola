const express = require('express');
// Importa todas as funções necessárias
const {
    registerUser,
    loginUser,
    getMe,
    getSchoolsForRegistration,
    updateProfile,  // <-- NOVA FUNÇÃO
    updatePassword  // <-- NOVA FUNÇÃO
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Importa o nosso "segurança"

const router = express.Router();

// Rotas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/schools', getSchoolsForRegistration);

// Rota protegida: /me
router.get('/me', protect, getMe);

// ****** NOVAS ROTAS PROTEGIDAS ******
router.put('/me/profile', protect, updateProfile); // Para atualizar nome (e talvez outros dados no futuro)
router.put('/me/password', protect, updatePassword); // Para alterar a senha
// ****** FIM NOVAS ROTAS ******

module.exports = router;