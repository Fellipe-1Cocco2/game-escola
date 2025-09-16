const Professor = require('../models/Professor'); // Importa o modelo Mongoose

/**
 * Registra um novo Professor no banco de dados.
 */
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Por favor, forneça nome, email e senha.' });
    }

    try {
        // Verifica se o e-mail já está em uso
        const existingProfessor = await Professor.findOne({ email });

        if (existingProfessor) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }

        // Cria o novo professor. A senha será criptografada automaticamente pelo hook 'pre-save' no modelo.
        const newProfessor = await Professor.create({
            name,
            email,
            password,
        });

        // Retorna os dados do professor criado (sem a senha)
        res.status(201).json({
            _id: newProfessor._id,
            name: newProfessor.name,
            email: newProfessor.email,
            role: newProfessor.role
        });

    } catch (error) {
        console.error('Erro ao registrar professor:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

module.exports = {
    registerUser,
};

