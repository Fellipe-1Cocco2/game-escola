document.addEventListener('DOMContentLoaded', () => {

    const getElement = (id, required = true) => {
        const el = document.getElementById(id);
        if (!el && required) {
            // Log do erro, mas permite que o script continue para outras inicializações se possível
            console.error(`ERRO CRÍTICO: O elemento com ID #${id} não foi encontrado no HTML.`);
        }
        return el;
    };

    // --- SELETORES ---
    const tituloTarefaHeader = getElement('titulo-tarefa-header');
    const listaPerguntasTarefa = getElement('lista-perguntas-tarefa');
    const bancoPerguntasContainer = getElement('banco-perguntas-container');
    const btnAbrirModalPergunta = getElement('btn-abrir-modal-pergunta');
    const modalNovaPergunta = getElement('modal-nova-pergunta');
    const formNovaPergunta = getElement('form-nova-pergunta'); // Verificado
    const toastNotification = getElement('toast-notification');
    const voltarSalaLink = getElement('voltar-sala-link');
    const listaResultadosAlunos = getElement('lista-resultados-alunos');
    const inputBuscaBanco = getElement('input-busca-banco');
    
    const btnAbrirModalEditarTarefa = getElement('btn-abrir-modal-editar-tarefa');
    const modalEditarTarefa = getElement('modal-editar-tarefa');
    const formEditarTarefa = getElement('form-editar-tarefa');
    const inputIdTarefaEditar = getElement('id-tarefa-editar');
    const inputTituloTarefaEditar = getElement('titulo-tarefa-editar');
    const inputDataTarefaEditar = getElement('data-fechamento-tarefa-editar');
    const inputHoraTarefaEditar = getElement('hora-fechamento-tarefa-editar');

    const modalVisualizarRespostas = getElement('modal-visualizar-respostas');
    const modalRespostasTitulo = getElement('modal-respostas-titulo');
    const modalRespostasConteudo = getElement('modal-respostas-conteudo');


    const selectTipoPergunta = getElement('select-tipo-pergunta', false);
    const containerMultiplaEscolha = getElement('container-multipla-escolha', false);
    const containerVf = getElement('container-vf', false);

    // --- NOVOS SELETORES PARA PREVIEW DO BANCO ---
    const modalPreviewBanco = getElement('modal-preview-banco', false); // Não crítico se não existir
    const previewQuestionText = getElement('preview-question-text', false);
    const previewAnswersList = getElement('preview-answers-list', false);
    const btnConfirmarAdicionarBanco = getElement('btn-confirmar-adicionar-banco', false);

    // --- NOVOS SELETORES PARA CONFIRMAR REMOÇÃO ---
    const modalConfirmarRemocao = getElement('modal-confirmar-remocao', false);
    const btnConfirmarRemocaoPergunta = getElement('btn-confirmar-remocao-pergunta', false);
    let perguntaParaRemoverId = null; // Variável para guardar o ID temporariamente
    // --- FIM DOS NOVOS SELETORES ---

    const fechamentoTarefaHeader = getElement('fechamento-tarefa-header', false);
    
    // Fechar Modais Genérico
    document.querySelectorAll('.btn-fechar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Tenta encontrar o overlay pai mais próximo e o esconde
            const modalOverlay = e.target.closest('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });
    });

    // Abas
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Estado
    let bancoDePerguntasCompleto = [];
    let toastTimeout;
    const pathParts = window.location.pathname.split('/');
    const tarefaId = pathParts[2];
    const salaId = pathParts[4];
    voltarSalaLink.href = `/sala/${salaId}`;
    let tarefaAtual = null; 

    // --- LÓGICA DAS ABAS ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderPerguntasDaTarefa = (perguntas) => {
        if (!listaPerguntasTarefa) return; // Adiciona verificação
        listaPerguntasTarefa.innerHTML = '';
        if (!perguntas || perguntas.length === 0) {
            listaPerguntasTarefa.innerHTML = '<div class="pergunta-card">Nenhuma pergunta adicionada a esta tarefa.</div>';
            return;
        }
        perguntas.forEach(item => {
            if (!item || !item.pergunta) { 
                 console.warn('Item de pergunta inválido:', item);
                 return;
            }
            const card = document.createElement('div');
            card.className = 'pergunta-card';
            
            let opcoesHtml = '<ol>';
            item.pergunta.opcoes.forEach((opcao, index) => {
                const classeCorreta = index === item.pergunta.opcaoCorreta ? ' class="correta"' : '';
                opcoesHtml += `<li${classeCorreta}>${opcao}</li>`;
            });
            opcoesHtml += '</ol>';

            const btnRemover = document.createElement('button');
            btnRemover.className = 'btn-remover-pergunta';
            btnRemover.textContent = 'Remover';
            btnRemover.onclick = () => handleRemoverPergunta(item.pergunta._id);

            card.innerHTML = `<strong>${item.pergunta.texto}</strong>${opcoesHtml}`;
            card.appendChild(btnRemover); 
            listaPerguntasTarefa.appendChild(card);
        });
    };
    
    const renderBancoDePerguntas = (termoBusca = '') => {
        if (!bancoPerguntasContainer) return; 
        bancoPerguntasContainer.innerHTML = '';
        const termoLower = termoBusca.toLowerCase();

        const perguntasFiltradas = bancoDePerguntasCompleto.filter(pergunta =>
            pergunta.texto.toLowerCase().includes(termoLower)
        );

        if (perguntasFiltradas.length === 0) {
            bancoPerguntasContainer.innerHTML = `<div class="banco-item"><p>${termoBusca ? 'Nenhuma pergunta encontrada.' : 'Nenhuma pergunta no banco.'}</p></div>`; // Envolve em banco-item
            return;
        }

        perguntasFiltradas.forEach(pergunta => {
            const item = document.createElement('div');
            item.className = 'banco-item';
            // --- MODIFICADO: Adiciona data attribute e torna clicável ---
            item.dataset.perguntaId = pergunta._id; 
            item.style.cursor = 'pointer'; // Indica que é clicável
            item.innerHTML = `<p>${pergunta.texto}</p>`; 
            // --- FIM DA MODIFICAÇÃO (botão removido) ---

            bancoPerguntasContainer.appendChild(item);
        });
    };

    const renderResultados = (resultados, totalPerguntas) => {
        if (!listaResultadosAlunos) return; // Adiciona verificação
        listaResultadosAlunos.innerHTML = '';
        if (!resultados || resultados.length === 0) {
            listaResultadosAlunos.innerHTML = '<div class="pergunta-card">Nenhum aluno cadastrado nesta sala ou nenhum respondeu.</div>';
            return;
        }
        
        // Ordena por pontuação (maior primeiro) e depois por nome
        resultados.sort((a, b) => {
            if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
            return a.nome.localeCompare(b.nome);
        });

        resultados.forEach(res => {
            const item = document.createElement('div');
            item.className = 'resultado-item';
            item.dataset.alunoId = res.alunoId; 
            item.dataset.alunoNome = res.nome; 

            const statusClasse = `status-${res.status.replace('_', '-')}`;
            // Garante que status desconhecidos não quebrem o layout
            const statusTexto = res.status ? res.status.replace('-', ' ') : 'desconhecido'; 

            item.innerHTML = `
                <div class="resultado-aluno-info">
                    <span>${res.nome || 'Aluno sem nome'}</span>
                    <small>Respostas: ${res.respostasDadas} de ${totalPerguntas}</small>
                </div>
                <div class="resultado-progresso">
                    <span class="resultado-status ${statusClasse}">${statusTexto}</span>
                    <span class="resultado-pontuacao">${res.pontuacao} pts</span>
                </div>
            `;
            listaResultadosAlunos.appendChild(item);
        });
    };

    // --- LÓGICA PRINCIPAL ---
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }

        try {
            const [tarefaRes, bancoRes] = await Promise.all([
                fetch(`/api/game/salas/${salaId}/tarefas/${tarefaId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/game/perguntas', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!tarefaRes.ok || !bancoRes.ok) throw new Error('Falha ao buscar dados.');
            
            tarefaAtual = await tarefaRes.json();
            if (fechamentoTarefaHeader) {
                let fechamentoStr = "Sem prazo definido";
                if (tarefaAtual.dataFechamento) {
                    try {
                        const data = new Date(tarefaAtual.dataFechamento);
                        // Adiciona timeZone UTC para garantir a data correta independente do fuso do servidor/browser ao LER a data
                        const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
                        fechamentoStr = `Encerra em ${dataFormatada}`;

                        if (tarefaAtual.horaFechamento) {
                            // Para exibir a hora, usamos a string original para evitar problemas de fuso horário na *exibição*
                            // Assumimos que a hora salva está no fuso correto (ex: São Paulo)
                            const [hora, minuto] = tarefaAtual.horaFechamento.split(':');
                            fechamentoStr += ` às ${hora}:${minuto}`;
                        }
                    } catch (e) {
                        console.error("Erro ao formatar data/hora:", e);
                        fechamentoStr = "Erro ao carregar prazo";
                    }
                }
                fechamentoTarefaHeader.textContent = fechamentoStr;
            }
            bancoDePerguntasCompleto = await bancoRes.json();
            
            if (tituloTarefaHeader) tituloTarefaHeader.textContent = tarefaAtual.titulo;
            renderPerguntasDaTarefa(tarefaAtual.perguntas);
            renderBancoDePerguntas();
            renderResultados(tarefaAtual.resultadosCompletos, (tarefaAtual.perguntas || []).length); // Usa length seguro
            
        } catch (error) {
            console.error("Erro ao carregar dados da tarefa:", error);
            if (toastNotification) showToast('Não foi possível carregar os dados.', 'error');
        }
    };

        // --- NOVA FUNÇÃO: Abrir Modal de Preview ---
    const abrirModalPreviewBanco = (perguntaId) => {
        if (!modalPreviewBanco || !previewQuestionText || !previewAnswersList || !btnConfirmarAdicionarBanco) {
            console.error("Elementos do modal de preview não encontrados.");
            return;
        }

        const pergunta = bancoDePerguntasCompleto.find(p => p._id === perguntaId);
        if (!pergunta) {
            showToast("Pergunta não encontrada no banco.", "error");
            return;
        }

        // Popula o modal
        previewQuestionText.textContent = pergunta.texto;
        previewAnswersList.innerHTML = ''; // Limpa opções anteriores

        const opcoesPrefixo = ['A', 'B', 'C', 'D'];
        const eVerdadeiroFalso = pergunta.tipo === 'vf';

        pergunta.opcoes.forEach((opcaoTexto, index) => {
            // Se for V/F, só mostra os dois primeiros
            if (eVerdadeiroFalso && index > 1) return;

            const btnDiv = document.createElement('div');
            btnDiv.className = 'answer-btn-preview'; // Usa a nova classe CSS
            btnDiv.dataset.index = index;

            const prefixDiv = document.createElement('div');
            prefixDiv.className = 'answer-prefix-preview'; // Usa a nova classe CSS
            prefixDiv.dataset.index = index;
            prefixDiv.innerHTML = `<span class="kahoot-prefixo">${opcoesPrefixo[index]}</span>`; // Reusa o estilo do prefixo

            const textSpan = document.createElement('span');
            textSpan.className = 'answer-text-preview'; // Usa a nova classe CSS
            textSpan.textContent = opcaoTexto;

            btnDiv.appendChild(prefixDiv);
            btnDiv.appendChild(textSpan);

            // Destaca a resposta correta
            if (index === pergunta.opcaoCorreta) {
                btnDiv.classList.add('preview-correct-answer');
            }

            previewAnswersList.appendChild(btnDiv);
        });

        // Guarda o ID da pergunta no botão de confirmação
        btnConfirmarAdicionarBanco.dataset.perguntaId = perguntaId;

        // Abre o modal
        modalPreviewBanco.style.display = 'flex';
    };
    // --- FIM DA NOVA FUNÇÃO ---
    
    // --- MANIPULADORES DE EVENTOS (HANDLERS) ---
    const handleCriarNovaPergunta = async (e) => {
        e.preventDefault();
        
        // Elementos comuns
        const textoEl = getElement('texto-pergunta', false);
        if (!textoEl || !selectTipoPergunta) return; 

        const texto = textoEl.value.trim();
        const tipo = selectTipoPergunta.value;
        let body = { texto, tipo }; // Corpo da requisição

        if (tipo === 'multipla_escolha') {
            // --- Lógica para Múltipla Escolha ---
            const opcoesInputs = document.querySelectorAll('#container-multipla-escolha .input-opcao');
            const opcaoCorretaInput = document.querySelector('input[name="opcao-correta"]:checked');
            
            const opcoes = Array.from(opcoesInputs).map(input => input.value.trim());
            
            // A validação 'required' do HTML já vai pegar os campos de texto vazios,
            // mas checamos o rádio aqui.
            if (!texto || !opcaoCorretaInput) {
                showToast('Preencha a pergunta e selecione a opção correta.', 'error');
                return;
            }
            
            body.opcoes = opcoes;
            body.opcaoCorreta = parseInt(opcaoCorretaInput.value);

        } else if (tipo === 'vf') {
            // --- Lógica para Verdadeiro/Falso ---
            const vfCorretaInput = document.querySelector('input[name="vf-correta"]:checked');

            // Como o 'required' foi removido, esta checagem em JS é VITAL
            if (!texto || !vfCorretaInput) {
                showToast('Preencha a pergunta e escolha Verdadeiro ou Falso.', 'error');
                return;
            }

            body.opcoes = ['Verdadeiro', 'Falso']; // Opções fixas
            body.opcaoCorreta = parseInt(vfCorretaInput.value);
        }

        // Envia para o backend
        await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas`, 'POST', body, 'Pergunta criada e adicionada!');
        
        // Reseta o formulário
        if (formNovaPergunta) formNovaPergunta.reset();
        if (selectTipoPergunta) selectTipoPergunta.dispatchEvent(new Event('change')); // Força a UI a voltar para Múltipla Escolha
        if (modalNovaPergunta) modalNovaPergunta.style.display = 'none';
    };

    const handleRemoverPergunta = (perguntaId) => {
        // Remove a linha do confirm:
        // if (!confirm('Tem certeza que deseja remover esta pergunta da tarefa?')) return;

        if (modalConfirmarRemocao) {
            perguntaParaRemoverId = perguntaId; // Guarda o ID
            modalConfirmarRemocao.style.display = 'flex'; // Abre o modal
        } else {
            console.error("Modal de confirmação de remoção não encontrado.");
            // Fallback para o confirm caso o modal falhe
            if (confirm('Tem certeza que deseja remover esta pergunta da tarefa? (Modal falhou)')) {
                sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas/${perguntaId}`, 'DELETE', null, 'Pergunta removida com sucesso!');
            }
        }
        // A linha do sendRequest foi movida para o listener do botão de confirmação
        // await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas/${perguntaId}`, 'DELETE', null, 'Pergunta removida com sucesso!');
    };

    const handleAdicionarDoBanco = async (perguntaId) => {
        await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/banco-perguntas`, 'POST', { perguntaId }, 'Pergunta adicionada do banco!');
    };
    const abrirModalEditarTarefa = () => {
        if (!tarefaAtual || !modalEditarTarefa) return;

        if (inputIdTarefaEditar) inputIdTarefaEditar.value = tarefaAtual._id;
        if (inputTituloTarefaEditar) inputTituloTarefaEditar.value = tarefaAtual.titulo;
        if (inputDataTarefaEditar) inputDataTarefaEditar.value = tarefaAtual.dataFechamento 
            ? new Date(tarefaAtual.dataFechamento).toISOString().split('T')[0] 
            : ''; 
        if (inputHoraTarefaEditar) inputHoraTarefaEditar.value = tarefaAtual.horaFechamento || '';
        
        modalEditarTarefa.style.display = 'flex';
    };

    const abrirModalRespostas = (alunoId, alunoNome) => {
        if (!tarefaAtual || !tarefaAtual.perguntas || !modalVisualizarRespostas) return;

        const progressoAluno = tarefaAtual.progressos ? tarefaAtual.progressos.find(p => p.alunoId && p.alunoId._id === alunoId) : null;
        
        if (modalRespostasTitulo) modalRespostasTitulo.textContent = `Respostas de ${alunoNome}`;
        if (modalRespostasConteudo) modalRespostasConteudo.innerHTML = ''; 

        if (!progressoAluno || !progressoAluno.respostas || progressoAluno.respostas.length === 0) {
            if (modalRespostasConteudo) modalRespostasConteudo.innerHTML = '<p>Este aluno ainda não respondeu nenhuma pergunta.</p>';
            modalVisualizarRespostas.style.display = 'flex';
            return;
        }

        const respostasMap = new Map();
        progressoAluno.respostas.forEach(r => respostasMap.set(r.perguntaId.toString(), r));

        tarefaAtual.perguntas.forEach((itemPergunta, index) => {
            if (!itemPergunta || !itemPergunta.pergunta) return; 
            
            const pergunta = itemPergunta.pergunta;
            const perguntaIdStr = pergunta._id.toString();
            const respostaAluno = respostasMap.get(perguntaIdStr);

            const divPergunta = document.createElement('div');
            divPergunta.className = 'resposta-pergunta-item';

            let opcoesHtml = `<ol>`;
            const opcoesPrefixo = ['A', 'B', 'C', 'D'];

            pergunta.opcoes.forEach((opcaoTexto, opcaoIndex) => {
                let classesLi = '';
                if (respostaAluno) {
                    if (opcaoIndex === respostaAluno.respostaIndex) {
                        classesLi += ' escolhida'; 
                        classesLi += respostaAluno.acertou ? ' correta' : ' incorreta'; 
                    } else if (opcaoIndex === pergunta.opcaoCorreta && !respostaAluno.acertou) {
                        classesLi += ' era-correta'; 
                    }
                } else if (opcaoIndex === pergunta.opcaoCorreta) {
                    classesLi += ' era-correta'; // Mesmo sem resposta, marca a correta
                }

                opcoesHtml += `<li class="${classesLi.trim()}">
                                 <span class="resposta-prefixo">${opcoesPrefixo[opcaoIndex]}</span>
                                 <span class="resposta-texto">${opcaoTexto}</span>
                               </li>`;
            });
            opcoesHtml += `</ol>`;
            
            divPergunta.innerHTML = `<strong>${index + 1}. ${pergunta.texto}</strong>${opcoesHtml}`;
            if (modalRespostasConteudo) modalRespostasConteudo.appendChild(divPergunta);
        });

        modalVisualizarRespostas.style.display = 'flex';
    };


    // --- EVENT LISTENERS ---
    // Adiciona verificação de existência antes de adicionar listener
    if (selectTipoPergunta && containerMultiplaEscolha && containerVf) {
    
        // Seleciona todos os inputs que precisam ser ligados/desligados
        const inputsMultipla = containerMultiplaEscolha.querySelectorAll('input');
        const inputsVf = containerVf.querySelectorAll('input');

        selectTipoPergunta.addEventListener('change', () => {
            if (selectTipoPergunta.value === 'vf') {
                // Mostra V/F e habilita seus inputs
                containerMultiplaEscolha.style.display = 'none';
                inputsMultipla.forEach(input => input.disabled = true);
                
                // Esconde Múltipla Escolha e desabilita seus inputs
                containerVf.style.display = 'flex';
                inputsVf.forEach(input => input.disabled = false);

            } else {
                // Mostra Múltipla Escolha e habilita seus inputs
                containerMultiplaEscolha.style.display = 'grid';
                inputsMultipla.forEach(input => input.disabled = false);

                // Esconde V/F e desabilita seus inputs
                containerVf.style.display = 'none';
                inputsVf.forEach(input => input.disabled = true);
            }
        });

        // Dispara o evento 'change' na primeira vez para garantir que 
        // os inputs de V/F comecem desabilitados.
        selectTipoPergunta.dispatchEvent(new Event('change'));
    }
    if (btnConfirmarRemocaoPergunta && modalConfirmarRemocao) {
        btnConfirmarRemocaoPergunta.addEventListener('click', async () => {
            if (perguntaParaRemoverId) {
                await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas/${perguntaParaRemoverId}`, 'DELETE', null, 'Pergunta removida com sucesso!');
                modalConfirmarRemocao.style.display = 'none'; // Fecha o modal
                perguntaParaRemoverId = null; // Limpa o ID guardado
            } else {
                showToast("Erro ao identificar a pergunta para remover.", "error");
            }
        });
    }

    if (btnAbrirModalPergunta && modalNovaPergunta) {
        btnAbrirModalPergunta.addEventListener('click', () => modalNovaPergunta.style.display = 'flex');
    }
    if (formNovaPergunta) {
        formNovaPergunta.addEventListener('submit', handleCriarNovaPergunta);
    }
    if (inputBuscaBanco) {
        inputBuscaBanco.addEventListener('input', (e) => renderBancoDePerguntas(e.target.value));
    }
    if (btnAbrirModalEditarTarefa && modalEditarTarefa) {
        btnAbrirModalEditarTarefa.addEventListener('click', abrirModalEditarTarefa);
    }
    if (formEditarTarefa) {
        formEditarTarefa.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Verifica se os elementos existem antes de ler os valores
            const tarefaIdSubmit = inputIdTarefaEditar ? inputIdTarefaEditar.value : null;
            const titulo = inputTituloTarefaEditar ? inputTituloTarefaEditar.value.trim() : null;
            const dataFechamento = inputDataTarefaEditar ? inputDataTarefaEditar.value : null; 
            const horaFechamento = inputHoraTarefaEditar ? inputHoraTarefaEditar.value : null;

            if (!titulo) {
                showToast('O título da tarefa é obrigatório.', 'error');
                return;
            }
            if (!tarefaIdSubmit) {
                 showToast('Erro: ID da tarefa não encontrado.', 'error');
                 return;
            }
            
            const body = { 
                titulo, 
                dataFechamento: dataFechamento || null, 
                horaFechamento: horaFechamento || null
            };

            await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaIdSubmit}`, 'PUT', body, 'Tarefa atualizada com sucesso!');
            if (modalEditarTarefa) modalEditarTarefa.style.display = 'none'; 
        });
    }
    if (listaResultadosAlunos) {
        listaResultadosAlunos.addEventListener('click', (e) => {
            const itemAluno = e.target.closest('.resultado-item');
            if (itemAluno && itemAluno.dataset.alunoId && modalVisualizarRespostas) {
                abrirModalRespostas(itemAluno.dataset.alunoId, itemAluno.dataset.alunoNome);
            }
        });
    }

    if (bancoPerguntasContainer) {
        bancoPerguntasContainer.addEventListener('click', (e) => {
            const itemClicado = e.target.closest('.banco-item');
            if (itemClicado && itemClicado.dataset.perguntaId) {
                abrirModalPreviewBanco(itemClicado.dataset.perguntaId);
            }
        });
    }

    // --- NOVO: Listener para o botão 'Adicionar' DENTRO do modal de preview ---
    if (btnConfirmarAdicionarBanco && modalPreviewBanco) {
        btnConfirmarAdicionarBanco.addEventListener('click', () => {
            const perguntaIdParaAdicionar = btnConfirmarAdicionarBanco.dataset.perguntaId;
            if (perguntaIdParaAdicionar) {
                handleAdicionarDoBanco(perguntaIdParaAdicionar); // <<< CORRIGIDO AQUI!
                modalPreviewBanco.style.display = 'none'; // Fecha o modal
            } else {
                showToast("Erro ao identificar a pergunta para adicionar.", "error");
            }
        });
    }

    // --- FUNÇÃO AUXILIAR E INICIALIZAÇÃO ---
    const sendRequest = async (url, method, body, successMsg) => {
        const token = localStorage.getItem('token');
        try {
            const options = {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : null
            };
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                 if (response.status === 409) {
                    throw { status: 409, message: data.message || 'Ação bloqueada (conflito).' };
                } else {
                    throw new Error(data.message || 'Ocorreu um erro.');
                }
            }

            showToast(successMsg, 'success');

            if (method === 'PUT' && url.includes('/tarefas/')) {
                 if (tituloTarefaHeader && data.titulo) tituloTarefaHeader.textContent = data.titulo; 
                 fetchData(); 
            } else if (method === 'POST' && url.includes('/perguntas') || method === 'DELETE' || (method === 'POST' && url.includes('/banco-perguntas'))) {
                 // Após adicionar/remover pergunta, recarrega os dados
                 fetchData();
            } else if (data && data._id && data.perguntas !== undefined) { 
                 // Caso específico de retorno após criar pergunta (não deveria mais acontecer?)
                 tarefaAtual = data;
                 renderPerguntasDaTarefa(tarefaAtual.perguntas);
                 renderResultados(tarefaAtual.resultadosCompletos, (tarefaAtual.perguntas || []).length);
            } else {
                 fetchData(); 
            }

        } catch (error) {
             console.error('Erro detalhado capturado:', error);
             if (error.status === 401) {
                 showToast('Sua sessão expirou. Por favor, faça login novamente.', 'error');
                 setTimeout(() => {
                     window.location.href = '/login'; // Redireciona
                 }, 2000);
            } else if (error && error.status === 409) { // Mantém tratamento do 409
                showToast(error.message, 'info');
            } else {
                showToast(error.message || 'Ocorreu um erro desconhecido.', 'error');
            }
        }
    };

    const showToast = (message, type = 'success') => { 
        if (!toastNotification) return; // Não tenta mostrar se não existe
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification'; 
        
        if (type === 'success') toastNotification.classList.add('success');
        else if (type === 'info') toastNotification.classList.add('info'); 
        else toastNotification.classList.add('error');
        
        toastNotification.classList.add('show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000); 
    };
    
    // Inicia a busca somente se os elementos essenciais foram encontrados
    if (tituloTarefaHeader && listaPerguntasTarefa && listaResultadosAlunos) {
        fetchData(); 
    } else {
        console.error("Não foi possível iniciar o fetchData pois elementos essenciais estão faltando.");
    }
});