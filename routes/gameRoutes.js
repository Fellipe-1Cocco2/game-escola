const express = require('express');
const router = express.Router();
const { 
    criarSala, 
    adicionarAluno,
    getSalaById,    // Importa a nova função
    adicionarTarefa // Importa a nova função
} = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware'); // Importa o middleware de proteção

// Rota para um professor criar uma nova sala (protegida)
router.post('/salas', protect, criarSala);

// (NOVO) Rota para buscar os detalhes de uma sala específica (protegida)
router.get('/salas/:salaId', protect, getSalaById);

// (NOVO) Rota para adicionar uma tarefa a uma sala (protegida)
router.post('/salas/:salaId/tarefas', protect, adicionarTarefa);

// Rota para adicionar um aluno a uma sala específica (pode ser protegida ou não, dependendo da lógica)
router.post('/salas/:salaId/alunos', adicionarAluno);

module.exports = router;

