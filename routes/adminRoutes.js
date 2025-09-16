const express = require('express');
const router = express.Router();
const { getAllAlunos, getAllProfessors } = require('../controllers/adminController');

// Rota para buscar todos os professores
router.get('/professors', getAllProfessors);

// Rota para buscar todos os alunos
router.get('/alunos', getAllAlunos);

module.exports = router;