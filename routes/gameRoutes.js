const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Importa todas as funções do controller
const { 
    criarSala, excluirSala, getTodasAsSalas, getSalaDetalhes, convidarEditor,
    adicionarAluno, atualizarAluno, excluirAluno, alunoLogin,
    adicionarTarefa, getTarefaDetalhes,
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco
} = require('../controllers/gameController');

// --- ROTAS DE SALA (PROTEGIDAS) ---
router.route('/salas')
    .post(protect, criarSala)
    .get(protect, getTodasAsSalas);

router.route('/salas/:salaId')
    .get(protect, getSalaDetalhes)
    .delete(protect, excluirSala);

router.post('/salas/:salaId/convidar', protect, convidarEditor);

// --- ROTAS DE ALUNO (PROTEGIDAS E PÚBLICAS) ---
router.post('/salas/:salaId/alunos', protect, adicionarAluno);
router.route('/salas/:salaId/alunos/:alunoId')
    .put(protect, atualizarAluno)
    .delete(protect, excluirAluno);
router.post('/aluno-login', alunoLogin); // Rota pública para o login do aluno

// --- ROTAS DE TAREFA (PROTEGIDAS) ---
router.post('/salas/:salaId/tarefas', protect, adicionarTarefa);
router.get('/salas/:salaId/tarefas/:tarefaId', protect, getTarefaDetalhes);

// --- ROTAS DE PERGUNTAS (PROTEGIDAS) ---
router.get('/perguntas', protect, getBancoDePerguntas); // Busca todo o banco
router.post('/salas/:salaId/tarefas/:tarefaId/perguntas', protect, criarPerguntaParaTarefa); // Cria uma nova
router.post('/salas/:salaId/tarefas/:tarefaId/banco-perguntas', protect, adicionarPerguntaDoBanco); // Adiciona uma existente

module.exports = router;

