const Professor = require('../models/Professor');
const School = require('../models/School'); // Importa o modelo School
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    // --- ALTERAÇÃO: Recebe 'schoolId' do frontend ---
    const { name, email, password, schoolId } = req.body;

    // --- ALTERAÇÃO: Valida também o schoolId ---
    if (!name || !email || !password || !schoolId) {
        return res.status(400).json({ message: 'Por favor, forneça nome, email, senha e escola.' });
    }
     // Adiciona validação de senha (boa prática)
     if (password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    try {
        // Verifica se o email já existe
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }

        // --- ALTERAÇÃO: Verifica se a escola existe ---
        const schoolExists = await School.findById(schoolId);
        if (!schoolExists) {
            return res.status(400).json({ message: 'Escola selecionada inválida.' });
        }

        // Cria o professor, associando a escola
        const newProfessor = await Professor.create({
            name,
            email,
            password,
            school: schoolId // Associa o ID da escola
        });

        // Retorna os dados do professor criado (sem a senha)
        res.status(201).json({
            _id: newProfessor._id,
            name: newProfessor.name,
            email: newProfessor.email,
            school: schoolExists.name // Pode retornar o nome da escola para confirmação
        });

    } catch (error) {
        console.error('Erro ao registrar professor:', error);
         // Trata erro de validação do Mongoose (ex: email inválido)
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};


const loginUser = async (req, res) => {
    // ... código existente sem alterações ...
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
            // Opcional: retornar dados do professor logado (sem senha)
             professor: {
                 _id: professor._id,
                 name: professor.name,
                 email: professor.email
                 // Não incluir school aqui para não precisar popular sempre no login
             }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getMe = async (req, res) => {
    // Busca o professor novamente para popular a escola
     try {
        const professor = await Professor.findById(req.professor._id).populate('school', 'name');
        if (!professor) {
             return res.status(404).json({ message: 'Professor não encontrado.' });
        }
         res.status(200).json(professor);
     } catch (error) {
         console.error('Erro ao buscar dados do professor (getMe):', error);
         res.status(500).json({ message: 'Erro interno no servidor.' });
     }
};

// --- NOVA FUNÇÃO ---
/**
 * Busca e retorna a lista de escolas para o formulário de cadastro.
 * Não precisa de proteção, pois é para o formulário público.
 */
const getSchoolsForRegistration = async (req, res) => {
    try {
        const schools = await School.find().select('name _id').sort({ name: 1 });
        res.status(200).json(schools);
    } catch (error) {
        console.error('Erro ao buscar escolas para cadastro:', error);
        res.status(500).json({ message: 'Erro interno ao buscar escolas.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    getSchoolsForRegistration // Exporta a nova função
};
