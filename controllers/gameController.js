const Sala = require('../models/Sala');
const Professor = require('../models/Professor');

// --- Funções de Gestão de Sala (pelo Professor) ---

/**
 * Cria uma nova sala. O criador é o professor logado.
 */
const criarSala = async (req, res) => {
    try {
        const { num_serie } = req.body;
        if (!num_serie) {
            return res.status(400).json({ message: 'O nome da sala (número/série) é obrigatório.' });
        }

        // Verifica se o professor já tem uma sala com este nome
        const salaExistente = await Sala.findOne({ criador: req.professor._id, num_serie });
        if (salaExistente) {
            return res.status(409).json({ message: 'Você já possui uma sala com este nome.' });
        }

        const novaSala = await Sala.create({
            num_serie,
            criador: req.professor._id
        });

        res.status(201).json(novaSala);
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


/**
 * Busca todas as salas para exibir no dashboard.
 */
const getTodasAsSalas = async (req, res) => {
    try {
        const salas = await Sala.find().populate('criador', 'name').sort({ createdAt: -1 });
        res.status(200).json(salas);
    } catch (error) {
        console.error("Erro ao buscar todas as salas:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Busca os detalhes de uma sala específica.
 */
const getSalaDetalhes = async (req, res) => {
     try {
        const sala = await Sala.findById(req.params.salaId)
            .populate('criador', 'name email')
            .populate('editoresConvidados', 'name email');

        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }
        res.status(200).json(sala);
    } catch (error) {
        console.error("Erro ao buscar detalhes da sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Adiciona uma tarefa a uma sala, verificando a permissão.
 */
const adicionarTarefa = async (req, res) => {
    try {
        const { descricao } = req.body;
        const sala = await Sala.findById(req.params.salaId);

        if (!sala) { return res.status(404).json({ message: 'Sala não encontrada.' }); }

        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) { return res.status(403).json({ message: 'Você não tem permissão para editar esta sala.' }); }

        sala.tarefas.push({ descricao });
        await sala.save();
        res.status(200).json(sala);

    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


/**
 * Convida outro professor para ser editor de uma sala.
 */
const convidarEditor = async (req, res) => {
    try {
        const { emailConvidado } = req.body;
        const sala = await Sala.findById(req.params.salaId);

        if (!sala) { return res.status(404).json({ message: 'Sala não encontrada.' }); }
        if (!sala.criador.equals(req.professor._id)) { return res.status(403).json({ message: 'Apenas o criador da sala pode convidar editores.' }); }

        const professorConvidado = await Professor.findOne({ email: emailConvidado });
        if (!professorConvidado) { return res.status(404).json({ message: `Professor com o e-mail ${emailConvidado} não encontrado.` }); }
        if(sala.criador.equals(professorConvidado._id)) { return res.status(400).json({ message: 'Você não pode convidar a si mesmo.' }); }

        await Sala.updateOne({ _id: req.params.salaId }, { $addToSet: { editoresConvidados: professorConvidado._id } });
        const salaAtualizada = await Sala.findById(req.params.salaId).populate('editoresConvidados', 'name email');
        res.status(200).json(salaAtualizada);
    } catch (error) {
        console.error('Erro ao convidar editor:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


/**
 * Exclui uma sala, verificando se o usuário é o criador.
 */
const excluirSala = async (req, res) => {
    try {
        const sala = await Sala.findById(req.params.salaId);
        if (!sala) { return res.status(404).json({ message: 'Sala não encontrada.' }); }
        if (!sala.criador.equals(req.professor._id)) { return res.status(403).json({ message: 'Apenas o criador pode excluir a sala.' }); }

        await sala.deleteOne();
        res.status(200).json({ message: 'Sala excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir sala:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


// --- Funções de Gestão de Aluno (pelo Professor) ---

/**
 * Adiciona um novo aluno a uma sala específica.
 */
const adicionarAluno = async (req, res) => {
    try {
        const { nome, RA } = req.body;
        const sala = await Sala.findById(req.params.salaId);

        if (!sala) { return res.status(404).json({ message: 'Sala não encontrada.' }); }

        // Verifica permissão de edição
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) { return res.status(403).json({ message: 'Você não tem permissão para adicionar alunos a esta sala.' }); }
        
        // Verifica se o RA já existe na sala
        const raExistente = sala.alunos.some(aluno => aluno.RA === RA);
        if (raExistente) { return res.status(409).json({ message: 'Um aluno com este RA já está cadastrado nesta sala.' }); }

        sala.alunos.push({ nome, RA });
        await sala.save();
        res.status(201).json(sala);

    } catch (error) {
        console.error('Erro ao adicionar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// --- Funções de Acesso do Aluno ---

/**
 * "Login" do aluno. Verifica se o código da sala e o RA são válidos.
 */
const loginAluno = async (req, res) => {
    try {
        const { codigoSala, RA } = req.body;
        if (!codigoSala || !RA) { return res.status(400).json({ message: 'Código da Sala e RA são obrigatórios.' }); }

        const sala = await Sala.findById(codigoSala);
        if (!sala) { return res.status(404).json({ message: 'Código da Sala inválido.' }); }

        const aluno = sala.alunos.find(a => a.RA === RA);
        if (!aluno) { return res.status(401).json({ message: 'RA não encontrado nesta sala.' }); }

        // Se o login for bem-sucedido, retorna as tarefas da sala
        res.status(200).json({
            message: 'Login bem-sucedido!',
            aluno: aluno,
            tarefas: sala.tarefas
        });

    } catch (error) {
        // Trata o caso de um ID de sala com formato inválido
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Código da Sala inválido.' });
        }
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


module.exports = {
    criarSala,
    getTodasAsSalas,
    getSalaDetalhes,
    adicionarTarefa,
    convidarEditor,
    excluirSala,
    adicionarAluno,
    loginAluno
};

