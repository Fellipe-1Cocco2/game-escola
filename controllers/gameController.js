const { GoogleGenerativeAI } = require('@google/generative-ai'); // Importação da IA
const Sala = require('../models/Sala');
const Professor = require('../models/Professor');
const Pergunta = require('../models/Pergunta');
const Aluno = require('../models/Aluno');

// Configuração da IA (deve vir após as importações)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


const removerPerguntaDaTarefa = async (req, res) => {
    try {
        const { salaId, tarefaId, perguntaId } = req.params;

        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        // Remove a pergunta do array 'perguntas' da tarefa
        // Usamos $pull para remover o objeto que contém a referência à pergunta
        await Sala.updateOne(
            { "_id": salaId, "tarefas._id": tarefaId },
            { $pull: { "tarefas.$.perguntas": { pergunta: perguntaId } } }
        );

        // Busca a tarefa atualizada para retornar ao frontend
        const tarefaAtualizada = await Sala.findById(salaId)
            .populate({ path: 'tarefas.perguntas.pergunta', model: 'Pergunta' })
            .then(s => s.tarefas.id(tarefaId));

        res.status(200).json(tarefaAtualizada);

    } catch (error) {
        console.error('Erro ao remover pergunta da tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor ao remover pergunta.' });
    }
};


// --- FUNÇÕES DE SALA ---
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
            .populate('alunos'); 

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

// --- FUNÇÕES DE LOGIN DE ALUNO ---
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
                path: 'perguntas.pergunta',
                model: 'Pergunta'
            }
        });

        if (!sala) {
            return res.status(404).json({ message: 'RA não encontrado nesta sala ou código da sala inválido.' });
        }
        
        const salaObject = sala.toObject();
        salaObject.tarefas = salaObject.tarefas.map(tarefa => ({
            ...tarefa,
            salaId: sala._id 
        }));

        res.status(200).json({
            success: true,
            aluno: { _id: aluno._id, nome: aluno.nome, RA: aluno.RA },
            tarefas: salaObject.tarefas
        });

    } catch (error) {
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// --- FUNÇÕES DE GERENCIAMENTO DE ALUNOS ---
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

        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para editar nesta sala.' });

        const alunoAtualizado = await Aluno.findByIdAndUpdate(alunoId, { nome, RA }, { new: true, runValidators: true });

        if (!alunoAtualizado) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }
        
        res.status(200).json(alunoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar aluno.' });
    }
};

const excluirAluno = async (req, res) => {
    try {
        const { salaId, alunoId } = req.params;
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para excluir.' });
        
        await Sala.findByIdAndUpdate(salaId, { $pull: { alunos: alunoId } });

        res.status(200).json({ message: 'Aluno desvinculado da sala com sucesso.' });
    } catch (error) {
        console.error('Erro ao desvincular aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// --- FUNÇÕES DE TAREFA E PROGRESSO ---
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

        const sala = await Sala.findById(salaId).populate('alunos', 'nome RA');
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        const tarefa = await Sala.findOne({ "_id": salaId, "tarefas._id": tarefaId })
            .populate({
                path: 'tarefas',
                match: { _id: tarefaId }, 
                populate: [
                    { path: 'perguntas.pergunta', model: 'Pergunta' },
                    { path: 'progressos.alunoId', model: 'Aluno', select: 'nome RA' }
                ]
            })
            .then(s => s.tarefas.id(tarefaId));

        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        const agora = new Date();
        const tarefaEncerrada = tarefa.dataFechamento && agora > new Date(tarefa.dataFechamento);

        const resultadosCompletos = sala.alunos.map(aluno => {
            const progresso = tarefa.progressos.find(p => p.alunoId && p.alunoId.equals(aluno._id));

            if (progresso) {
                return {
                    alunoId: aluno._id, nome: aluno.nome, RA: aluno.RA,
                    status: progresso.status,
                    pontuacao: progresso.pontuacao,
                    respostasDadas: progresso.respostas.length
                };
            } else {
                return {
                    alunoId: aluno._id, nome: aluno.nome, RA: aluno.RA,
                    status: tarefaEncerrada ? 'nao-entregue' : 'nao-iniciado',
                    pontuacao: 0,
                    respostasDadas: 0
                };
            }
        });

        const tarefaFinal = tarefa.toObject();
        tarefaFinal.resultadosCompletos = resultadosCompletos;

        res.status(200).json(tarefaFinal);

    } catch (error) {
        console.error('Erro ao buscar detalhes da tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
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

const salvarProgressoAluno = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { alunoId, perguntaId, respostaIndex, acertou, pontuacaoAtual } = req.body;

        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        let progresso = tarefa.progressos.find(p => p.alunoId.equals(alunoId));

        if (!progresso) {
            tarefa.progressos.push({ 
                alunoId: alunoId, 
                status: 'em-andamento', 
                respostas: [], 
                pontuacao: 0 
            });
            progresso = tarefa.progressos[tarefa.progressos.length - 1];
        }

        progresso.respostas.push({ perguntaId, respostaIndex, acertou });
        progresso.pontuacao = pontuacaoAtual;

        if (progresso.respostas.length >= tarefa.perguntas.length) {
            progresso.status = 'concluido';
            progresso.dataConclusao = new Date();
        }

        await sala.save();
        res.status(200).json({ message: 'Progresso salvo com sucesso!' });

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        res.status(500).json({ message: 'Erro no servidor ao salvar progresso.' });
    }
};

// --- FUNÇÕES DE PERGUNTAS ---
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

// --- FUNÇÃO DE IA (CORRIGIDA) ---

// --- NOVO MASTER PROMPT COM INTELIGÊNCIA DE DATA ---
const masterPrompt = `
Hoje é [DATA_ATUAL_ISO]. Você é um assistente de criação de quizzes para professores. Sua função é preencher 5 campos: "titulo", "dataFechamento", "horaFechamento", "numPerguntas" e "topico".

1.  **Regra de Ouro:** Aceite respostas diretas (ex: "Sistema Solar" ou "22:00").

2.  **Inteligência de Data (IMPORTANTE):**
    * Sua referência é a data de hoje: [DATA_ATUAL_ISO].
    * Você DEVE converter linguagem natural e formatos brasileiros para o formato YYYY-MM-DD.
    * Exemplos: Se hoje for 24/10/2025 e o professor disser...
        * "amanhã": Calcule e use "2025-10-25".
        * "depois de amanhã": Calcule e use "2025-10-26".
        * "30/10": Use "2025-10-30" (assuma o ano atual).
        * "30/10/25": Use "2025-10-30".
        * "30/10/2025": Use "2025-10-30".
    * **Validação:** A "dataFechamento" DEVE ser hoje ou no futuro. NUNCA no passado. Se o professor disser "ontem" ou uma data passada (ex: "20/10/2025"), informe que a data é inválida e peça uma data futura.

3.  **Fluxo de Conversa:** Se faltar um campo, faça UMA ÚNICA pergunta para obtê-lo.

4.  **Formatos Finais:** O formato final da data DEVE ser YYYY-MM-DD. O formato da hora DEVE ser HH:MM.

5.  **Finalização:** Quando você tiver todos os 5 campos, pergunte ao professor sobre o nível de dificuldade ou estilo das perguntas (ex: "Entendido. Como devem ser as perguntas? Fáceis, difíceis, de múltipla escolha?").

6.  **Geração:** Após o professor responder sobre o estilo, gere o quiz.

7.  **Formato de Resposta (JSON):** Sempre responda em um formato JSON.

Formato de resposta se os dados estiverem incompletos:
{ "status": "incompleto", "proximaPergunta": "Sua pergunta para o professor aqui." }

Formato de resposta quando a IA estiver pronta para gerar as perguntas:
{
  "status": "completo",
  "tarefa": {
    "titulo": "...",
    "dataFechamento": "YYYY-MM-DD",
    "horaFechamento": "HH:MM",
    "topico": "...",
    "perguntas": [
      { "texto": "Pergunta 1?", "opcoes": ["A", "B", "C", "D"], "opcaoCorreta": 0 },
      { "texto": "Pergunta 2?", "opcoes": ["A", "B", "C", "D"], "opcaoCorreta": 3 }
    ]
  }
}
`;

const gerarTarefaComIA = async (req, res) => {
    try {
        const { salaId } = req.params;
        const { historicoChat } = req.body; 

        // --- NOVA LINHA: INJETA A DATA ATUAL NO PROMPT ---
        // Pega a data atual no fuso horário de São Paulo (ou ajuste o seu)
        const hojeISO = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).toISOString();
        const promptComData = masterPrompt.replace(/\[DATA_ATUAL_ISO\]/g, hojeISO);

        const historyForAI = [
            { role: "user", parts: [{ text: promptComData }] }, // Usa o prompt atualizado
            ...historicoChat.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }))
        ];

        const chat = model.startChat({ history: historyForAI });
        const ultimaMensagemTexto = historicoChat[historicoChat.length - 1].text;
        const result = await chat.sendMessage(ultimaMensagemTexto);
        const responseText = result.response.text();
        
        let aiResponse;
        
        try {
            const cleanedText = responseText
                .replace("```json", "") 
                .replace("```", "")     
                .trim();                

            aiResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Erro ao parsear JSON da IA (texto original):", responseText);
            return res.status(500).json({ message: "A IA retornou um formato de JSON inválido." });
        }

        if (aiResponse.status === 'completo') {
            const { titulo, dataFechamento, horaFechamento, perguntas } = aiResponse.tarefa;

            const perguntasCriadas = await Pergunta.insertMany(perguntas);
            const perguntasIds = perguntasCriadas.map(p => ({ pergunta: p._id }));

            const sala = await Sala.findById(salaId);
            if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

            sala.tarefas.push({
                titulo,
                dataFechamento,
                horaFechamento,
                perguntas: perguntasIds
            });
            await sala.save();
        }

        res.status(200).json(aiResponse);

    } catch (error) {
        console.error('Erro no controlador de IA:', error);
        res.status(500).json({ message: 'Erro interno no servidor de IA.' });
    }
};


// --- EXPORTAÇÕES ---
module.exports = {
    criarSala, excluirSala, getTodasAsSalas, getSalaDetalhes, convidarEditor,
    alunoLogin,
    cadastrarEAdicionarAluno,
    vincularAlunoExistente,
    atualizarAluno, 
    excluirAluno,
    adicionarTarefa, getTarefaDetalhes, getTarefasDaSala,
    criarPerguntaParaTarefa, getBancoDePerguntas, adicionarPerguntaDoBanco,
    salvarProgressoAluno,
    gerarTarefaComIA, removerPerguntaDaTarefa
};