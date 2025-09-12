const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Importe as novas rotas
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gameRoutes = require('./routes/gameRoutes');
const pageRoutes = require('./routesPages/pagesRoutes');
const e = require('express');

// Middleware
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/game', gameRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro no servidor.' });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});