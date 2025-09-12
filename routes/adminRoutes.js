const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Rota para login de administrador
router.post('/login', adminController.adminLogin);

module.exports = router;