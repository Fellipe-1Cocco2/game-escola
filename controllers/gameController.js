const Professor = require('../models/Professor');

/**
 * Cria uma nova sala e a adiciona a um professor existente.
 */
const criarSala = async (req, res) => {
    try {
        const { num_serie } = req.body;
        const professorId = req.professor._id; // ID vem do middleware de proteção

        if (!num_serie) {
            return res.status(400).json({ message: 'O número/série da sala é obrigatório.' });
        }

        const professor = await Professor.findById(professorId);
        if (!professor) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        professor.salas.push({ num_serie, tarefas: [], alunos: [] });
        await professor.save();
        
        const novaSala = professor.salas[professor.salas.length - 1];
        res.status(201).json(novaSala);
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Adiciona um aluno a uma sala específica.
 */
const adicionarAluno = async (req, res) => {
    // Implementação existente...
};

/**
 * (NOVO) Busca os detalhes de uma sala específica.
 */
const getSalaById = async (req, res) => {
    try {
        const { salaId } = req.params;
        const professor = await Professor.findOne({ _id: req.professor._id, 'salas._id': salaId });

        if (!professor) {
            return res.status(404).json({ message: 'Sala não encontrada ou não pertence a este professor.' });
        }

        const sala = professor.salas.id(salaId);
        res.status(200).json(sala);
    } catch (error) {
        console.error('Erro ao buscar detalhes da sala:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

/**
 * (NOVO) Adiciona uma nova tarefa a uma sala específica.
 */
const adicionarTarefa = async (req, res) => {
    try {
        const { salaId } = req.params;
        const { texto } = req.body;

        if (!texto) {
            return res.status(400).json({ message: 'O texto da tarefa é obrigatório.' });
        }

        const professor = await Professor.findOne({ _id: req.professor._id, 'salas._id': salaId });

        if (!professor) {
            return res.status(404).json({ message: 'Sala não encontrada ou não pertence a este professor.' });
        }

        const sala = professor.salas.id(salaId);
        sala.tarefas.push({ texto });
        await professor.save();

        const novaTarefa = sala.tarefas[sala.tarefas.length - 1];
        res.status(201).json(novaTarefa);
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


module.exports = {
    criarSala,
    adicionarAluno,
    getSalaById,    // Exporta a nova função
    adicionarTarefa // Exporta a nova função
};

