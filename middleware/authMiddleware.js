const jwt = require('jsonwebtoken');
const Professor = require('../models/Professor');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obter o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Obter os dados do professor pelo ID no token (sem a senha)
            // e anexá-los ao objeto `req` para que outras rotas possam usá-los
            req.professor = await Professor.findById(decoded.id).select('-password');

            next(); // Passa para o próximo middleware/controller
        } catch (error) {
            console.error('Erro de autenticação:', error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, sem token.' });
    }
};

module.exports = { protect };

