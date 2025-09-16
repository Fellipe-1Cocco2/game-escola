const Professor = require('../models/Professor');


/**
 * Busca e retorna todos os alunos de todas as salas de todos os professores.
 */
const getAllAlunos = async (req, res) => {
    try {
        // Busca todos os professores para extrair os alunos
        const professores = await Professor.find().select('name salas');
        
        let todosOsAlunos = [];
        professores.forEach(professor => {
            professor.salas.forEach(sala => {
                // Adiciona informações de contexto a cada aluno para facilitar a exibição no admin
                sala.alunos.forEach(aluno => {
                    todosOsAlunos.push({
                        nome: aluno.nome,
                        RA: aluno.RA,
                        sala_id: sala._id,
                        sala_num_serie: sala.num_serie,
                        professor_nome: professor.name
                    });
                });
            });
        });

        res.status(200).json(todosOsAlunos);
    } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

/**
 * Busca e retorna todos os professores do banco de dados.
 */
const getAllProfessors = async (req, res) => {
    try {
        const professors = await Professor.find().select('-password'); // Exclui a senha da resposta
        res.status(200).json(professors);
    } catch (error) {
        console.error('Erro ao buscar professores:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
};

module.exports = {
    getAllAlunos,
    getAllProfessors
};

