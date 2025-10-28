const { GoogleGenerativeAI } = require('@google/generative-ai'); // Importação da IA
const Sala = require('../models/Sala');
const Professor = require('../models/Professor');
const Pergunta = require('../models/Pergunta');
const Aluno = require('../models/Aluno');

let gerarCodigoCurto;


// Configuração da IA (deve vir após as importações)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


function gerarParteAleatoria(){
    return gerarCodigoCurto();
}


(async () => {
  try {
    const nanoidModule = await import('nanoid'); // Importa dinamicamente
    // Atribui a função customAlphabet à variável
    gerarCodigoCurto = nanoidModule.customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);
    console.log('nanoid carregado com sucesso.'); // Log para confirmar
  } catch (err) {
    console.error('Erro ao carregar nanoid dinamicamente:', err);
  }
})();


const getRankingDaSala = async (req, res) => {
    try {
        const { salaId } = req.params;

        // Busca a sala e popula os alunos para pegar nomes/RAs
        // Não precisa popular tarefas/perguntas aqui
        const sala = await Sala.findById(salaId).populate('alunos', 'nome RA');

        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }

        // Cria um mapa para acumular a pontuação total de cada aluno
        const pontuacoes = new Map(); // Usaremos o ID do aluno como chave

        // Inicializa o mapa com todos os alunos da sala (garante que alunos sem pontos apareçam)
        sala.alunos.forEach(aluno => {
            if (aluno && aluno._id) { // Garante que o aluno populado é válido
                 pontuacoes.set(aluno._id.toString(), {
                     alunoId: aluno._id,
                     nome: aluno.nome,
                     RA: aluno.RA,
                     pontuacaoTotal: 0
                 });
            }
        });

        // Itera sobre cada tarefa da sala
        for (const tarefa of sala.tarefas) {
            // Itera sobre o progresso de cada aluno naquela tarefa
            if (tarefa.progressos && tarefa.progressos.length > 0) {
                for (const progresso of tarefa.progressos) {
                    if (progresso.alunoId && progresso.pontuacao) {
                        const alunoIdStr = progresso.alunoId.toString();
                        // Se o aluno ainda está no mapa (não foi removido da sala?)
                        if (pontuacoes.has(alunoIdStr)) {
                            // Soma a pontuação da tarefa à pontuação total
                            pontuacoes.get(alunoIdStr).pontuacaoTotal += progresso.pontuacao;
                        }
                    }
                }
            }
        }

        // Converte o mapa em um array
        const rankingArray = Array.from(pontuacoes.values());

        // Ordena o array pela pontuação total (maior primeiro)
        rankingArray.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

        // Retorna o ranking ordenado
        res.status(200).json(rankingArray);

    } catch (error) {
        console.error('Erro ao calcular ranking da sala:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao calcular ranking.' });
    }
};


const excluirTarefa = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;

        // Encontra a sala
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        // Verifica permissão (criador ou editor) - IMPORTANTE!
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Sem permissão para excluir tarefas nesta sala.' });

        // Encontra a tarefa específica para garantir que existe antes de remover
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        // Remove a tarefa do array usando $pull
        // O Mongoose sabe como remover o subdocumento pelo _id
        await Sala.updateOne(
            { _id: salaId },
            { $pull: { tarefas: { _id: tarefaId } } }
        );

        // Não precisamos retornar a sala inteira aqui, apenas sucesso
        res.status(200).json({ message: 'Tarefa excluída com sucesso.' });

    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor ao excluir tarefa.' });
    }
};


const importarAlunos = async (req, res) => {
    try {
        const { salaId } = req.params;
        const { alunos } = req.body; // Recebe o array [{nome: '..', RA: '..'}, ...]

        // Validações básicas
        if (!alunos || !Array.isArray(alunos) || alunos.length === 0) {
            return res.status(400).json({ message: 'Nenhum dado de aluno recebido para importação.' });
        }

        // Encontra a sala
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        // Verifica permissão (criador ou editor)
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Sem permissão para adicionar alunos nesta sala.' });

        let alunosAdicionadosCount = 0;
        let alunosVinculadosCount = 0;
        let errosCount = 0;
        const idsAlunosParaVincular = []; // Guarda os IDs dos alunos (novos e existentes)

        // Itera sobre cada aluno da planilha
        for (const alunoData of alunos) {
            const { nome, RA } = alunoData;

            // Valida se nome e RA não estão vazios (já filtrado no frontend, mas bom verificar)
            if (!nome || !RA) {
                console.warn(`Registro ignorado (nome ou RA vazio): ${JSON.stringify(alunoData)}`);
                errosCount++;
                continue; // Pula para o próximo aluno
            }

            try {
                // Tenta encontrar um aluno existente pelo RA
                let aluno = await Aluno.findOne({ RA });

                if (aluno) {
                    // Aluno já existe no sistema, apenas pega o ID
                    idsAlunosParaVincular.push(aluno._id);
                    alunosVinculadosCount++; // Conta como vinculado (mesmo que já estivesse na sala)
                } else {
                    // Aluno não existe, cria um novo
                    const novoAluno = await Aluno.create({ nome, RA });
                    idsAlunosParaVincular.push(novoAluno._id);
                    alunosAdicionadosCount++;
                }
            } catch (error) {
                // Erro ao criar aluno (provavelmente RA duplicado se outro processo criou ao mesmo tempo)
                if (error.code === 11000 && error.keyPattern && error.keyPattern.RA) {
                     console.warn(`RA ${RA} já existe (concorrência ou erro anterior?), tentando vincular.`);
                     // Tenta buscar novamente para garantir
                     let alunoExistente = await Aluno.findOne({ RA });
                     if(alunoExistente) {
                         idsAlunosParaVincular.push(alunoExistente._id);
                         alunosVinculadosCount++;
                     } else {
                         errosCount++; // Se ainda não encontrar, conta como erro
                     }
                } else {
                    console.error(`Erro ao processar aluno ${nome} (RA: ${RA}):`, error);
                    errosCount++;
                }
            }
        } // Fim do loop for

        // Adiciona TODOS os IDs encontrados/criados à sala de uma vez
        // $addToSet garante que não haverá IDs duplicados DENTRO da sala
        if (idsAlunosParaVincular.length > 0) {
            await Sala.findByIdAndUpdate(salaId, { $addToSet: { alunos: { $each: idsAlunosParaVincular } } });
        }

        // Monta a mensagem de resposta
        let message = '';
        if (alunosAdicionadosCount > 0) message += `${alunosAdicionadosCount} novos alunos cadastrados. `;
        if (alunosVinculadosCount > 0) message += `${alunosVinculadosCount} alunos existentes vinculados. `;
        if (errosCount > 0) message += `${errosCount} registros ignorados por erros ou dados inválidos.`;
        if (message === '') message = 'Nenhum aluno processado.';

        res.status(200).json({ message: message.trim() });

    } catch (error) {
        console.error('Erro geral ao importar alunos:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao importar alunos.' });
    }
};


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

function extrairPrefixoCodigo(numSerie) {
    // Regex atualizado para aceitar "Infantil X", "Xº ano", ou "Xª série"
    // Grupo 1: Pode ser (?:Infantil\s+(\d+)) OU (\d+)
    // Grupo 2: (?:º ano|ª série)? - Torna "º ano" ou "ª série" opcional (para o caso Infantil)
    // Grupo 3: ([A-Z]) - A letra da turma
    const match = numSerie.match(/^(?:(?:Infantil\s+(\d+))|(\d+))\s*(?:º ano|ª série)?\s*-\s*Turma\s*([A-Z])$/i);

    if (match && match[3]) { // Precisa ter encontrado a Turma (grupo 3)
        const turma = match[3].toUpperCase();
        let numero;

        if (match[1]) { // Se encontrou "Infantil X" (grupo 1)
            numero = `I${match[1]}`; // Usa "I" + número
        } else if (match[2]) { // Se encontrou "Xº ano" ou "Xª série" (grupo 2)
            numero = match[2]; // Usa só o número
        }

        if (numero) {
            return `${numero}${turma}`; // Retorna, ex: "I1A", "9B"
        }
    }

    // Se não encontrou nenhum padrão válido
    console.warn(`Formato de num_serie não reconhecido para extrair prefixo: "${numSerie}"`);
    return null;
}

const criarSala = async (req, res) => {
    try {
        const { num_serie } = req.body;
        if (!num_serie) {
            return res.status(400).json({ message: 'O nome da sala é obrigatório.' });
        }

        // --- EXTRAÇÃO DO PREFIXO ---
        const prefixo = extrairPrefixoCodigo(num_serie);
        if (!prefixo) {
            // Se o nome da sala não estiver no formato esperado, retorna um erro
            return res.status(400).json({ message: 'Formato inválido para nome da sala. Use o padrão "Xº ano - Turma Y" ou "Xª série - Turma Y".' });
        }
        // --- FIM DA EXTRAÇÃO ---

        // --- Lógica de validação da escola (mantém a sua) ---
        const professorLogadoId = req.professor._id;
        const professorLogado = await Professor.findById(professorLogadoId);
        if (!professorLogado || !professorLogado.school) {
            return res.status(400).json({ message: 'Professor não encontrado ou não associado a uma escola.' });
        }
        const escolaId = professorLogado.school;
        const professoresDaEscola = await Professor.find({ school: escolaId }).select('_id');
        const idsProfessoresDaEscola = professoresDaEscola.map(p => p._id);

        const salaExistenteNaEscola = await Sala.findOne({
            num_serie: num_serie, // Mesmo nome
            criador: { $in: idsProfessoresDaEscola } // Criador pertence à mesma escola
        });

        if (salaExistenteNaEscola) {
             return res.status(409).json({ message: `Uma sala com o nome "${num_serie}" já existe nesta escola.` });
        }
        // --- Fim da validação ---

        // --- GERAÇÃO DO CÓDIGO CURTO COM PREFIXO ---
        let codigoUnico = false;
        let novoCodigoCurtoCompleto = '';
        while (!codigoUnico) {
            const parteAleatoria = gerarParteAleatoria(); // Gera "XXXX"
            novoCodigoCurtoCompleto = `${prefixo}-${parteAleatoria}`; // Combina: "1B-XXXX"

            // Verifica se o código COMPLETO já existe
            const codigoExistente = await Sala.findOne({ codigoCurto: novoCodigoCurtoCompleto });
            if (!codigoExistente) {
                codigoUnico = true; // Encontrou um código único!
            }
            // Se já existir, o loop gera uma nova parteAleatoria e tenta de novo
        }
        // --- FIM DA GERAÇÃO ---

        // Cria a nova sala com o código curto formatado
        const novaSala = await Sala.create({
            num_serie,
            criador: req.professor._id,
            codigoCurto: novoCodigoCurtoCompleto // Salva o código "1B-XXXX"
        });
        res.status(201).json(novaSala);

    } catch (error) {
        console.error("Erro ao criar sala:", error);
        res.status(500).json({ message: 'Erro interno no servidor ao criar sala.' });
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

// --- FUNÇÃO getTodasAsSalas MODIFICADA ---
const getTodasAsSalas = async (req, res) => {
    try {
        // 1. Obter o ID do professor logado
        const professorLogadoId = req.professor._id;

        // 2. Buscar o professor logado para encontrar o ID da escola dele
        const professorLogado = await Professor.findById(professorLogadoId).select('school'); // Seleciona só o campo school
        if (!professorLogado || !professorLogado.school) {
            console.warn(`Professor ${professorLogadoId} não encontrado ou sem escola associada.`);
            return res.status(200).json([]); // Retorna lista vazia se não tiver escola
        }
        const escolaId = professorLogado.school;

        // 3. Encontrar TODOS os professores que pertencem a ESSA escola
        const professoresDaEscola = await Professor.find({ school: escolaId }).select('_id');
        const idsProfessoresDaEscola = professoresDaEscola.map(p => p._id);
        if (idsProfessoresDaEscola.length === 0) {
             return res.status(200).json([]); // Retorna lista vazia se não houver professores na escola
        }


        // 4. Buscar apenas as salas cujo 'criador' está na lista de IDs de professores da escola
        const salas = await Sala.find({ criador: { $in: idsProfessoresDaEscola } })
            .populate('criador', 'name _id') // Popula criador (nome e ID)
            // IMPORTANTE: Busca os IDs dos editores para a verificação no frontend
            .select('-tarefas -alunos') // Opcional: Otimiza removendo arrays grandes se não usados no card
            .sort({ createdAt: -1 });

        // 5. Retornar a lista COMPLETA de salas da escola
        res.status(200).json(salas);

    } catch (error) {
        console.error("Erro ao buscar salas da escola:", error);
        res.status(500).json({ message: 'Erro interno no servidor ao buscar salas.' });
    }
};
// --- FIM DA MODIFICAÇÃO ---

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
        const { codigoSala, RA } = req.body; // 'codigoSala' agora será o código CURTO (ex: ABCD)
        if (!codigoSala || !RA) {
            return res.status(400).json({ message: 'Código da Sala e RA são obrigatórios.' });
        }

        const aluno = await Aluno.findOne({ RA });
        if (!aluno) {
            return res.status(401).json({ message: 'RA inválido ou não cadastrado no sistema.' });
        }

        // --- ALTERAÇÃO PRINCIPAL AQUI ---
        // Busca a sala pelo codigoCurto e verifica se o aluno pertence a ela
        const sala = await Sala.findOne({
            codigoCurto: codigoSala.toUpperCase(), // Converte para maiúsculo para ser insensível a case
            alunos: aluno._id
        }).populate({
            path: 'tarefas',
            populate: {
                path: 'perguntas.pergunta',
                model: 'Pergunta',
                // --- ADICIONADO: Seleciona explicitamente os campos necessários ---
                select: 'texto tipo opcoes opcaoCorreta'
            }
        });

        if (!sala) {
            return res.status(404).json({ message: 'RA não encontrado nesta sala ou código da sala inválido.' });
        }

        const salaObject = sala.toObject();
        // Adiciona salaId a cada tarefa para o frontend saber qual sala pertence
        salaObject.tarefas = salaObject.tarefas.map(tarefa => ({
            ...tarefa,
            salaId: sala._id
        }));

        res.status(200).json({
            success: true,
            aluno: { _id: aluno._id, nome: aluno.nome, RA: aluno.RA },
            tarefas: salaObject.tarefas, // Envia as tarefas populadas corretamente
            salaIdOriginal: sala._id
        });

    } catch (error) {
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

/**
 * Verifica se um RA já existe para algum aluno DENTRO de uma escola específica.
 * @param {String} RA - O RA a ser verificado.
 * @param {mongoose.Types.ObjectId} escolaId - O ID da escola.
 * @param {mongoose.Types.ObjectId | null} alunoIdExcluir - (Opcional) ID de um aluno a ser ignorado na busca (útil ao atualizar).
 * @returns {Promise<boolean>} - True se o RA já existe na escola, false caso contrário.
 */

async function raExisteNaEscola(RA, escolaId, alunoIdExcluir = null) {
    try {
        // 1. Encontra todos os professores da escola
        const professoresDaEscola = await Professor.find({ school: escolaId }).select('_id');
        const idsProfessoresDaEscola = professoresDaEscola.map(p => p._id);
        if (idsProfessoresDaEscola.length === 0) return false; // Ninguém na escola, RA não existe

        // 2. Encontra todas as salas criadas por esses professores
        const salasDaEscola = await Sala.find({ criador: { $in: idsProfessoresDaEscola } }).select('alunos');
        if (salasDaEscola.length === 0) return false; // Nenhuma sala na escola

        // 3. Coleta todos os IDs de alunos únicos dessas salas
        const idsAlunosDaEscola = [...new Set(salasDaEscola.flatMap(s => s.alunos))];
        if (idsAlunosDaEscola.length === 0) return false; // Nenhuma aluno na escola

        // 4. Monta a query para buscar o aluno com o RA na escola
        const query = {
            RA: RA, // Busca pelo RA
            _id: { $in: idsAlunosDaEscola } // Que esteja na lista de alunos da escola
        };
        // Se estamos atualizando, excluímos o próprio aluno da verificação
        if (alunoIdExcluir) {
            query._id.$ne = alunoIdExcluir; // $ne = not equal
        }

        // 5. Verifica se algum aluno corresponde
        const alunoExistenteNaEscola = await Aluno.findOne(query);

        return !!alunoExistenteNaEscola; // Retorna true se encontrou, false se não

    } catch (error) {
        console.error("Erro ao verificar RA na escola:", error);
        // Em caso de erro na verificação, assume que PODE existir para segurança
        return true;
    }
}



// --- FUNÇÕES DE GERENCIAMENTO DE ALUNOS ---
const cadastrarEAdicionarAluno = async (req, res) => {
    try {
        const { nome, RA } = req.body;
        const { salaId } = req.params;

        // --- VALIDAÇÃO DE RA NA ESCOLA ---
        const sala = await Sala.findById(salaId).populate({ path: 'criador', select: 'school' });
        if (!sala || !sala.criador || !sala.criador.school) {
            return res.status(404).json({ message: 'Sala ou escola do criador não encontrada.' });
        }
        const escolaId = sala.criador.school;
        const jaExiste = await raExisteNaEscola(RA, escolaId);
        if (jaExiste) {
            return res.status(409).json({ message: `Um aluno com o RA ${RA} já existe nesta escola.` });
        }
        // --- FIM DA VALIDAÇÃO ---

        // Procede com a criação se não existir na escola
        const novoAluno = await Aluno.create({ nome, RA });
        await Sala.findByIdAndUpdate(salaId, { $push: { alunos: novoAluno._id } });
        res.status(201).json(novoAluno);

    } catch (error) {
        console.error('Erro ao cadastrar e adicionar aluno:', error);
        // Trata erro de validação do Mongoose (caso a verificação falhe por concorrência)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.RA) {
             return res.status(409).json({ message: `O RA ${req.body.RA} já está em uso (concorrência?).` });
        }
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const vincularAlunoExistente = async (req, res) => {
    try {
        const { RA } = req.body;
        const { salaId } = req.params;

        // --- BUSCA ALUNO E SALA ---
        const aluno = await Aluno.findOne({ RA });
        if (!aluno) {
            return res.status(404).json({ message: 'Nenhum aluno encontrado com este RA.' });
        }
        const sala = await Sala.findById(salaId).populate({ path: 'criador', select: 'school' });
        if (!sala || !sala.criador || !sala.criador.school) {
            return res.status(404).json({ message: 'Sala ou escola do criador não encontrada.' });
        }
        // --- FIM BUSCA ---

        // Verifica se o aluno já está NESTA sala
        if (sala.alunos.includes(aluno._id)) {
            return res.status(409).json({ message: `Este aluno já está vinculado a esta sala.` });
        }

        // --- VALIDAÇÃO DE RA NA ESCOLA (Opcional, mas boa prática) ---
        // Verifica se OUTRO aluno com o mesmo RA já existe na escola
        // const escolaId = sala.criador.school;
        // const outroAlunoComRAExiste = await raExisteNaEscola(RA, escolaId, aluno._id); // Exclui o próprio aluno da busca
        // if (outroAlunoComRAExiste) {
        //     return res.status(409).json({ message: `Erro: Outro aluno com o RA ${RA} já existe nesta escola.` });
        // }
        // --- FIM DA VALIDAÇÃO (Opcional) ---

        // Vincula o aluno à sala
        await Sala.findByIdAndUpdate(salaId, { $addToSet: { alunos: aluno._id } });
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

        // --- VALIDAÇÃO DE RA NA ESCOLA ---
        const sala = await Sala.findById(salaId).populate({ path: 'criador', select: 'school' });
        if (!sala || !sala.criador || !sala.criador.school) {
             return res.status(404).json({ message: 'Sala ou escola do criador não encontrada para validação.' });
        }
        const escolaId = sala.criador.school;
        // Verifica se o NOVO RA já existe em OUTRO aluno da escola
        const jaExiste = await raExisteNaEscola(RA, escolaId, alunoId); // Passa alunoId para excluir ele mesmo da busca
        if (jaExiste) {
             return res.status(409).json({ message: `O RA ${RA} já está sendo utilizado por outro aluno nesta escola.` });
        }
        // --- FIM DA VALIDAÇÃO ---

        // Permissão (já existia)
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Você não tem permissão para editar nesta sala.' });

        // Atualiza o aluno
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
        console.error('Erro ao desvincul ar aluno:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// --- FUNÇÕES DE TAREFA E PROGRESSO ---
const adicionarTarefa = async (req, res) => {
    try {
        const { titulo, dataFechamento, horaFechamento } = req.body;

        // ========= ADICIONE ESTA VALIDAÇÃO =========
        if (!titulo || !dataFechamento || !horaFechamento) {
            return res.status(400).json({ message: 'Título, data e hora de fechamento são obrigatórios.' });
        }
        // ========= FIM DA VALIDAÇÃO =========

        const sala = await Sala.findById(req.params.salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Sem permissão para editar.' });
        sala.tarefas.push({ titulo, dataFechamento, horaFechamento });
        await sala.save();
        res.status(200).json(sala); // Retorna a sala inteira atualizada
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        // Verifica se é erro de validação do Mongoose (campos obrigatórios)
        if (error.name === 'ValidationError') {
             // Coleta as mensagens de erro de validação
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
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
            .then(s => s ? s.tarefas.id(tarefaId) : null); // Adicionado tratamento para sala não encontrada ou sem a tarefa


        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        const agora = new Date();
        // Lógica de encerramento atualizada para usar data e hora
        let tarefaEncerrada = false;
        if (tarefa.dataFechamento) {
            const hora = tarefa.horaFechamento || '23:59:59'; // Padrão fim do dia se hora não existir
            const dataHoraFechamento = new Date(`${tarefa.dataFechamento.toISOString().split('T')[0]}T${hora}`);
            if (!isNaN(dataHoraFechamento) && agora > dataHoraFechamento) {
                tarefaEncerrada = true;
            }
        }


        const resultadosCompletos = sala.alunos.map(aluno => {
            // Garante que progresso só seja buscado se tarefa.progressos existir
            const progresso = tarefa.progressos ? tarefa.progressos.find(p => p.alunoId && p.alunoId.equals(aluno._id)) : null;


            if (progresso) {
                return {
                    alunoId: aluno._id, nome: aluno.nome, RA: aluno.RA,
                    status: progresso.status,
                    pontuacao: progresso.pontuacao,
                    respostasDadas: progresso.respostas ? progresso.respostas.length : 0 // Garante que respostas existe
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
                    path: 'perguntas.pergunta', // Popula as perguntas para podermos contar
                    model: 'Pergunta',
                    select: 'texto tipo opcoes opcaoCorreta' // Só precisamos do ID para a contagem
                }
            });

        if (!sala) {
            return res.status(404).json({ message: 'Sala não encontrada.' });
        }

        // Mapeia as tarefas, adicionando a contagem de perguntas
        const tarefasComContagem = sala.tarefas.map(tarefa => {
            const tarefaObj = tarefa.toObject(); // Converte para objeto simples
            return {
                ...tarefaObj,
                salaId: sala._id,
                // Garante que perguntas existe antes de acessar length
                numPerguntas: tarefaObj.perguntas ? tarefaObj.perguntas.length : 0
            };
        });

        res.status(200).json(tarefasComContagem); // Envia a lista com a contagem

    } catch (error) {
        console.error('Erro ao buscar tarefas da sala:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const salvarProgressoAluno = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { alunoId, perguntaId, respostaIndex, acertou, pontuacaoAtual } = req.body;

        // Validação básica dos dados recebidos
        if (alunoId === undefined || perguntaId === undefined || respostaIndex === undefined || acertou === undefined || pontuacaoAtual === undefined) {
             return res.status(400).json({ message: 'Dados de progresso incompletos.' });
        }


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

        // Evita adicionar resposta duplicada (caso o aluno clique rápido ou haja falha de rede)
        // Garante que progresso.respostas exista
        const respostaExistente = progresso.respostas && progresso.respostas.find(r => r.perguntaId.equals(perguntaId));

        if (!respostaExistente) {
             // Garante que progresso.respostas exista antes de push
             if (!progresso.respostas) progresso.respostas = [];
             progresso.respostas.push({ perguntaId, respostaIndex, acertou });
        }

        progresso.pontuacao = pontuacaoAtual; // Atualiza a pontuação

        // Garante que tarefa.perguntas exista
        if (progresso.respostas && tarefa.perguntas && progresso.respostas.length >= tarefa.perguntas.length) {

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
        const { texto, opcoes, opcaoCorreta, tipo } = req.body; // Certifique-se de que 'tipo' está sendo recebido

        // ========= ADICIONE ESTA VALIDAÇÃO AQUI =========
        if (!tipo || (tipo === 'multipla_escolha' && (!opcoes || opcoes.length !== 4)) || (tipo === 'vf' && (!opcoes || opcoes.length !== 2))) {
            console.error('Dados inválidos recebidos para criar pergunta:', req.body); // Log para depuração
            return res.status(400).json({ message: 'Dados da pergunta inválidos. Verifique o tipo e o número de opções.' });
        }
        if (opcaoCorreta < 0 || (tipo === 'multipla_escolha' && opcaoCorreta > 3) || (tipo === 'vf' && opcaoCorreta > 1) ) {
             console.error('Índice da opção correta inválido:', req.body); // Log para depuração
             return res.status(400).json({ message: 'Índice da opção correta inválido para o tipo de pergunta.' });
        }
        // ========= FIM DA VALIDAÇÃO ADICIONADA =========

        // O restante da função continua igual...
        const novaPergunta = await Pergunta.create({ texto, opcoes, opcaoCorreta, tipo }); // Passe o 'tipo' aqui
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });
        tarefa.perguntas.push({ pergunta: novaPergunta._id });
        await sala.save();
        // Retorna a tarefa atualizada com a nova pergunta populada
        const tarefaAtualizada = await Sala.findById(salaId)
            .populate({
                path: 'tarefas',
                match: { _id: tarefaId }, // Garante que pegamos a tarefa certa
                populate: { path: 'perguntas.pergunta', model: 'Pergunta' } // Popula a pergunta dentro da tarefa
            })
            .then(s => s ? s.tarefas.id(tarefaId) : null); // Pega a tarefa específica


        res.status(201).json(tarefaAtualizada); // Retorna a tarefa atualizada
    } catch (error) {
        // Mantenha o console.error aqui para pegar outros erros do Mongoose
        console.error('Erro ao criar pergunta:', error);
        // Verifica se é um erro de validação específico do Mongoose que não pegamos antes
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: error.message });
        }
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

        // Garante que tarefa.perguntas exista antes de verificar
        const perguntaJaExiste = tarefa.perguntas && tarefa.perguntas.some(p => p.pergunta.equals(perguntaId));

        if(perguntaJaExiste) return res.status(409).json({ message: 'Esta pergunta já foi adicionada.' });

        // Garante que tarefa.perguntas exista antes de adicionar
        if (!tarefa.perguntas) tarefa.perguntas = [];
        tarefa.perguntas.push({ pergunta: perguntaId });
        await sala.save();
        // Retorna a tarefa atualizada com a pergunta populada
        const tarefaAtualizada = await Sala.findById(salaId)
            .populate({
                path: 'tarefas',
                match: { _id: tarefaId },
                populate: { path: 'perguntas.pergunta', model: 'Pergunta' }
            })
            .then(s => s ? s.tarefas.id(tarefaId) : null);


        res.status(200).json(tarefaAtualizada); // Retorna a tarefa atualizada
    } catch (error) {
        console.error('Erro ao adicionar pergunta do banco:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// --- FUNÇÃO DE IA (ATUALIZADA) ---

// --- NOVO MASTER PROMPT: INTELIGÊNCIA DE DATA E REUTILIZAÇÃO DE PERGUNTAS ---
const masterPrompt = `
Hoje é [DATA_ATUAL_ISO]. Você é um assistente de criação de quizzes. Sua função é preencher "titulo", "dataFechamento" (YYYY-MM-DD), "horaFechamento" (HH:MM), "numPerguntas", "topico" e "tipoEstilo".

**Contexto do Banco de Perguntas:**
[BANCO_DE_PERGUNTAS]

**Regras de Data (IMPORTANTE):**
* Sua referência é [DATA_ATUAL_ISO].
* Você DEVE converter linguagem natural e formatos brasileiros para o formato YYYY-MM-DD.
* **Validação:** A "dataFechamento" DEVE ser hoje ou no futuro. NUNCA no passado.

**Fluxo de Conversa:**
1.  Obtenha os 5 campos (titulo, data, hora, numPerguntas, topico).
2.  **NOVO PASSO:** Quando tiver os 5 campos, pergunte sobre o estilo: "Qual o estilo das perguntas? (1) Somente Alternativas, (2) Somente Verdadeiro/Falso, ou (3) Misto (70% Alternativas)?"
3.  Quando tiver o "tipoEstilo", pergunte sobre a dificuldade (ex: "Fáceis, difíceis?").
4.  Após a dificuldade, gere o quiz.

**Regras de Geração de Perguntas (IMPORTANTE):**
* Você deve fornecer o número exato de perguntas solicitado em "numPerguntas".
* **Primeiro, tente usar perguntas do Banco de Perguntas** (listado acima) se elas corresponderem ao "topico" e "estilo".
* Se não houver perguntas suficientes no banco, **crie novas perguntas** originais.
* **Lógica do Estilo:**
    * "Somente Alternativas": Gere 100% das perguntas como "multipla_escolha".
    * "Somente Verdadeiro/Falso": Gere 100% das perguntas como "vf".
    * "Misto": Gere aproximadamente 70% das perguntas como "multipla_escolha" e 30% como "vf". (Ex: 10 perguntas = 7 múltipla escolha, 3 V/F).
* **Regra de Precisão (Crítico):** Antes de gerar o JSON, revise DUAS VEZES cada pergunta nova. 
Se for uma pergunta de matemática, lógica ou fatos, verifique se o 'opcaoCorreta' 
(índice) é 100% correto. A precisão é mais importante que a velocidade.

**Formato de Resposta (JSON):**
Sempre responda em JSON.

1.  Se incompleto:
    { "status": "incompleto", "proximaPergunta": "Sua pergunta aqui." }

2.  Se completo (PRONTO PARA GERAR):
    {
      "status": "completo",
      "tarefa": {
        "titulo": "...",
        "dataFechamento": "YYYY-MM-DD",
        "horaFechamento": "HH:MM",
        "topico": "...",
        "perguntas": [
          // --- EXEMPLO PERGUNTA DO BANCO ---
          "ID_BANCO_2",

          // --- EXEMPLO PERGUNTA NOVA (Alternativa) ---
          {
            "tipo": "multipla_escolha",
            "texto": "Pergunta Nova 1?",
            "opcoes": ["A", "B", "C", "D"],
            "opcaoCorreta": 0
          },

          // --- EXEMPLO PERGUNTA NOVA (V/F) ---
          {
            "tipo": "vf",
            "texto": "O sol é frio?",
            "opcoes": ["Verdadeiro", "Falso"],
            "opcaoCorreta": 1
          }
        ]
      }
    }
`;


// --- NOVA FUNÇÃO: ATUALIZAR TAREFA ---
const atualizarTarefa = async (req, res) => {
    try {
        const { salaId, tarefaId } = req.params;
        const { titulo, dataFechamento, horaFechamento } = req.body;

        // ========= VALIDAÇÃO ATUALIZADA =========
        // Verifica se os campos obrigatórios não estão vazios ou nulos
        if (!titulo || !dataFechamento || !horaFechamento) {
            return res.status(400).json({ message: 'Título, data e hora de fechamento são obrigatórios.' });
        }
        // ========= FIM DA VALIDAÇÃO =========


        // Encontra a sala
        const sala = await Sala.findById(salaId);
        if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

        // Verifica permissão (criador ou editor)
        const podeEditar = sala.criador.equals(req.professor._id) || sala.editoresConvidados.some(id => id.equals(req.professor._id));
        if (!podeEditar) return res.status(403).json({ message: 'Sem permissão para editar tarefas nesta sala.' });

        // Encontra a tarefa específica dentro da sala
        const tarefa = sala.tarefas.id(tarefaId);
        if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada.' });

        // Atualiza os campos da tarefa
        tarefa.titulo = titulo;
        tarefa.dataFechamento = dataFechamento; // dataFechamento já foi validado como existente
        tarefa.horaFechamento = horaFechamento; // horaFechamento já foi validado como existente


        // Salva as alterações na sala (que contém a tarefa)
        await sala.save();

        res.status(200).json(tarefa); // Retorna a tarefa atualizada

    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        // Verifica se é erro de validação do Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Erro no servidor ao atualizar tarefa.' });
    }
};


const gerarTarefaComIA = async (req, res) => {
    try {
        const { salaId } = req.params;
        const { historicoChat } = req.body;

        // --- ATUALIZAÇÃO 1: Carregar o banco de perguntas ---
        // Alterado para carregar tipo, opções e opcaoCorreta para validação
        const bancoDePerguntas = await Pergunta.find().select('texto tipo opcoes opcaoCorreta');


        // Mapeia o banco para IDs temporários que a IA possa entender
        // E também cria um mapa para traduzir de volta para o _id real
        const mapaPerguntasBanco = {};
        const bancoFormatado = bancoDePerguntas.map((p, i) => {
            const tempId = `ID_BANCO_${i}`;
            mapaPerguntasBanco[tempId] = p._id; // Mapeia "ID_BANCO_0" -> "68...id..."
            return `${tempId}: ${p.texto}`;
        }).join('\n');


        // --- ATUALIZAÇÃO 2: Injetar data e banco de perguntas no prompt ---
        const hojeISO = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).toISOString();
        let promptComData = masterPrompt.replace(/\[DATA_ATUAL_ISO\]/g, hojeISO);

        if (bancoFormatado.length > 0) {
            promptComData = promptComData.replace(/\[BANCO_DE_PERGUNTAS\]/g, `Aqui está o banco de perguntas existente:\n${bancoFormatado}\n`);
        } else {
            promptComData = promptComData.replace(/\[BANCO_DE_PERGUNTAS\]/g, "O banco de perguntas está vazio.");
        }

        // Constrói o histórico para a IA
        const historyForAI = [
            { role: "user", parts: [{ text: promptComData }] }, // Usa o prompt atualizado
            ...historicoChat.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }))
        ];

        const chat = model.startChat({ history: historyForAI });

        const result = await chat.sendMessage("Continue a conversa com base no histórico.");

        const responseText = result.response.text();

        let aiResponse;
        try {
            const cleanedText = responseText.replace("```json", "").replace("```", "").trim();
            aiResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Erro ao parsear JSON da IA (texto original):", responseText);
            return res.status(500).json({ message: "A IA retornou um formato de JSON inválido." });
        }

        // --- ATUALIZAÇÃO 3: Processar a resposta da IA (perguntas novas vs. banco) ---
        if (aiResponse.status === 'completo') {
            const { titulo, dataFechamento, horaFechamento, perguntas } = aiResponse.tarefa;

             // --- ADICIONADO: Validação extra dos dados da IA ---
             if (!titulo || !dataFechamento || !horaFechamento || !perguntas || perguntas.length === 0) {
                 console.error("IA retornou dados incompletos para a tarefa:", aiResponse.tarefa);
                 // Não cria a tarefa e retorna a resposta da IA para o usuário tentar novamente
                 return res.status(200).json({ status: "incompleto", proximaPergunta: "Hmm, parece que faltaram algumas informações. Pode confirmar o título, data, hora e perguntas?" });
             }
             // --- FIM DA VALIDAÇÃO EXTRA ---


            const perguntasNovasParaCriar = []; // Armazena objetos de novas perguntas
            const idsPerguntasDoBanco = []; // Armazena IDs de perguntas existentes

            // Separa o que é ID (string) do que é pergunta nova (objeto)
            for (const p of perguntas) {
                if (typeof p === 'string' && p.startsWith('ID_BANCO_')) {
                    // É uma pergunta do banco
                    const idReal = mapaPerguntasBanco[p];
                    if (idReal) {
                        idsPerguntasDoBanco.push(idReal);
                    } else {
                         console.warn(`IA retornou um ID do banco inválido (${p}), ignorando.`);
                    }

                } else if (typeof p === 'object' && p.texto) {
                    // É uma nova pergunta - VALIDAÇÃO EXTRA ANTES DE ADICIONAR
                    if ( (p.tipo === 'multipla_escolha' && p.opcoes && p.opcoes.length === 4 && p.opcaoCorreta >= 0 && p.opcaoCorreta <= 3) ||
                         (p.tipo === 'vf' && p.opcoes && p.opcoes.length === 2 && p.opcaoCorreta >= 0 && p.opcaoCorreta <= 1) )
                    {
                        perguntasNovasParaCriar.push(p);
                    } else {
                         console.warn("IA gerou uma pergunta nova inválida, ignorando:", p);
                    }
                }
            }

            // 1. Salva as novas perguntas no banco (se houver alguma válida)
            let novasPerguntasIds = [];
            if(perguntasNovasParaCriar.length > 0) {
                 try {
                     const perguntasCriadas = await Pergunta.insertMany(perguntasNovasParaCriar, { ordered: false }); // Tenta inserir todas, mesmo que uma falhe
                     novasPerguntasIds = perguntasCriadas.map(p => p._id);
                 } catch (insertError) {
                     console.error("Erro ao inserir perguntas geradas pela IA:", insertError);
                     // Continua mesmo se houver erro, mas loga
                 }
            }


            // 2. Combina os IDs (do banco + novas criadas com sucesso)
            const perguntasIdsFinais = [
                ...idsPerguntasDoBanco,
                ...novasPerguntasIds // Apenas as que foram salvas com sucesso
            ].map(id => ({ pergunta: id })); // Converte para o schema da Sala

            // 3. Salva a tarefa na sala (mesmo que algumas perguntas da IA tenham falhado)
            const sala = await Sala.findById(salaId);
            if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' });

            // Garante que sala.tarefas exista
            if (!sala.tarefas) sala.tarefas = [];

            sala.tarefas.push({
                titulo,
                dataFechamento,
                horaFechamento,
                perguntas: perguntasIdsFinais // Usa a lista combinada e filtrada
            });
            await sala.save();

             // Retorna a resposta da IA original para o frontend saber que completou
             return res.status(200).json(aiResponse);
        }

        // Se o status não for 'completo', apenas retorna a resposta da IA
        res.status(200).json(aiResponse);

    } catch (error) {
        console.error('Erro no controlador de IA:', error);
         // Trata erros de validação da tarefa (ex: data obrigatória)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            // Retorna um status "incompleto" para o frontend tratar
            return res.status(200).json({ status: "incompleto", proximaPergunta: `Erro ao salvar tarefa: ${messages.join('. ')}` });
        }
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
    gerarTarefaComIA, removerPerguntaDaTarefa,atualizarTarefa, excluirTarefa,importarAlunos, getRankingDaSala
};

