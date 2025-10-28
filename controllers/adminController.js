const Professor = require('../models/Professor');
const Aluno = require('../models/Aluno');
const Sala = require('../models/Sala');
const School = require('../models/School');
const Admin = require('../models/Admin');
const Pergunta = require('../models/Pergunta'); // Importa Pergunta
const mongoose = require('mongoose'); // Necessário para validar ObjectIds


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
        const professors = await Professor.find({ school: schoolId })
                                  .populate('school', '_id name') // Popula _id e name da escola
                                  .select('_id name email school');

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


const getProfessorByIdAdmin = async (req, res) => {
    try {
        const professor = await Professor.findById(req.params.professorId)
                                      .populate('school', 'name')
                                      .select('-password'); // Exclui a senha
        if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });
        res.status(200).json(professor);
    } catch (error) { // Adiciona tratamento de erro
        console.error("Erro ao buscar professor por ID (Admin):", error);
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID de professor inválido.' });
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updateProfessorAdmin = async (req, res) => {
    const { name, email, password, schoolId } = req.body; // Permite mudar nome, email, senha e escola
    const { professorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(professorId)) {
        return res.status(400).json({ message: 'ID de professor inválido.' });
    }

    try {
        const professor = await Professor.findById(professorId);
        if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

        // Validar email único (se for alterado)
        if (email && email !== professor.email) {
            const existing = await Professor.findOne({ email: email });
            if (existing) return res.status(409).json({ message: 'Este email já está em uso por outro professor.' });
            professor.email = email;
        }

        // Validar escola (se for alterada)
        if (schoolId && schoolId !== professor.school.toString()) {
             if (!mongoose.Types.ObjectId.isValid(schoolId)) {
                 return res.status(400).json({ message: 'ID de escola inválido.' });
             }
            const schoolExists = await School.findById(schoolId);
            if (!schoolExists) return res.status(400).json({ message: 'Escola selecionada inválida.' });
            professor.school = schoolId;
        }

        if (name) professor.name = name;

        // Alterar senha SOMENTE se fornecida e válida
        if (password) {
            if (password.length < 6) return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
            // O hook pre('save') no modelo Professor fará o hash
            professor.password = password;
        }

        const updatedProfessor = await professor.save();
        // Retorna sem a senha
        const professorData = updatedProfessor.toObject();
        delete professorData.password;

        res.status(200).json(professorData);
    } catch (error) {
        console.error("Erro ao atualizar professor (Admin):", error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const deleteProfessorAdmin = async (req, res) => {
    const { professorId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(professorId)) {
        return res.status(400).json({ message: 'ID de professor inválido.' });
    }
    try {
        // IMPORTANTE: O que fazer com as salas criadas por ele?
        // Opção 1: Excluir as salas (perigoso, perde dados)
        // Opção 2: Desassociar (sala fica sem criador - pode causar problemas)
        // Opção 3: Impedir exclusão se tiver salas (mais seguro inicialmente)
        const salasCriadas = await Sala.countDocuments({ criador: professorId });
        if (salasCriadas > 0) {
            return res.status(400).json({ message: `Não é possível excluir. O professor é criador de ${salasCriadas} sala(s). Transfira ou exclua as salas primeiro.` });
        }

        // Remover professor de colaborador em outras salas
        await Sala.updateMany(
            { editoresConvidados: professorId },
            { $pull: { editoresConvidados: professorId } }
        );

        const deletedProfessor = await Professor.findByIdAndDelete(professorId);
        if (!deletedProfessor) return res.status(404).json({ message: 'Professor não encontrado.' });

        res.status(200).json({ message: 'Professor excluído com sucesso.' });
    } catch (error) {
        console.error("Erro ao excluir professor (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// --- Sala Admin ---
const getSalaByIdAdmin = async (req, res) => {
    const { salaId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(salaId)) {
        return res.status(400).json({ message: 'ID de sala inválido.' });
    }
    try {
        // Popula TUDO que o admin pode querer ver/gerenciar
        const sala = await Sala.findById(salaId)
            .populate('criador', 'name email school' )
            .populate('editoresConvidados', 'name email')
            .populate('alunos', 'nome RA')
            .populate({
                path: 'tarefas',
                populate: { path: 'perguntas.pergunta', select: 'texto tipo' } // Popula perguntas dentro das tarefas
            });

        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        res.status(200).json(sala);
    } catch (error) {
        console.error("Erro ao buscar sala por ID (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updateSalaAdmin = async (req, res) => {
    const { salaId } = req.params;
    const { num_serie } = req.body; // Por enquanto, só permite mudar o nome

     if (!mongoose.Types.ObjectId.isValid(salaId)) {
        return res.status(400).json({ message: 'ID de sala inválido.' });
    }
    if (!num_serie || num_serie.trim() === '') {
        return res.status(400).json({ message: 'O nome da sala é obrigatório.' });
    }

    try {
        // Validar se o novo nome já existe na mesma escola (lógica similar a criarSala)
        const salaAtual = await Sala.findById(salaId).populate('criador', 'school');
        if(!salaAtual) return res.status(404).json({ message: 'Sala não encontrada.' });

        if(salaAtual.num_serie !== num_serie) { // Só valida se o nome mudou
             const escolaId = salaAtual.criador.school;
             const professoresDaEscola = await Professor.find({ school: escolaId }).select('_id');
             const idsProfessoresDaEscola = professoresDaEscola.map(p => p._id);
             const salaExistenteNaEscola = await Sala.findOne({
                 num_serie: num_serie,
                 criador: { $in: idsProfessoresDaEscola },
                 _id: { $ne: salaId } // Exclui a própria sala da verificação
             });
             if (salaExistenteNaEscola) {
                 return res.status(409).json({ message: `Uma sala com o nome "${num_serie}" já existe nesta escola.` });
             }
        }


        const updatedSala = await Sala.findByIdAndUpdate(salaId, { num_serie }, { new: true, runValidators: true });
        // Retorna a sala atualizada (talvez popular algo?)
        res.status(200).json(updatedSala);
    } catch (error) {
        console.error("Erro ao atualizar sala (Admin):", error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const addCollaboratorAdmin = async (req, res) => {
    const { salaId } = req.params;
    const { emailProfessor } = req.body;

     if (!mongoose.Types.ObjectId.isValid(salaId)) {
        return res.status(400).json({ message: 'ID de sala inválido.' });
    }
    if (!emailProfessor) {
        return res.status(400).json({ message: 'Email do professor é obrigatório.' });
    }

    try {
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        const professor = await Professor.findOne({ email: emailProfessor });
        if (!professor) return res.status(404).json({ message: 'Professor não encontrado com este email.' });

        // Verifica se já é criador ou colaborador
        if (sala.criador.equals(professor._id)) return res.status(400).json({ message: 'Este professor já é o criador da sala.' });
        if (sala.editoresConvidados.some(id => id.equals(professor._id))) return res.status(409).json({ message: 'Este professor já é um colaborador.' });

        sala.editoresConvidados.push(professor._id);
        await sala.save();

        // Retorna a lista atualizada de colaboradores
        const salaAtualizada = await Sala.findById(salaId).populate('editoresConvidados', 'name email');
        res.status(200).json(salaAtualizada.editoresConvidados);

    } catch (error) {
        console.error("Erro ao adicionar colaborador (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const removeCollaboratorAdmin = async (req, res) => {
    const { salaId, professorId } = req.params;

     if (!mongoose.Types.ObjectId.isValid(salaId) || !mongoose.Types.ObjectId.isValid(professorId)) {
        return res.status(400).json({ message: 'ID de sala ou professor inválido.' });
    }

    try {
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        // Verifica se o professor está na lista antes de tentar remover
        const index = sala.editoresConvidados.findIndex(id => id.equals(professorId));
        if (index === -1) return res.status(404).json({ message: 'Este professor não é um colaborador nesta sala.' });

        sala.editoresConvidados.pull(professorId); // Remove o ID do array
        await sala.save();

        res.status(200).json({ message: 'Colaborador removido com sucesso.' });
    } catch (error) {
        console.error("Erro ao remover colaborador (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- Tarefa Admin ---
const getTarefaByIdAdmin = async (req, res) => {
    const { salaId, tarefaId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(salaId) || !mongoose.Types.ObjectId.isValid(tarefaId)) {
        return res.status(400).json({ message: 'ID de sala ou tarefa inválido.' });
    }
    try {
        const sala = await Sala.findOne({ _id: salaId, "tarefas._id": tarefaId })
            .populate({
                path: 'tarefas',
                match: { _id: tarefaId }, // Garante que pegamos a tarefa certa
                populate: [
                     { path: 'perguntas.pergunta', model: 'Pergunta' }, // Popula pergunta completa
                     { path: 'progressos.alunoId', model: 'Aluno', select: 'nome RA' } // Popula aluno no progresso
                ]
            });

        if (!sala || !sala.tarefas || sala.tarefas.length === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada nesta sala.' });
        }

        const tarefa = sala.tarefas[0]; // Pega a tarefa populada
        // Poderia adicionar lógica de resultados como no gameController se necessário
        res.status(200).json(tarefa);

    } catch (error) {
        console.error("Erro ao buscar tarefa por ID (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updateTarefaAdmin = async (req, res) => {
    const { salaId, tarefaId } = req.params;
    const { titulo, dataFechamento, horaFechamento } = req.body;

     if (!mongoose.Types.ObjectId.isValid(salaId) || !mongoose.Types.ObjectId.isValid(tarefaId)) {
        return res.status(400).json({ message: 'ID de sala ou tarefa inválido.' });
    }
    // Validação básica (poderia ser mais robusta)
    if (!titulo || !dataFechamento || !horaFechamento) {
        return res.status(400).json({ message: 'Título, data e hora de fechamento são obrigatórios.' });
    }

    try {
        const result = await Sala.updateOne(
            { "_id": salaId, "tarefas._id": tarefaId },
            {
                $set: {
                    "tarefas.$.titulo": titulo,
                    "tarefas.$.dataFechamento": dataFechamento,
                    "tarefas.$.horaFechamento": horaFechamento
                }
            }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: 'Tarefa não encontrada nesta sala.' });
        if (result.modifiedCount === 0) return res.status(304).json({ message: 'Nenhuma alteração detectada.' }); // Not Modified

        // Busca e retorna a tarefa atualizada
        const salaAtualizada = await Sala.findById(salaId);
        const tarefaAtualizada = salaAtualizada.tarefas.id(tarefaId);
        res.status(200).json(tarefaAtualizada);

    } catch (error) {
        console.error("Erro ao atualizar tarefa (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const removePerguntaFromTarefaAdmin = async (req, res) => {
    const { salaId, tarefaId, perguntaId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(salaId) || !mongoose.Types.ObjectId.isValid(tarefaId) || !mongoose.Types.ObjectId.isValid(perguntaId)) {
        return res.status(400).json({ message: 'ID de sala, tarefa ou pergunta inválido.' });
    }
    try {
        const result = await Sala.updateOne(
            { "_id": salaId, "tarefas._id": tarefaId },
            { $pull: { "tarefas.$.perguntas": { pergunta: perguntaId } } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: 'Tarefa não encontrada nesta sala.' });
        if (result.modifiedCount === 0) return res.status(404).json({ message: 'Pergunta não encontrada nesta tarefa.' });

        res.status(200).json({ message: 'Pergunta removida da tarefa com sucesso.' });
    } catch (error) {
        console.error("Erro ao remover pergunta da tarefa (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const deleteTarefaAdmin = async (req, res) => {
    const { salaId, tarefaId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(salaId) || !mongoose.Types.ObjectId.isValid(tarefaId)) {
        return res.status(400).json({ message: 'ID de sala ou tarefa inválido.' });
    }
    try {
        const result = await Sala.updateOne(
            { _id: salaId },
            { $pull: { tarefas: { _id: tarefaId } } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: 'Sala não encontrada.' });
        if (result.modifiedCount === 0) return res.status(404).json({ message: 'Tarefa não encontrada nesta sala.' });

        res.status(200).json({ message: 'Tarefa excluída com sucesso.' });
    } catch (error) {
        console.error("Erro ao excluir tarefa (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- Aluno Admin ---
const getAlunoByIdAdmin = async (req, res) => {
    const { alunoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(alunoId)) {
        return res.status(400).json({ message: 'ID de aluno inválido.' });
    }
    try {
        const aluno = await Aluno.findById(alunoId);
        if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });
        // Encontrar as salas em que o aluno está
        const salas = await Sala.find({ alunos: alunoId }).select('num_serie _id');
        res.status(200).json({ aluno, salas });
    } catch (error) {
        console.error("Erro ao buscar aluno por ID (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updateAlunoAdmin = async (req, res) => {
    const { alunoId } = req.params;
    const { nome, ra } = req.body; // <<< CORRIGIDO para 'ra' minúsculo
     if (!mongoose.Types.ObjectId.isValid(alunoId)) { /* ... */ }
    // Agora a validação deve funcionar
    if (!nome || !ra) return res.status(400).json({ message: 'Nome e RA são obrigatórios.' });

    try {
        const aluno = await Aluno.findById(alunoId);
        if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

        // CORRIGIDO para 'ra' minúsculo
        if (ra !== aluno.RA) {
            // console.warn("Atenção: Validação de RA único na escola não implementada no update admin.");
            aluno.RA = ra; // <<< CORRIGIDO para 'ra' minúsculo
        }
        aluno.nome = nome;
        const updatedAluno = await aluno.save();
        res.status(200).json(updatedAluno);
    } catch (error) { /* ... */ }
};

const moveAlunoAdmin = async (req, res) => {
    const { alunoId } = req.params;
    const { novaSalaId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(alunoId) || !mongoose.Types.ObjectId.isValid(novaSalaId)) {
        return res.status(400).json({ message: 'ID de aluno ou nova sala inválido.' });
    }

    try {
        // Verifica se o aluno existe
        const aluno = await Aluno.findById(alunoId);
        if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

        // Verifica se a nova sala existe
        const novaSala = await Sala.findById(novaSalaId);
        if (!novaSala) return res.status(404).json({ message: 'Nova sala não encontrada.' });

        // Remove o aluno de TODAS as salas antigas onde ele possa estar
        await Sala.updateMany({ alunos: alunoId }, { $pull: { alunos: alunoId } });

        // Adiciona o aluno à nova sala (usa $addToSet para evitar duplicação caso já esteja lá por algum motivo)
        await Sala.updateOne({ _id: novaSalaId }, { $addToSet: { alunos: alunoId } });

        res.status(200).json({ message: `Aluno movido para a sala ${novaSala.num_serie} com sucesso.` });

    } catch (error) {
        console.error("Erro ao mover aluno (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const deleteAlunoAdmin = async (req, res) => {
    const { alunoId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(alunoId)) {
        return res.status(400).json({ message: 'ID de aluno inválido.' });
    }
    try {
        // 1. Remover o aluno de todas as salas
        await Sala.updateMany({ alunos: alunoId }, { $pull: { alunos: alunoId } });

        // 2. Excluir o registro do aluno
        const deletedAluno = await Aluno.findByIdAndDelete(alunoId);
        if (!deletedAluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

        res.status(200).json({ message: 'Aluno excluído permanentemente do sistema.' });
    } catch (error) {
        console.error("Erro ao excluir aluno (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- Pergunta Admin CRUD (Banco de Perguntas) ---
const getAllPerguntasAdmin = async (req, res) => {
    try {
        const perguntas = await Pergunta.find().sort({ createdAt: -1 });
        res.status(200).json(perguntas);
    } catch (error) {
        console.error("Erro ao buscar todas as perguntas (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getPerguntaByIdAdmin = async (req, res) => {
    const { perguntaId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(perguntaId)) {
        return res.status(400).json({ message: 'ID de pergunta inválido.' });
    }
    try {
        const pergunta = await Pergunta.findById(perguntaId);
        if (!pergunta) return res.status(404).json({ message: 'Pergunta não encontrada.' });
        res.status(200).json(pergunta);
    } catch (error) {
        console.error("Erro ao buscar pergunta por ID (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const updatePerguntaAdmin = async (req, res) => {
    const { perguntaId } = req.params;
    const { texto, tipo, opcoes, opcaoCorreta } = req.body;
     if (!mongoose.Types.ObjectId.isValid(perguntaId)) {
        return res.status(400).json({ message: 'ID de pergunta inválido.' });
    }

    // Validações básicas (similar a criarPerguntaParaTarefa no gameController)
    if (!texto || !tipo || !opcoes || opcaoCorreta === undefined) {
         return res.status(400).json({ message: 'Campos texto, tipo, opções e opção correta são obrigatórios.' });
    }
    if (tipo === 'multipla_escolha' && (opcoes.length !== 4 || opcaoCorreta < 0 || opcaoCorreta > 3)) {
         return res.status(400).json({ message: 'Perguntas de múltipla escolha devem ter 4 opções e opção correta entre 0 e 3.' });
    }
    if (tipo === 'vf' && (opcoes.length !== 2 || opcaoCorreta < 0 || opcaoCorreta > 1)) {
        return res.status(400).json({ message: 'Perguntas V/F devem ter 2 opções e opção correta entre 0 e 1.' });
    }

    try {
        const updatedPergunta = await Pergunta.findByIdAndUpdate(
            perguntaId,
            { texto, tipo, opcoes, opcaoCorreta },
            { new: true, runValidators: true } // Retorna o doc atualizado e roda validadores do Schema
        );
        if (!updatedPergunta) return res.status(404).json({ message: 'Pergunta não encontrada.' });
        res.status(200).json(updatedPergunta);
    } catch (error) {
        console.error("Erro ao atualizar pergunta (Admin):", error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const deletePerguntaAdmin = async (req, res) => {
    const { perguntaId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(perguntaId)) {
        return res.status(400).json({ message: 'ID de pergunta inválido.' });
    }
    try {
        // IMPORTANTE: Antes de excluir, remover a referência dessa pergunta de todas as tarefas
        const result = await Sala.updateMany(
            { "tarefas.perguntas.pergunta": perguntaId },
            { $pull: { "tarefas.$[].perguntas": { pergunta: perguntaId } } }
            // O $[ ] garante que o $pull opere em todos os elementos do array 'tarefas'
        );
        console.log(`Removida referência da pergunta ${perguntaId} de ${result.modifiedCount} tarefas.`);

        const deletedPergunta = await Pergunta.findByIdAndDelete(perguntaId);
        if (!deletedPergunta) return res.status(404).json({ message: 'Pergunta não encontrada.' });

        res.status(200).json({ message: 'Pergunta excluída do banco e removida das tarefas com sucesso.' });
    } catch (error) {
        console.error("Erro ao excluir pergunta (Admin):", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// Exporta TUDO
module.exports = {
    getAllAlunos,
    getAllProfessors,
    createSchool,
    getAllSchools,
    updateSchool,
    deleteSchool,
    createAdmin,
    getAllAdmins,
    getSchoolDetails,
    //---
    getProfessorByIdAdmin,
    updateProfessorAdmin,
    deleteProfessorAdmin,
    getSalaByIdAdmin,
    updateSalaAdmin,
    addCollaboratorAdmin,
    removeCollaboratorAdmin,
    getTarefaByIdAdmin,
    updateTarefaAdmin,
    removePerguntaFromTarefaAdmin,
    deleteTarefaAdmin,
    getAlunoByIdAdmin,
    updateAlunoAdmin,
    moveAlunoAdmin,
    deleteAlunoAdmin,
    getAllPerguntasAdmin,
    getPerguntaByIdAdmin,
    updatePerguntaAdmin,
    deletePerguntaAdmin
};
