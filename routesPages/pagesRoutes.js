const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'index.html'))
})

router.get('/jogar', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'id-game.html'))
})

router.get('/login', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'login.html'))
})

router.get('/cadastro', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'cadastro.html'))
})

router.get('/admin', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'admin.html'))
})

// rota para a página do dashboard do professor
router.get('/dashboard', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'dashboard.html'))
})

module.exports = router;