const Professor = require('../models/Professor');
const School = require('../models/School');
const jwt = require('jsonwebtoken');

// ... (registerUser, loginUser, getMe, getSchoolsForRegistration existentes) ...
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
        // O ID do professor já está em req.professor._id graças ao middleware 'protect'
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

// ****** NOVAS FUNÇÕES ******

/**
 * Atualiza o nome do professor logado.
 */
const updateProfile = async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'O nome não pode ser vazio.' });
    }

    try {
        // O middleware 'protect' já buscou o professor e o colocou em req.professor
        const professor = await Professor.findById(req.professor._id);

        if (!professor) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        professor.name = name.trim();
        await professor.save();

        // Retorna os dados atualizados (sem senha)
        res.status(200).json({
            _id: professor._id,
            name: professor.name,
            email: professor.email,
            // Popula a escola se necessário (opcional aqui)
            // school: await School.findById(professor.school).select('name')
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao atualizar o perfil.' });
    }
};

/**
 * Atualiza a senha do professor logado.
 */
const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validações básicas
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    try {
        // Busca o professor INCLUINDO a senha para poder comparar
        const professor = await Professor.findById(req.professor._id).select('+password');

        if (!professor) {
            // Isso não deveria acontecer se o middleware 'protect' funcionou
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        // Verifica se a senha atual fornecida está correta
        const isMatch = await professor.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // Define a nova senha (o hook pre('save') no modelo Professor fará o hash)
        professor.password = newPassword;
        await professor.save();

        // Apenas envia mensagem de sucesso, sem dados do professor
        res.status(200).json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao alterar a senha.' });
    }
};

// ****** FIM NOVAS FUNÇÕES ******


module.exports = {
    registerUser,
    loginUser,
    getMe,
    getSchoolsForRegistration,
    updateProfile,  // <-- Exporta a nova função
    updatePassword  // <-- Exporta a nova função
};