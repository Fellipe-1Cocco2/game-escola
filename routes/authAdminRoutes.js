const express = require('express');
const { loginAdmin } = require('../controllers/authAdminController');

const router = express.Router();

// Rota para login de administradores
router.post('/login', loginAdmin);

// Poderíamos adicionar uma rota /me para admin aqui também, se necessário
// router.get('/me', protectAdmin, getAdminMe); // Precisaria criar getAdminMe no controller

module.exports = router;
