document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES ---
    const tituloTarefaHeader = document.getElementById('titulo-tarefa-header');
    const listaPerguntasTarefa = document.getElementById('lista-perguntas-tarefa');
    const bancoPerguntasContainer = document.getElementById('banco-perguntas-container');
    const btnAbrirModalPergunta = document.getElementById('btn-abrir-modal-pergunta');
    const modalNovaPergunta = document.getElementById('modal-nova-pergunta');
    const formNovaPergunta = document.getElementById('form-nova-pergunta');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;
    const voltarSalaLink = document.getElementById('voltar-sala-link');

    // Extrai IDs da URL
    const pathParts = window.location.pathname.split('/');
    const tarefaId = pathParts[2];
    const salaId = pathParts[4];
    voltarSalaLink.href = `/sala/${salaId}`; // Define o link de volta

    let tarefaAtual = null;

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderPerguntasDaTarefa = (perguntas) => {
        listaPerguntasTarefa.innerHTML = '';
        if (!perguntas || perguntas.length === 0) {
            listaPerguntasTarefa.innerHTML = '<div class="pergunta-card">Nenhuma pergunta adicionada a esta tarefa.</div>';
            return;
        }
        perguntas.forEach(item => {
            const card = document.createElement('div');
            card.className = 'pergunta-card';
            
            let opcoesHtml = '<ol type="A">';
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
            btnAdicionar.className = 'btn btn-secondary';
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
    document.querySelector('#modal-nova-pergunta .btn-fechar-modal').addEventListener('click', () => modalNovaPergunta.style.display = 'none');
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
