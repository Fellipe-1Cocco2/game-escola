const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Importa todas as funções do controller
const { 
    criarSala, excluirSala, getTodasAsSalas, getSalaDetalhes, convidarEditor,
    adicionarAluno, atualizarAluno, excluirAluno, alunoLogin,
    adicionarTarefa, getTarefaDetalhes,
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco, salvarResultadoTarefa
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

// Rota pública para o login do aluno (CORRIGIDA)
router.post('/aluno/login', alunoLogin); 

// --- ROTAS DE TAREFA (PROTEGIDAS) ---
router.post('/salas/:salaId/tarefas', protect, adicionarTarefa);
router.get('/salas/:salaId/tarefas/:tarefaId', protect, getTarefaDetalhes);

// --- ROTAS DE PERGUNTAS (PROTEGIDAS) ---
router.get('/perguntas', protect, getBancoDePerguntas);
router.post('/salas/:salaId/tarefas/:tarefaId/perguntas', protect, criarPerguntaParaTarefa);
router.post('/salas/:salaId/tarefas/:tarefaId/banco-perguntas', protect, adicionarPerguntaDoBanco);

// Esta rota é chamada pelo aluno no final do jogo para salvar sua pontuação
router.post('/salas/:salaId/tarefas/:tarefaId/resultados', salvarResultadoTarefa);

module.exports = router;

