const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'index.html'))
})

router.get('/jogar', (req, res) => {
     res.sendFile(path.join(__dirname, '..','public', 'pages', 'id-game.html'))
})

module.exports = router;