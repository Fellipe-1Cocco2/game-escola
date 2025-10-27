const Professor = require('../models/Professor');
const Aluno = require('../models/Aluno'); // Importa Aluno
const Sala = require('../models/Sala'); // Importa Sala
const School = require('../models/School'); // Importa School
const Admin = require('../models/Admin'); // Importa Admin

// --- Funções Existentes (Manter) ---
/**
 * Busca e retorna todos os alunos de todas as salas.
 * (Melhoria: Pode precisar paginar no futuro)
 */
const getAllAlunos = async (req, res) => {
    try {
        // Busca todos os alunos diretamente e popula a sala (se necessário saber a sala)
        const alunos = await Aluno.find().sort({ createdAt: -1 }); // Ordena por mais recente
        // Se precisar saber a sala de cada aluno, a lógica precisa ser mais complexa
        // buscando as salas e depois mapeando. Por agora, retorna só os alunos.
        res.status(200).json(alunos);
    } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

/**
 * Busca e retorna todos os professores, populando a escola.
 */
const getAllProfessors = async (req, res) => {
    try {
        const professors = await Professor.find().populate('school', 'name').select('-password'); // Popula o nome da escola
        res.status(200).json(professors);
    } catch (error) {
        console.error('Erro ao buscar professores:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

// --- NOVAS Funções CRUD ---

// --- SCHOOL CRUD ---
const createSchool = async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório.' });
    }
    try {
        const existingSchool = await School.findOne({ name });
        if (existingSchool) {
            return res.status(409).json({ message: 'Uma escola com este nome já existe.' });
        }
        const newSchool = await School.create({ name });
        res.status(201).json(newSchool);
    } catch (error) {
        console.error('Erro ao criar escola:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ name: 1 }); // Ordena por nome
        res.status(200).json(schools);
    } catch (error) {
        console.error('Erro ao buscar escolas:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updateSchool = async (req, res) => {
    const { schoolId } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório.' });
    }
    try {
        // Verifica se o novo nome já existe em *outra* escola
        const existingSchool = await School.findOne({ name: name, _id: { $ne: schoolId } });
        if (existingSchool) {
            return res.status(409).json({ message: 'Já existe outra escola com este nome.' });
        }

        const updatedSchool = await School.findByIdAndUpdate(schoolId, { name }, { new: true, runValidators: true });
        if (!updatedSchool) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json(updatedSchool);
    } catch (error) {
        console.error('Erro ao atualizar escola:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const deleteSchool = async (req, res) => {
    const { schoolId } = req.params;
    try {
        // IMPORTANTE: Verificar se existem professores vinculados antes de excluir
        const professorsInSchool = await Professor.countDocuments({ school: schoolId });
        if (professorsInSchool > 0) {
            return res.status(400).json({ message: `Não é possível excluir a escola, pois ${professorsInSchool} professor(es) estão vinculados a ela.` });
        }

        const deletedSchool = await School.findByIdAndDelete(schoolId);
        if (!deletedSchool) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json({ message: 'Escola excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir escola:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// --- ADMIN CRUD ---
const createAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }
     if (password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(409).json({ message: 'Um administrador com este email já existe.' });
        }
        // A senha será hasheada pelo hook pre('save') no modelo
        const newAdmin = await Admin.create({ name, email, password });
        // Retorna o admin sem a senha
        res.status(201).json({ _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, createdAt: newAdmin.createdAt });
    } catch (error) {
        console.error('Erro ao criar admin:', error);
        // Trata erro de email inválido do Mongoose
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(admins);
    } catch (error) {
        console.error('Erro ao buscar admins:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


const getSchoolDetails = async (req, res) => {
    const { schoolId } = req.params;
    try {
        // 1. Encontra a escola
        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }

        // 2. Encontra os professores dessa escola
        const professors = await Professor.find({ school: schoolId }).select('_id name email'); // Seleciona campos úteis

        // 3. Extrai os IDs dos professores
        const professorIds = professors.map(p => p._id);

        // 4. Encontra todas as salas criadas por esses professores
        // Popula o criador para mostrar o nome na lista de salas
        const salas = await Sala.find({ criador: { $in: professorIds } })
                              .populate('criador', 'name') // Adiciona o nome do professor criador
                              .populate('alunos') // Conta os alunos
                              .sort({ createdAt: -1 });

        // Monta a resposta
        res.status(200).json({
            school: { _id: school._id, name: school.name },
            professors: professors,
            salas: salas.map(sala => ({ // Formata a resposta das salas
                 _id: sala._id,
                 num_serie: sala.num_serie,
                 criadorNome: sala.criador ? sala.criador.name : 'Desconhecido', // Nome do criador
                 numAlunos: sala.alunos ? sala.alunos.length : 0, // Contagem de alunos
                 numTarefas: sala.tarefas ? sala.tarefas.length : 0, // Contagem de tarefas
                 createdAt: sala.createdAt
            }))
        });

    } catch (error) {
        console.error(`Erro ao buscar detalhes da escola ${schoolId}:`, error);
        res.status(500).json({ message: 'Erro interno no servidor ao buscar detalhes da escola.' });
    }
};

// ATENÇÃO: A edição de senha precisa de tratamento especial (não pode simplesmente salvar o hash)
// A exclusão de admin também precisa de cuidado (não permitir excluir o último admin, por exemplo)
// Deixaremos updateAdmin e deleteAdmin para depois, se necessário.

// --- EXPORTAÇÕES ATUALIZADAS ---
module.exports = {
    getAllAlunos,
    getAllProfessors,
    createSchool,
    getAllSchools,
    updateSchool,
    deleteSchool,
    createAdmin,
    getAllAdmins,
    getSchoolDetails
    // Adicionar outras funções CRUD (updateProfessor, deleteProfessor, etc.) aqui depois
};
