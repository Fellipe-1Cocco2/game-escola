const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Rota para entrar em um jogo com um código
router.post('/join', gameController.joinGame);

module.exports = router;