const express = require('express');
const router = express.Router();
const {
    criarSala,
    getTodasAsSalas,
    getSalaDetalhes,
    adicionarTarefa,
    convidarEditor,
    excluirSala,
    adicionarAluno,
    loginAluno
} = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

// --- ROTAS DO ALUNO (PÚBLICAS) ---
// Rota para o aluno fazer login. Não precisa de 'protect'.
router.post('/aluno/login', loginAluno);

// --- ROTAS DO PROFESSOR (PROTEGIDAS) ---
// Todas as rotas abaixo exigem que o professor esteja logado.
router.route('/salas')
    .post(protect, criarSala)
    .get(protect, getTodasAsSalas);

router.route('/salas/:salaId')
    .get(protect, getSalaDetalhes)
    .delete(protect, excluirSala);

router.post('/salas/:salaId/tarefas', protect, adicionarTarefa);
router.post('/salas/:salaId/editores', protect, convidarEditor);
router.post('/salas/:salaId/alunos', protect, adicionarAluno);

module.exports = router;

