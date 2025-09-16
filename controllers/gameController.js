const Professor = require('../models/Professor'); // O modelo de jogo foi removido, agora usamos o Professor

/**
 * Cria uma nova sala e a adiciona a um professor existente.
 */
const criarSala = async (req, res) => {
    try {
        // O ID do professor e os dados da sala virão no corpo da requisição
        const { professorId, num_serie, perguntas } = req.body;

        if (!professorId || !num_serie) {
            return res.status(400).json({ message: 'ID do professor e número/série da sala são obrigatórios.' });
        }

        const professor = await Professor.findById(professorId);

        if (!professor) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        // Adiciona a nova sala ao array de salas do professor
        professor.salas.push({
            num_serie: num_serie,
            perguntas: perguntas || [] // Garante que perguntas seja um array, mesmo que não seja enviado
        });

        // Salva o documento do professor com a nova sala
        await professor.save();
        
        // Retorna a última sala adicionada como confirmação
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
    try {
        const { salaId } = req.params;
        const { nome, RA } = req.body;

        if (!nome || !RA) {
            return res.status(400).json({ message: 'Nome e RA do aluno são obrigatórios.' });
        }

        // Encontra o professor que possui a sala com o ID fornecido
        const professor = await Professor.findOne({ 'salas._id': salaId });

        if (!professor) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }

        // Encontra a sala específica dentro do array de salas do professor
        const sala = professor.salas.id(salaId);
        
        // Adiciona o novo aluno ao array de alunos da sala
        sala.alunos.push({ nome, RA });

        // Salva o documento do professor com o novo aluno
        await professor.save();

        res.status(200).json(sala);

    } catch (error) {
        console.error('Erro ao adicionar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

module.exports = {
    criarSala,
    adicionarAluno
};

