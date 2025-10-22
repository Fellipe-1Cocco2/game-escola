document.addEventListener('DOMContentLoaded', () => {

    const getElement = (id, required = true) => {
        const el = document.getElementById(id);
        if (!el && required) {
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
    const formNovaPergunta = getElement('form-nova-pergunta');
    const toastNotification = getElement('toast-notification');
    const voltarSalaLink = getElement('voltar-sala-link');
    const btnFecharModal = document.querySelector('#modal-nova-pergunta .btn-fechar-modal');
    const listaResultadosAlunos = getElement('lista-resultados-alunos');
    const inputBuscaBanco = getElement('input-busca-banco');

    if (!tituloTarefaHeader || !listaPerguntasTarefa || !bancoPerguntasContainer || !btnAbrirModalPergunta || !modalNovaPergunta || !formNovaPergunta || !btnFecharModal) {
        return; // Impede a execução e o erro
    }

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    let bancoDePerguntasCompleto = [];

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // Extrai IDs da URL
    let toastTimeout;
    const pathParts = window.location.pathname.split('/');
    const tarefaId = pathParts[2];
    const salaId = pathParts[4];
    voltarSalaLink.href = `/sala/${salaId}`;

    let tarefaAtual = null;

     const renderResultados = (resultados, totalPerguntas) => {
        listaResultadosAlunos.innerHTML = '';
        if (!resultados || resultados.length === 0) {
            listaResultadosAlunos.innerHTML = '<div class="pergunta-card">Nenhum aluno cadastrado nesta sala.</div>';
            return;
        }
        
        // Ordena por pontuação (maior primeiro) e depois por nome
        resultados.sort((a, b) => {
            if (b.pontuacao !== a.pontuacao) {
                return b.pontuacao - a.pontuacao;
            }
            return a.nome.localeCompare(b.nome);
        });

        resultados.forEach(res => {
            const item = document.createElement('div');
            item.className = 'resultado-item';
            
            // Define a classe e o texto do status
            const statusClasse = `status-${res.status.replace('_', '-')}`;
            const statusTexto = res.status.replace('-', ' ');

            item.innerHTML = `
                <div class="resultado-aluno-info">
                    <span>${res.nome}</span>
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

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderPerguntasDaTarefa = (perguntas) => {
        listaPerguntasTarefa.innerHTML = '';
        if (!perguntas || perguntas.length === 0) {
            listaPerguntasTarefa.innerHTML = '<div class="pergunta-card">Nenhuma pergunta adicionada a esta tarefa.</div>';
            return;
        }
        perguntas.forEach(item => {
            if (!item || !item.pergunta) { // Verificação extra
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

            // Adiciona o botão de remover
            const btnRemover = document.createElement('button');
            btnRemover.className = 'btn-remover-pergunta';
            btnRemover.textContent = 'Remover';
            btnRemover.onclick = () => handleRemoverPergunta(item.pergunta._id);

            card.innerHTML = `<strong>${item.pergunta.texto}</strong>${opcoesHtml}`;
            card.appendChild(btnRemover); // Adiciona o botão ao card
            listaPerguntasTarefa.appendChild(card);
        });
    };
    
   const renderBancoDePerguntas = (termoBusca = '') => {
        bancoPerguntasContainer.innerHTML = '';
        const termoLower = termoBusca.toLowerCase();

        // Filtra as perguntas com base no termo de busca
        const perguntasFiltradas = bancoDePerguntasCompleto.filter(pergunta =>
            pergunta.texto.toLowerCase().includes(termoLower)
        );

        if (perguntasFiltradas.length === 0) {
            bancoPerguntasContainer.innerHTML = `<p>${termoBusca ? 'Nenhuma pergunta encontrada.' : 'Nenhuma pergunta no banco.'}</p>`;
            return;
        }

        perguntasFiltradas.forEach(pergunta => {
            const item = document.createElement('div');
            item.className = 'banco-item';
            item.innerHTML = `<p>${pergunta.texto}</p>`;
            
            const btnAdicionar = document.createElement('button');
            btnAdicionar.className = 'btn-adicionar-banco';
            btnAdicionar.textContent = 'Adicionar';
            btnAdicionar.onclick = () => handleAdicionarDoBanco(pergunta._id);
            
            item.appendChild(btnAdicionar);
            bancoPerguntasContainer.appendChild(item);
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
            bancoDePerguntasCompleto = await bancoRes.json();
            
            tituloTarefaHeader.textContent = tarefaAtual.titulo;
            renderPerguntasDaTarefa(tarefaAtual.perguntas);
            renderBancoDePerguntas();
             renderResultados(tarefaAtual.resultadosCompletos, tarefaAtual.perguntas.length);
            
        } catch (error) {
            console.error("Erro ao carregar dados da tarefa:", error);
            showToast('Não foi possível carregar os dados.', 'error');
        }
    };
    
    // --- MANIPULADORES DE EVENTOS (HANDLERS) ---
    const handleCriarNovaPergunta = async (e) => {
        e.preventDefault();
        const texto = document.getElementById('texto-pergunta').value.trim();
        const opcoesInputs = document.querySelectorAll('.input-opcao');
        const opcaoCorretaInput = document.querySelector('input[name="opcao-correta"]:checked');
        
        const opcoes = Array.from(opcoesInputs).map(input => input.value.trim());
        
        if (!texto || opcoes.some(opt => !opt) || !opcaoCorretaInput) {
            showToast('Preencha todos os campos da pergunta.', 'error');
            return;
        }
        
        const body = {
            texto,
            opcoes,
            opcaoCorreta: parseInt(opcaoCorretaInput.value)
        };
        
        await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas`, 'POST', body, 'Pergunta criada e adicionada!');
        formNovaPergunta.reset();
        modalNovaPergunta.style.display = 'none';
    };
    
    const handleAdicionarDoBanco = async (perguntaId) => {
        await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/banco-perguntas`, 'POST', { perguntaId }, 'Pergunta adicionada do banco!');
    };
    const handleRemoverPergunta = async (perguntaId) => {
            if (!confirm('Tem certeza que deseja remover esta pergunta da tarefa?')) {
                return;
            }
            await sendRequest(`/api/game/salas/${salaId}/tarefas/${tarefaId}/perguntas/${perguntaId}`, 'DELETE', null, 'Pergunta removida com sucesso!');
        };
    // --- EVENT LISTENERS ---
    btnAbrirModalPergunta.addEventListener('click', () => modalNovaPergunta.style.display = 'flex');
    btnFecharModal.addEventListener('click', () => modalNovaPergunta.style.display = 'none');
    formNovaPergunta.addEventListener('submit', handleCriarNovaPergunta);
    inputBuscaBanco.addEventListener('input', (e) => {
        renderBancoDePerguntas(e.target.value);
    });
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

            // --- INÍCIO DA MODIFICAÇÃO ---
            if (!response.ok) {
                // Verifica se o erro é um 409 (Conflito)
                if (response.status === 409) {
                    // Lança um erro específico para o toast de aviso
                    throw { status: 409, message: data.message || 'Ação bloqueada (conflito).' };
                } else {
                    // Lança um erro genérico para outros problemas
                    throw new Error(data.message || 'Ocorreu um erro.');
                }
            }
            // --- FIM DA MODIFICAÇÃO ---

            showToast(successMsg, 'success');

            if (data && data._id && data.perguntas !== undefined) {
                tarefaAtual = data;
                renderPerguntasDaTarefa(tarefaAtual.perguntas);
                renderResultados(tarefaAtual.resultadosCompletos, tarefaAtual.perguntas.length);
            } else {
                fetchData();
            }

        } catch (error) {
            // --- INÍCIO DA MODIFICAÇÃO ---
            // Verifica se o erro tem o status 409 e usa o tipo 'info' (azul)
            console.error('Erro detalhado capturado:', error);
            if (error && error.status === 409) {
                console.log('Detectado erro 409, mostrando toast info.');
                showToast(error.message, 'info');
            } else {
                console.log('Erro não é 409, mostrando toast error.');
                showToast(error.message || 'Ocorreu um erro desconhecido.', 'error');
            }
            // --- FIM DA MODIFICAÇÃO ---

        }
    };

    const showToast = (message, type = 'success') => { // Padrão sucesso
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification'; // Reseta classes
        
        // Adiciona a classe correta (success, error, ou info)
        if (type === 'success') {
            toastNotification.classList.add('success');
        } else if (type === 'info') {
            toastNotification.classList.add('info'); // Classe para avisos (azul)
        } else {
            toastNotification.classList.add('error');
        }
        
        toastNotification.classList.add('show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000); // Aumentado para 4 segundos
    };
    
    fetchData(); // Busca os dados iniciais ao carregar a página
});
