const express = require('express');
const router = express.Router();
const { criarSala, adicionarAluno } = require('../controllers/gameController');

// Rota para um professor criar uma nova sala
// Ex: POST /api/game/salas
router.post('/salas', criarSala);

// Rota para adicionar um aluno a uma sala específica
// Ex: POST /api/game/salas/60b8d295f1d2c2001c8e4d2a/alunos
router.post('/salas/:salaId/alunos', adicionarAluno);

module.exports = router;

