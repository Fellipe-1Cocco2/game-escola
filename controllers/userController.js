const Professor = require('../models/Professor');
const jwt = require('jsonwebtoken');

// ... (a sua função registerUser existente)
const registerUser = async (req, res) => {
    // ... código existente sem alterações
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Por favor, forneça nome, email e senha.' });
    }

    try {
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }

        const newProfessor = await Professor.create({ name, email, password });

        res.status(201).json({
            _id: newProfessor._id,
            name: newProfessor.name,
            email: newProfessor.email,
        });

    } catch (error) {
        console.error('Erro ao registrar professor:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};


// ... (a sua função loginUser existente)
const loginUser = async (req, res) => {
    // ... código existente sem alterações
     const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
    }

    try {
        const professor = await Professor.findOne({ email }).select('+password');
        if (!professor) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await professor.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ id: professor._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(200).json({
            success: true,
            token,
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * (NOVA FUNÇÃO)
 * Busca os dados do professor atualmente logado.
 * Esta rota é protegida e só funciona se um token válido for enviado.
 */
const getMe = async (req, res) => {
    // O middleware 'protect' já encontrou o professor e o anexou a `req.professor`.
    // Nós apenas o retornamos.
    res.status(200).json(req.professor);
};


module.exports = {
    registerUser,
    loginUser,
    getMe // Exporta a nova função
};

