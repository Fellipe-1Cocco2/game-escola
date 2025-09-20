const Professor = require('../models/Professor');

// A função registerUser e loginUser continuam iguais...

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        const newProfessor = await Professor.create({ name, email, password });
        res.status(201).json({ _id: newProfessor._id, name: newProfessor.name, email: newProfessor.email });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

const loginUser = async (req, res) => {
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
        const token = professor.getSignedJwtToken();
        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Busca os dados do professor atualmente logado.
 * Esta é uma rota protegida.
 */
const getProfessorData = async (req, res) => {
    // Graças ao middleware 'protect', o objeto 'req.professor' já está disponível
    // com os dados do professor logado (sem a senha).
    res.status(200).json(req.professor);
};


module.exports = {
    registerUser,
    loginUser,
    getProfessorData, // Exporta a nova função
};

