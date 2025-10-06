const Sala = require('../models/Sala');
const Professor = require('../models/Professor');
const Pergunta = require('../models/Pergunta');
const Aluno = require('../models/Aluno');

// --- "LOGIN" DO ALUNO (PARTE CRÍTICA) ---
const alunoLogin = async (req, res) => {
    try {
        const { codigoSala, RA } = req.body;
        if (!codigoSala || !RA) {
            return res.status(400).json({ message: 'Código da Sala e RA são obrigatórios.' });
        }
        
        const aluno = await Aluno.findOne({ RA });
        if (!aluno) {
            return res.status(401).json({ message: 'RA inválido ou não cadastrado no sistema.' });
        }
        
        const sala = await Sala.findOne({ 
            _id: codigoSala, 
            alunos: aluno._id
        }).populate({
            path: 'tarefas',
            populate: {
                path: 'perguntas.pergunta', // Popula os detalhes das perguntas dentro das tarefas
                model: 'Pergunta'
            }
        });

        if (!sala) {
            return res.status(404).json({ message: 'RA não encontrado nesta sala ou código da sala inválido.' });
        }
        
        // --- INÍCIO DA CORREÇÃO ---
        // Convertemos o documento do Mongoose para um objeto JavaScript simples para podermos modificá-lo
        const salaObject = sala.toObject();

        // Adicionamos a propriedade 'salaId' em cada tarefa antes de enviar para o frontend
        salaObject.tarefas = salaObject.tarefas.map(tarefa => ({
            ...tarefa,
            salaId: sala._id 
        }));
        // --- FIM DA CORREÇÃO ---

        res.status(200).json({
            success: true,
            aluno: { _id: aluno._id, nome: aluno.nome, RA: aluno.RA },
            tarefas: salaObject.tarefas // Enviamos as tarefas modificadas
        });

    } catch (error) {
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const salvarProgressoAluno = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { alunoId, perguntaId, respostaIndex, acertou, pontuacaoAtual } = req.body;

        // 1. Encontra a sala
        const sala = await Sala.findById(salaId);
        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }

        // 2. Encontra a tarefa específica dentro da sala
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }

        // 3. Encontra o progresso para este aluno específico
        let progresso = tarefa.progressos.find(p => p.alunoId.equals(alunoId));

        // 4. Se não houver progresso, cria um novo
        if (!progresso) {
            tarefa.progressos.push({ 
                alunoId: alunoId, 
                status: 'em-andamento', 
                respostas: [], 
                pontuacao: 0 
            });
            // Pega a referência para o progresso recém-criado
            progresso = tarefa.progressos[tarefa.progressos.length - 1];
        }

        // 5. Adiciona a nova resposta e atualiza a pontuação
        progresso.respostas.push({ perguntaId, respostaIndex, acertou });
        progresso.pontuacao = pontuacaoAtual;

        // 6. Verifica se a tarefa foi concluída
        // Compara o número de respostas com o número total de perguntas da tarefa
        if (progresso.respostas.length >= tarefa.perguntas.length) {
            progresso.status = 'concluido';
            progresso.dataConclusao = new Date();
        }

        // 7. Salva o documento principal da sala com todas as alterações
        await sala.save();

        res.status(200).json({ message: 'Progresso salvo com sucesso!' });

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        res.status(500).json({ message: 'Erro no servidor ao salvar progresso.' });
    }
};

const getTarefasDaSala = async (req, res) => {
    try {
        const { salaId } = req.params;
        const sala = await Sala.findById(salaId)
            .populate({
                path: 'tarefas',
                populate: {
                    path: 'perguntas.pergunta',
                    model: 'Pergunta'
                }
            });

        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }

        // Adiciona o salaId a cada tarefa para uso no frontend
        const tarefasComSalaId = sala.tarefas.map(tarefa => ({
            ...tarefa.toObject(),
            salaId: sala._id
        }));
        
        res.status(200).json(tarefasComSalaId);

    } catch (error) {
        console.error('Erro ao buscar tarefas da sala:', error);
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
        const sala = await Sala.findById(req.params.salaId)
            .populate('criador', 'name email')
            .populate('editoresConvidados', 'name email')
            .populate('alunos'); // Adicionado o .populate() para buscar os dados dos alunos

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

const cadastrarEAdicionarAluno = async (req, res) => {
    try {
        const { nome, RA } = req.body;
        const { salaId } = req.params;
        
        const alunoExistente = await Aluno.findOne({ RA });
        if (alunoExistente) {
            return res.status(409).json({ message: 'Um aluno com este RA já existe. Use a função "Vincular Aluno".' });
        }

        const novoAluno = await Aluno.create({ nome, RA });

        await Sala.findByIdAndUpdate(salaId, { $push: { alunos: novoAluno._id } });
        
        res.status(201).json(novoAluno);
    } catch (error) {
        console.error('Erro ao cadastrar e adicionar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const vincularAlunoExistente = async (req, res) => {
    try {
        const { RA } = req.body;
        const { salaId } = req.params;

        const aluno = await Aluno.findOne({ RA });
        if (!aluno) {
            return res.status(404).json({ message: 'Nenhum aluno encontrado com este RA.' });
        }

        const salaOndeAlunoJaEsta = await Sala.findOne({ alunos: aluno._id });
        if (salaOndeAlunoJaEsta) {
            if (salaOndeAlunoJaEsta._id.equals(salaId)) {
                return res.status(409).json({ message: `Este aluno já está nesta sala (${salaOndeAlunoJaEsta.num_serie}).` });
            }
            return res.status(409).json({ message: `Este aluno já está vinculado à sala "${salaOndeAlunoJaEsta.num_serie}". Não é possível adicioná-lo em duas salas.` });
        }

        await Sala.findByIdAndUpdate(salaId, { $push: { alunos: aluno._id } });

        res.status(200).json(aluno);
    } catch (error) {
        console.error('Erro ao vincular aluno:', error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao tentar vincular o aluno.' });
    }
};

const atualizarAluno = async (req, res) => {
    try {
        const { salaId, alunoId } = req.params;
        const { nome, RA } = req.body;

        // 1. Verificação de Permissão (continua importante)
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para editar nesta sala.' });

        // 2. Lógica Corrigida: Atualiza o documento do Aluno diretamente
        const alunoAtualizado = await Aluno.findByIdAndUpdate(alunoId, { nome, RA }, { new: true, runValidators: true });

        if (!alunoAtualizado) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }
        
        // 3. Retorna o aluno com os novos dados
        res.status(200).json(alunoAtualizado);

    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar aluno.' });
    }
};

const excluirAluno = async (req, res) => {
    try {
        const { salaId, alunoId } = req.params;
        
        // Apenas remove o ID do aluno do array da sala
        await Sala.findByIdAndUpdate(salaId, {
            $pull: { alunos: alunoId }
        });

        res.status(200).json({ message: 'Aluno desvinculado da sala com sucesso.' });
    } catch (error) {
        console.error('Erro ao desvincular aluno:', error);
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

        // 1. Busca a sala e popula a lista de TODOS os alunos matriculados nela
        const sala = await Sala.findById(salaId).populate('alunos', 'nome RA');
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        // 2. Encontra a tarefa específica dentro da sala, populando os dados de progresso
        const tarefa = await Sala.findOne({ "_id": salaId, "tarefas._id": tarefaId })
            .populate({
                path: 'tarefas',
                match: { _id: tarefaId }, // Garante que estamos pegando a tarefa certa
                populate: [
                    { path: 'perguntas.pergunta', model: 'Pergunta' },
                    { path: 'progressos.alunoId', model: 'Aluno', select: 'nome RA' }
                ]
            })
            .then(s => s.tarefas.id(tarefaId));

        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        // 3. CRIA A LISTA DE RESULTADOS COMPLETA
        const agora = new Date();
        const tarefaEncerrada = tarefa.dataFechamento && agora > new Date(tarefa.dataFechamento);

        const resultadosCompletos = sala.alunos.map(aluno => {
            const progresso = tarefa.progressos.find(p => p.alunoId && p.alunoId.equals(aluno._id));

            if (progresso) {
                // Se o aluno tem progresso, retorna os dados
                return {
                    alunoId: aluno._id,
                    nome: aluno.nome,
                    RA: aluno.RA,
                    status: progresso.status,
                    pontuacao: progresso.pontuacao,
                    respostasDadas: progresso.respostas.length
                };
            } else {
                // Se o aluno não tem progresso
                return {
                    alunoId: aluno._id,
                    nome: aluno.nome,
                    RA: aluno.RA,
                    // Define o status com base na data de encerramento da tarefa
                    status: tarefaEncerrada ? 'nao-entregue' : 'nao-iniciado',
                    pontuacao: 0,
                    respostasDadas: 0
                };
            }
        });

        // 4. Monta o objeto final para enviar ao frontend
        const tarefaFinal = tarefa.toObject();
        tarefaFinal.resultadosCompletos = resultadosCompletos;

        res.status(200).json(tarefaFinal);

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

        // A linha abaixo está corrigida para enviar o objeto
        tarefa.perguntas.push({ pergunta: novaPergunta._id });
        await sala.save();

        // A linha abaixo usa o populate correto
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

        // A linha abaixo está corrigida para enviar o objeto
        tarefa.perguntas.push({ pergunta: perguntaId });
        await sala.save();
        
        // A linha abaixo usa o populate correto
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
    alunoLogin,
    cadastrarEAdicionarAluno,
    vincularAlunoExistente,
    atualizarAluno, 
    excluirAluno,
    adicionarTarefa, getTarefaDetalhes, getTarefasDaSala,
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco,
    salvarProgressoAluno
};
