const Sala = require('../models/Sala');
const Professor = require('../models/Professor');
const Pergunta = require('../models/Pergunta');

// --- "LOGIN" DO ALUNO (PARTE CRÍTICA) ---
const alunoLogin = async (req, res) => {
    try {
        const { codigoSala, RA } = req.body;
        if (!codigoSala || !RA) {
            return res.status(400).json({ message: 'Código da Sala e RA são obrigatórios.' });
        }
        
        // Esta é a parte mais importante. O .populate() aninhado
        // busca os dados completos de cada pergunta.
        const sala = await Sala.findById(codigoSala).populate({
            path: 'tarefas',
            populate: {
                path: 'perguntas.pergunta',
                model: 'Pergunta'
            }
        });

        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }
        
        const aluno = sala.alunos.find(a => a.RA === RA);
        if (!aluno) {
            return res.status(401).json({ message: 'RA não encontrado nesta sala.' });
        }
        
        res.status(200).json({
            success: true,
            aluno: { _id: aluno._id, nome: aluno.nome, RA: aluno.RA },
            tarefas: sala.tarefas
        });
    } catch (error) {
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


// --- OUTRAS FUNÇÕES (sem alterações) ---

const criarSala = async (req, res) => {
    try {
        const { num_serie } = req.body;
        if (!num_serie) return res.status(400).json({ message: 'O nome da sala é obrigatório.' });
        const salaExistente = await Sala.findOne({ num_serie });
        if (salaExistente) return res.status(409).json({ message: 'Uma sala com este nome já existe.' });
        const novaSala = await Sala.create({ num_serie, criador: req.professor._id });
        res.status(201).json(novaSala);
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const excluirSala = async (req, res) => {
    try {
        const sala = await Sala.findById(req.params.salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        if (!sala.criador.equals(req.professor._id)) return res.status(403).json({ message: 'Apenas o criador pode excluir a sala.' });
        await Sala.findByIdAndDelete(req.params.salaId);
        res.status(200).json({ message: 'Sala excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir sala:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const getTodasAsSalas = async (req, res) => {
    try {
        const salas = await Sala.find().populate('criador', 'name').sort({ createdAt: -1 });
        res.status(200).json(salas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getSalaDetalhes = async (req, res) => {
    try {
        const sala = await Sala.findById(req.params.salaId).populate('criador', 'name email').populate('editoresConvidados', 'name email');
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        res.status(200).json(sala);
    } catch (error) {
        console.error("Erro ao buscar detalhes da sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const convidarEditor = async (req, res) => {
    try {
        const { emailConvidado } = req.body;
        const sala = await Sala.findById(req.params.salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        if (!sala.criador.equals(req.professor._id)) return res.status(403).json({ message: 'Apenas o criador pode convidar.' });
        const professorConvidado = await Professor.findOne({ email: emailConvidado });
        if (!professorConvidado) return res.status(404).json({ message: `Professor com e-mail ${emailConvidado} não encontrado.` });
        if (sala.criador.equals(professorConvidado._id)) return res.status(400).json({ message: 'Não pode convidar a si mesmo.' });
        await Sala.updateOne({ _id: req.params.salaId }, { $addToSet: { editoresConvidados: professorConvidado._id } });
        const salaAtualizada = await Sala.findById(req.params.salaId).populate('editoresConvidados', 'name email');
        res.status(200).json(salaAtualizada);
    } catch (error) {
        console.error('Erro ao convidar editor:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const adicionarAluno = async (req, res) => {
    try {
        const { nome, RA } = req.body;
        const sala = await Sala.findById(req.params.salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para editar esta sala.' });

        const raExistente = sala.alunos.some(aluno => aluno.RA === RA);
        if (raExistente) return res.status(409).json({ message: 'Um aluno com este RA já existe nesta sala.' });

        sala.alunos.push({ nome, RA });
        await sala.save();
        res.status(201).json(sala);
    } catch (error) {
        console.error('Erro ao adicionar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const atualizarAluno = async (req, res) => {
    try {
        const { salaId, alunoId } = req.params;
        const { nome, RA } = req.body;

        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para editar.' });

        const aluno = sala.alunos.id(alunoId);
        if (!aluno) {
            return res.status(404).json({ message: 'Aluno não encontrado nesta sala.' });
        }
        aluno.nome = nome;
        aluno.RA = RA;
        await sala.save();
        res.status(200).json(sala);
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const excluirAluno = async (req, res) => {
    try {
        const { salaId, alunoId } = req.params;
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para excluir.' });
        const aluno = sala.alunos.id(alunoId);
         if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado para excluir.' });
        sala.alunos.pull(alunoId);
        await sala.save();
        res.status(200).json(sala);
    } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const adicionarTarefa = async (req, res) => {
    try {
        const { titulo, dataFechamento, horaFechamento } = req.body;
        const sala = await Sala.findById(req.params.salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Sem permissão para editar.' });
        sala.tarefas.push({ titulo, dataFechamento, horaFechamento });
        await sala.save();
        res.status(200).json(sala);
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const getTarefaDetalhes = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const sala = await Sala.findById(salaId).populate('tarefas.perguntas.pergunta');
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        res.status(200).json(tarefa);
    } catch (error) {
        console.error('Erro ao buscar detalhes da tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const criarPerguntaParaTarefa = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { texto, opcoes, opcaoCorreta } = req.body;
        const novaPergunta = await Pergunta.create({ texto, opcoes, opcaoCorreta });
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        tarefa.perguntas.push({ pergunta: novaPergunta._id });
        await sala.save();
        const tarefaAtualizada = await Sala.findById(salaId).populate('tarefas.perguntas.pergunta');
        res.status(201).json(tarefaAtualizada.tarefas.id(tarefaId));
    } catch (error) {
        console.error('Erro ao criar pergunta:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const getBancoDePerguntas = async (req, res) => {
    try {
        const perguntas = await Pergunta.find().sort({ createdAt: -1 });
        res.status(200).json(perguntas);
    } catch (error) {
        console.error('Erro ao buscar banco de perguntas:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const adicionarPerguntaDoBanco = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { perguntaId } = req.body;
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        const perguntaJaExiste = tarefa.perguntas.some(p => p.pergunta.equals(perguntaId));
        if(perguntaJaExiste) return res.status(409).json({ message: 'Esta pergunta já foi adicionada.' });
        tarefa.perguntas.push({ pergunta: perguntaId });
        await sala.save();
        const tarefaAtualizada = await Sala.findById(salaId).populate('tarefas.perguntas.pergunta');
        res.status(200).json(tarefaAtualizada.tarefas.id(tarefaId));
    } catch (error) {
        console.error('Erro ao adicionar pergunta do banco:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const salvarResultadoTarefa = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { alunoId, alunoNome, pontuacao, totalPerguntas } = req.body;

        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        
        // Verifica se já existe um resultado para este aluno
        const resultadoExistenteIndex = tarefa.resultados.findIndex(r => r.alunoId.equals(alunoId));

        const novoResultado = { alunoId, alunoNome, pontuacao, totalPerguntas, dataConclusao: new Date() };

        if (resultadoExistenteIndex > -1) {
            // Se já existe, atualiza o resultado (ex: se o aluno jogar de novo)
            tarefa.resultados[resultadoExistenteIndex] = novoResultado;
        } else {
            // Se não existe, adiciona um novo resultado
            tarefa.resultados.push(novoResultado);
        }

        await sala.save();
        res.status(200).json({ message: 'Resultado salvo com sucesso!' });

    } catch (error) {
        console.error('Erro ao salvar resultado:', error);
        res.status(500).json({ message: 'Erro no servidor ao salvar resultado.' });
    }
};


module.exports = {
    criarSala, excluirSala, getTodasAsSalas, getSalaDetalhes, convidarEditor,
    adicionarAluno, atualizarAluno, excluirAluno, alunoLogin,
    adicionarTarefa, getTarefaDetalhes,
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco,
    salvarResultadoTarefa
};
