document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos ---
    const nomeProfessorEl = document.getElementById('nome-professor');
    const listaSalasEl = document.getElementById('lista-salas');
    const btnLogoutEl = document.getElementById('btn-logout');

    // Elementos do Modal
    const btnAbrirModalEl = document.getElementById('btn-abrir-modal');
    const modalEl = document.getElementById('modal-nova-sala');
    const btnFecharModalEl = document.getElementById('btn-fechar-modal');
    const formNovaSalaEl = document.getElementById('form-nova-sala');
    const selectAnoSerieEl = document.getElementById('select-ano-serie');
    const selectTurmaEl = document.getElementById('select-turma');

    const toastNotificationEl = document.getElementById('toast-notification');
    let toastTimeout;
    let professorLogado = null;

    // Verificação de segurança para garantir que todos os elementos existem no HTML
    if (!nomeProfessorEl || !listaSalasEl || !btnLogoutEl || !btnAbrirModalEl || !modalEl || !formNovaSalaEl) {
        console.error("Erro crítico: Elementos essenciais do dashboard não foram encontrados no DOM. Verifique os IDs no ficheiro dashboard.html.");
        return;
    }

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            // 1. Busca os dados do professor logado
            const meResponse = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!meResponse.ok) throw new Error('Sessão expirada. Por favor, faça login novamente.');
            professorLogado = await meResponse.json();
            nomeProfessorEl.textContent = professorLogado.name;

            // 2. Busca todas as salas
            const salasResponse = await fetch('/api/game/salas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!salasResponse.ok) throw new Error('Não foi possível carregar as salas.');
            const salas = await salasResponse.json();
            
            renderSalas(salas);

        } catch (error) {
            console.error("Erro:", error);
            showToast(error.message, 'error');
            // Se a sessão expirou, desloga o usuário
            if (error.message.includes('Sessão')) {
                handleLogout();
            }
        }
    };

    const renderSalas = (salas) => {
        listaSalasEl.innerHTML = '';
        if (salas.length === 0) {
            listaSalasEl.innerHTML = '<p class="empty-message">Nenhuma sala criada ainda. Crie uma nova para começar!</p>';
            return;
        }

        salas.forEach(sala => {
            // Verificação de segurança para salas com dados incompletos
            if (!sala || !sala.criador) {
                console.warn('Sala com dados inválidos foi ignorada:', sala);
                return;
            }

            const isDono = professorLogado && professorLogado._id === sala.criador._id;
            const isEditor = professorLogado && (sala.editoresConvidados || []).some(editorId => editorId === professorLogado._id);
            const podeGerenciar = isDono || isEditor;

            const salaCard = document.createElement('div');
            salaCard.className = 'sala-card';
            salaCard.innerHTML = `
                <div class="sala-card-header">
                    <h3>${sala.num_serie}</h3>
                    <div class="selos">
                        ${isDono ? '<span class="selo selo-dono">Você é o Dono</span>' : ''}
                        ${isEditor ? '<span class="selo selo-editor">Editor Convidado</span>' : ''}
                    </div>
                </div>
                <div class="sala-card-body">
                    <p>Criado por: <strong>${sala.criador.name}</strong></p>
                    <div class="stats">
                        <span><strong>${(sala.tarefas || []).length}</strong> Tarefas</span>
                        <span><strong>${(sala.alunos || []).length}</strong> Alunos</span>
                    </div>
                </div>
                <div class="sala-card-footer">
                    ${podeGerenciar ? `<a href="/sala/${sala._id}" class="btn-gerenciar">Gerenciar Sala &rarr;</a>` : '<p class="sem-acesso">Apenas visualização</p>'}
                </div>
            `;
            listaSalasEl.appendChild(salaCard);
        });
    };

    const handleCriarSala = async (event) => {
        event.preventDefault();
        const anoSerie = selectAnoSerieEl.value;
        const turma = selectTurmaEl.value;

        if (!anoSerie || !turma) {
            showToast('Por favor, selecione o ano/série e a turma.', 'error');
            return;
        }

        const nomeCompletoSala = `${anoSerie} - Turma ${turma}`;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/game/salas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ num_serie: nomeCompletoSala })
            });

            // --- ESTA É A CORREÇÃO ---
            // Se a resposta não for 'ok' (ex: erro 409 - Conflito),
            // tentamos ler a mensagem de erro que o backend enviou.
            if (!response.ok) {
                const errorData = await response.json(); // Extrai o { "message": "..." } do corpo da resposta
                throw new Error(errorData.message || 'Falha ao criar a sala.'); // Lança um erro com a mensagem específica
            }

            const novaSala = await response.json();
            fecharModal();
            fetchDashboardData();
            showToast('Sala criada com sucesso!', 'success');

        } catch (error) {
            console.error("Erro ao criar sala:", error);
            showToast(error.message, 'error'); // Agora o toast mostrará a mensagem correta, ex: "Uma sala com este nome já existe."
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const showToast = (message, type = 'error') => {
        clearTimeout(toastTimeout);
        toastNotificationEl.textContent = message;
        toastNotificationEl.className = 'toast-notification';
        toastNotificationEl.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotificationEl.classList.remove('show');
        }, 4000);
    };

    // Funções para controlar o modal
    const abrirModal = () => modalEl.classList.remove('hidden');
    const fecharModal = () => {
        modalEl.classList.add('hidden');
        formNovaSalaEl.reset(); // Limpa o formulário ao fechar
    };

    // Event Listeners
    btnLogoutEl.addEventListener('click', handleLogout);
    btnAbrirModalEl.addEventListener('click', abrirModal);
    btnFecharModalEl.addEventListener('click', fecharModal);
    formNovaSalaEl.addEventListener('submit', handleCriarSala);
    modalEl.addEventListener('click', (e) => {
        // Fecha o modal se o clique for no fundo escuro
        if (e.target === modalEl) {
            fecharModal();
        }
    });

    // Inicia o carregamento dos dados da página
    fetchDashboardData();
});

