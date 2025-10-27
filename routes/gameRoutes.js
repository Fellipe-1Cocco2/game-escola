const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    criarSala, excluirSala, getTodasAsSalas, getSalaDetalhes, convidarEditor,
    atualizarAluno, excluirAluno, alunoLogin,
    adicionarTarefa, getTarefaDetalhes, getTarefasDaSala,
    atualizarTarefa, // <-- NOVA FUNÇÃO IMPORTADA
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco,
    salvarProgressoAluno,
    cadastrarEAdicionarAluno, // Função de cadastro
    vincularAlunoExistente, gerarTarefaComIA, removerPerguntaDaTarefa // Função de vínculo
} = require('../controllers/gameController');

// --- ROTAS DE SALA ---
router.route('/salas').post(protect, criarSala).get(protect, getTodasAsSalas);
router.route('/salas/:salaId').get(protect, getSalaDetalhes).delete(protect, excluirSala);
router.post('/salas/:salaId/convidar', protect, convidarEditor);

// --- ROTAS DE ALUNO ---
router.post('/aluno/login', alunoLogin);
router.post('/salas/:salaId/alunos', protect, cadastrarEAdicionarAluno); // Rota para CADASTRAR
router.put('/salas/:salaId/alunos/vincular', protect, vincularAlunoExistente); // Rota para VINCULAR
router.route('/salas/:salaId/alunos/:alunoId').put(protect, atualizarAluno).delete(protect, excluirAluno);

// --- ROTAS DE TAREFA ---
router.post('/salas/:salaId/tarefas', protect, adicionarTarefa);
router.get('/salas/:salaId/tarefas', getTarefasDaSala); // Busca todas as tarefas da sala
router.route('/salas/:salaId/tarefas/:tarefaId')
    .get(protect, getTarefaDetalhes) // Busca detalhes de UMA tarefa
    .put(protect, atualizarTarefa); // <-- NOVA ROTA PUT PARA ATUALIZAR TAREFA

// --- ROTAS DE PERGUNTAS ---
router.get('/perguntas', protect, getBancoDePerguntas);
router.post('/salas/:salaId/tarefas/:tarefaId/perguntas', protect, criarPerguntaParaTarefa);
router.post('/salas/:salaId/tarefas/:tarefaId/banco-perguntas', protect, adicionarPerguntaDoBanco);
router.delete('/salas/:salaId/tarefas/:tarefaId/perguntas/:perguntaId', protect, removerPerguntaDaTarefa);

// --- ROTA DE PROGRESSO ---
router.post('/salas/:salaId/tarefas/:tarefaId/progresso', salvarProgressoAluno);

// --- ROTA DE IA ---
router.post('/salas/:salaId/ai/gerar-tarefa', protect, gerarTarefaComIA);

module.exports = router;