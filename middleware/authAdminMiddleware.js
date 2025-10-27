const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Importa o modelo Admin

const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obter o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar o token usando o mesmo segredo (ou um diferente, se preferir)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Obter os dados do ADMIN pelo ID no token (sem a senha)
            // e anexá-los ao objeto `req`
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                 throw new Error('Admin não encontrado'); // Garante que o usuário no token ainda existe como admin
            }

            next(); // Passa para o próximo middleware/controller
        } catch (error) {
            console.error('Erro de autenticação ADMIN:', error);
            // Retorna 401 para qualquer falha na verificação do token ou se o admin não for encontrado
            res.status(401).json({ message: 'Não autorizado como admin, token falhou ou admin inválido.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado como admin, sem token.' });
    }
};

module.exports = { protectAdmin };
