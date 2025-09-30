const express = require('express');
const path = require('path');
const router = express.Router();

// Função helper para servir ficheiros
const servePage = (pageName) => (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', `${pageName}.html`));
};

// Rotas públicas
router.get('/', servePage('index'));
router.get('/login', servePage('login'));
router.get('/cadastro', servePage('cadastro'));
router.get('/jogar', servePage('aluno-login')); // Aluno faz login aqui

// Rotas que servem as páginas principais para o frontend (a proteção é feita no lado do cliente)
router.get('/dashboard', servePage('dashboard'));
router.get('/sala/:salaId', servePage('sala'));
router.get('/tarefa/:tarefaId/sala/:salaId', servePage('tarefa')); // Nova rota para a página da tarefa
router.get('/tarefas', servePage('tarefas')); // Página do aluno para ver as tarefas
router.get('/jogar/tarefa/:tarefaId', servePage('jogar-tarefa'));

module.exports = router;

