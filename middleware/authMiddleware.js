const jwt = require('jsonwebtoken');
const Professor = require('../models/Professor');

/**
 * Middleware para proteger rotas. Verifica se o token JWT é válido.
 */
const protect = async (req, res, next) => {
    let token;

    // Verifica se o cabeçalho de autorização existe e começa com "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrai o token do cabeçalho (Bearer TOKEN)
            token = req.headers.authorization.split(' ')[1];

            // Verifica e decodifica o token usando a chave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Encontra o professor pelo ID do token e anexa ao objeto 'req'
            // O '.select('-password')' garante que a senha não seja incluída
            req.professor = await Professor.findById(decoded.id).select('-password');
            
            if (!req.professor) {
                 return res.status(401).json({ message: 'Não autorizado, professor não encontrado.' });
            }

            next(); // Se tudo estiver ok, passa para a próxima função (o controller)
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, sem token.' });
    }
};

module.exports = { protect };
