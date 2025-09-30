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

    if (!tituloTarefaHeader || !listaPerguntasTarefa || !bancoPerguntasContainer || !btnAbrirModalPergunta || !modalNovaPergunta || !formNovaPergunta || !btnFecharModal) {
        return; // Impede a execução e o erro
    }

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');


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

    const renderResultados = (resultados) => {
        listaResultados.innerHTML = '';
        if (!resultados || resultados.length === 0) {
            listaResultados.innerHTML = '<div class="resultado-item">Nenhum aluno concluiu esta tarefa ainda.</div>';
            return;
        }
        // Ordena os resultados pela maior pontuação
        resultados.sort((a, b) => b.pontuacao - a.pontuacao);

        resultados.forEach(res => {
            const item = document.createElement('div');
            item.className = 'resultado-item';
            item.innerHTML = `
                <span class="resultado-aluno-nome">${res.alunoNome}</span>
                <span class="resultado-pontuacao">${res.pontuacao} / ${res.totalPerguntas}</span>
            `;
            listaResultados.appendChild(item);
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
            if (!item.pergunta) return; // Segurança extra
            const card = document.createElement('div');
            card.className = 'pergunta-card';
            
            let opcoesHtml = '<ol>';
            item.pergunta.opcoes.forEach((opcao, index) => {
                const classeCorreta = index === item.pergunta.opcaoCorreta ? ' class="correta"' : '';
                opcoesHtml += `<li${classeCorreta}>${opcao}</li>`;
            });
            opcoesHtml += '</ol>';

            card.innerHTML = `<strong>${item.pergunta.texto}</strong>${opcoesHtml}`;
            listaPerguntasTarefa.appendChild(card);
        });
    };
    
    const renderBancoDePerguntas = (perguntas) => {
        bancoPerguntasContainer.innerHTML = '';
        if (!perguntas || perguntas.length === 0) {
            bancoPerguntasContainer.innerHTML = '<p>Nenhuma pergunta no banco.</p>';
            return;
        }
        perguntas.forEach(pergunta => {
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
            const bancoDePerguntas = await bancoRes.json();
            
            tituloTarefaHeader.textContent = tarefaAtual.titulo;
            renderPerguntasDaTarefa(tarefaAtual.perguntas);
            renderBancoDePerguntas(bancoDePerguntas);
            renderResultados(tarefaAtual.resultados);
            
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

    // --- EVENT LISTENERS ---
    btnAbrirModalPergunta.addEventListener('click', () => modalNovaPergunta.style.display = 'flex');
    btnFecharModal.addEventListener('click', () => modalNovaPergunta.style.display = 'none');
    formNovaPergunta.addEventListener('submit', handleCriarNovaPergunta);

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
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro.');
            showToast(successMsg, 'success');
            fetchData(); // Recarrega todos os dados
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const showToast = (message, type) => { /* ... código existente ... */ };
    
    fetchData(); // Busca os dados iniciais ao carregar a página
});
