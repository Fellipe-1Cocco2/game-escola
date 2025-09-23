const express = require('express');
const path = require('path');
const router = express.Router();

// --- Rotas Públicas ---
router.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'index.html'))
});

router.get('/login', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'login.html'))
});

router.get('/cadastro', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'cadastro.html'))
});

router.get('/admin', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'admin.html'))
});

// Rota de login para o aluno
router.get('/jogar', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'aluno-login.html'));
});

// CORREÇÃO: Rota para a página de tarefas (depois do login do aluno)
router.get('/tarefas', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'tarefas.html'));
});


// --- Rotas Protegidas (Exigem Login do Professor) ---
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'dashboard.html'));
});

// Rota dinâmica para uma sala específica
router.get('/sala/:salaId', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'sala.html'));
});


module.exports = router;

