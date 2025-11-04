const express = require('express');
const path = require('path');
const router = express.Router();

// Função helper para servir ficheiros
const servePage = (pageName) => (req, res) => {
    // Tenta servir da pasta 'pages' primeiro
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', `${pageName}.html`), (err) => {
        // Se não encontrar em 'pages', tenta servir diretamente da 'public' (caso raro)
        if (err) {
             console.log(`Página não encontrada em /pages/${pageName}.html. Tentando /public/${pageName}.html`);
             res.sendFile(path.join(__dirname, '..', 'public', `${pageName}.html`), (err2) => {
                 if (err2) {
                     // Se não encontrar em nenhum lugar, envia 404
                     console.error(`Erro ao servir página: ${pageName}`, err2);
                     res.status(404).send('Página não encontrada');
                 }
             });
        }
    });
};

// --- Rotas Públicas ---
router.get('/', servePage('index'));
router.get('/login', servePage('login')); // Login Professor
router.get('/cadastro', servePage('cadastro')); // Cadastro Professor
router.get('/jogar', servePage('aluno-login')); // Login Aluno

// --- Rotas "Protegidas" (Frontend faz a proteção real) ---
router.get('/dashboard', servePage('dashboard')); // Dashboard Professor
router.get('/sala/:salaId', servePage('sala')); // Gerenciar Sala (Professor)
router.get('/tarefa/:tarefaId/sala/:salaId', servePage('tarefa')); // Gerenciar Tarefa (Professor)
router.get('/tarefas', servePage('tarefas')); // Lista de Tarefas (Aluno)
router.get('/jogar/tarefa/:tarefaId', servePage('jogar-tarefa')); // Jogar Tarefa (Aluno)

router.get('/jogo-mat-let', servePage('jogo-mat-let')); // Jogo Matemática Letramento
router.get('/jogo-mat-alf', servePage('jogo-mat-alf')); // Jogo Matemática Alfabetização
router.get('/jogo-por-let', servePage('jogo-por-let')); // Jogo Português Letramento
router.get('/jogo-por-alf', servePage('jogo-por-alf')); // Jogo Português Alfabetização

// --- Rotas ADMIN ---
router.get('/admin/login', servePage('admin-login')); // Página de login do Admin
router.get('/admin/dashboard', servePage('admin-dashboard')); // Dashboard principal do Admin
// --- NOVA ROTA DE DETALHES ---
router.get('/admin/schools/:schoolId/details', servePage('admin-school-details')); // Detalhes da Escola
router.get('/admin/salas/:salaId/details', servePage('admin-sala-details')); // Detalhes da Sala (Admin)
// Futuramente: rotas como /admin/salas/:salaId/details, etc.

module.exports = router;

