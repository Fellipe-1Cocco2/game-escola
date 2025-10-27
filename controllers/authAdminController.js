const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

/**
 * Autentica um administrador e retorna um token JWT.
 */
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
    }

    try {
        // Busca o admin pelo email e inclui a senha na busca
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            // Mensagem genérica para não indicar se o email existe ou não
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha fornecida com a senha hashada no banco
        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Gera o token JWT para o admin autenticado
        // Pode usar o mesmo segredo do professor ou um específico para admin
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: '1d', // Token expira em 1 dia
        });

        // Retorna sucesso e o token
        res.status(200).json({
            success: true,
            token,
            // Pode retornar alguns dados do admin se necessário, mas evite a senha
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('Erro no login do admin:', error);
        res.status(500).json({ message: 'Erro interno no servidor durante o login do admin.' });
    }
};

module.exports = {
    loginAdmin,
};
