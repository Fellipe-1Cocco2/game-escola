document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos ---
    const nomeProfessorEl = document.getElementById('nome-professor');
    const listaSalasEl = document.getElementById('lista-salas');
    const btnLogoutEl = document.getElementById('btn-logout');

    // Elementos do Modal Nova Sala
    const btnAbrirModalEl = document.getElementById('btn-abrir-modal');
    const modalEl = document.getElementById('modal-nova-sala');
    const btnFecharModalEl = document.getElementById('btn-fechar-modal');
    const formNovaSalaEl = document.getElementById('form-nova-sala');
    const selectAnoSerieEl = document.getElementById('select-ano-serie');
    const selectTurmaEl = document.getElementById('select-turma');

    // ****** NOVO: Elementos do Modal Editar Perfil ******
    const btnAbrirModalPerfilEl = document.getElementById('btn-abrir-modal-perfil');
    const modalPerfilEl = document.getElementById('modal-editar-perfil');
    const btnFecharModalPerfilEl = document.getElementById('btn-fechar-modal-perfil');
    const formEditarNomeEl = document.getElementById('form-editar-nome');
    const formAlterarSenhaEl = document.getElementById('form-alterar-senha');
    const nomePerfilInput = document.getElementById('nome-perfil');
    const senhaAtualInput = document.getElementById('senha-atual');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarNovaSenhaInput = document.getElementById('confirmar-nova-senha');
    // ****** FIM NOVO ******

    const toastNotificationEl = document.getElementById('toast-notification');
    let toastTimeout;
    let professorLogado = null; // Guarda os dados do professor

    // Verificação de segurança
    if (!nomeProfessorEl || !listaSalasEl || !btnLogoutEl || !btnAbrirModalEl || !modalEl || !formNovaSalaEl || !btnAbrirModalPerfilEl || !modalPerfilEl) { // Adicionado verificação modal perfil
        console.error("Erro crítico: Elementos essenciais do dashboard não foram encontrados no DOM.");
        return;
    }

    // --- Função Genérica para Requisições ---
    const sendRequest = async (url, method, body = null, headers = {}) => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            throw new Error('Token não encontrado.');
        }
        try {
            const defaultHeaders = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await fetch(url, {
                method: method,
                headers: { ...defaultHeaders, ...headers },
                body: body ? JSON.stringify(body) : null
            });

            if (response.status === 401) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`Erro na requisição ${method} ${url}:`, error);
            // Trata erro 401 especificamente
            if (error.status === 401 || error.message.includes('Sessão expirada')) {
                showToast('Sua sessão expirou. Por favor, faça login novamente.', 'error');
                setTimeout(() => {
                    handleLogout();
                }, 2000);
            } else {
                showToast(error.message || 'Ocorreu um erro na operação.', 'error');
            }
            throw error; // Re-lança o erro para quem chamou saber que falhou
        }
    };


    const fetchDashboardData = async () => {
        try {
            // 1. Busca os dados do professor logado (já inclui escola)
            professorLogado = await sendRequest('/api/users/me', 'GET'); // Usa sendRequest
            nomeProfessorEl.textContent = professorLogado.name;

            // 2. Busca as salas da escola do professor
            const salas = await sendRequest('/api/game/salas', 'GET'); // Usa sendRequest
            renderSalas(salas);

        } catch (error) {
           // O erro já é tratado e exibido dentro do sendRequest
           // Apenas garantimos que o spinner ou mensagem de loading seja removido se houver
           listaSalasEl.innerHTML = '<p class="empty-message">Não foi possível carregar as salas.</p>'; // Mensagem de erro
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
            // Corrigido: editoresConvidados pode não existir ou ser null
           const isEditor = professorLogado &&
                         Array.isArray(sala.editoresConvidados) &&
                         sala.editoresConvidados.some(editorIdOrObject => {
                             // Compara diretamente com o ID do professor logado
                             // Funciona se for um ID (string) ou um objeto {_id: ...}
                             const editorId = editorIdOrObject?._id || editorIdOrObject;
                             return editorId && editorId.toString() === professorLogado._id;
                         });

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
        // ... (seu código handleCriarSala existente) ...
         event.preventDefault();
        const anoSerie = selectAnoSerieEl.value;
        const turma = selectTurmaEl.value;

        if (!anoSerie || !turma) {
            showToast('Por favor, selecione o ano/série e a turma.', 'error');
            return;
        }

        const nomeCompletoSala = `${anoSerie} - Turma ${turma}`;

        try {
            await sendRequest('/api/game/salas', 'POST', { num_serie: nomeCompletoSala });
            fecharModal();
            fetchDashboardData(); // Recarrega tudo
            showToast('Sala criada com sucesso!', 'success');

        } catch (error) {
            // Erro já tratado no sendRequest
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const showToast = (message, type = 'error') => {
        // ... (seu código showToast existente) ...
        clearTimeout(toastTimeout);
        toastNotificationEl.textContent = message;
        toastNotificationEl.className = 'toast-notification';
        toastNotificationEl.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotificationEl.classList.remove('show');
        }, 4000);
    };

    // Funções Modal Nova Sala
    const abrirModal = () => modalEl.classList.remove('hidden');
    const fecharModal = () => {
        modalEl.classList.add('hidden');
        formNovaSalaEl.reset();
    };

    // ****** NOVO: Funções Modal Editar Perfil ******
    const abrirModalPerfil = () => {
        if (professorLogado && nomePerfilInput) {
            nomePerfilInput.value = professorLogado.name; // Preenche o nome atual
        }
        // Limpa campos de senha
        if(senhaAtualInput) senhaAtualInput.value = '';
        if(novaSenhaInput) novaSenhaInput.value = '';
        if(confirmarNovaSenhaInput) confirmarNovaSenhaInput.value = '';

        modalPerfilEl.classList.remove('hidden');
    };

    const fecharModalPerfil = () => {
        modalPerfilEl.classList.add('hidden');
        // Opcional: Limpar formulários se não foram submetidos com sucesso
        if(formEditarNomeEl) formEditarNomeEl.reset();
        if(formAlterarSenhaEl) formAlterarSenhaEl.reset();
    };

    const handleEditarNome = async (event) => {
        event.preventDefault();
        const novoNome = nomePerfilInput.value.trim();

        if (!novoNome) {
            showToast('O nome não pode ficar vazio.', 'error');
            return;
        }
        if (novoNome === professorLogado.name) {
             showToast('O novo nome é igual ao atual.', 'info');
             return;
        }

        try {
            const updatedProfessor = await sendRequest('/api/users/me/profile', 'PUT', { name: novoNome });
            showToast('Nome atualizado com sucesso!', 'success');
            // Atualiza o nome no header e na variável local
            professorLogado.name = updatedProfessor.name;
            nomeProfessorEl.textContent = updatedProfessor.name;
            fecharModalPerfil();
        } catch (error) {
            // Erro já tratado no sendRequest
        }
    };

    const handleAlterarSenha = async (event) => {
        event.preventDefault();
        const senhaAtual = senhaAtualInput.value; // Não usa trim() em senhas
        const novaSenha = novaSenhaInput.value;
        const confirmarNovaSenha = confirmarNovaSenhaInput.value;

        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            showToast('Todos os campos de senha são obrigatórios.', 'error');
            return;
        }
        if (novaSenha.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        if (novaSenha !== confirmarNovaSenha) {
            showToast('A nova senha e a confirmação não coincidem.', 'error');
            return;
        }

        try {
            // O backend retorna apenas uma mensagem de sucesso, não dados do usuário
            await sendRequest('/api/users/me/password', 'PUT', {
                currentPassword: senhaAtual,
                newPassword: novaSenha
            });
            showToast('Senha alterada com sucesso!', 'success');
            fecharModalPerfil(); // Fecha o modal após sucesso
        } catch (error) {
            // Erro já tratado no sendRequest (ex: senha atual incorreta)
        }
    };
    // ****** FIM NOVO ******

    // Event Listeners
    btnLogoutEl.addEventListener('click', handleLogout);
    btnAbrirModalEl.addEventListener('click', abrirModal);
    btnFecharModalEl.addEventListener('click', fecharModal);
    formNovaSalaEl.addEventListener('submit', handleCriarSala);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) fecharModal(); });

    // ****** NOVO: Event Listeners Modal Editar Perfil ******
    btnAbrirModalPerfilEl.addEventListener('click', abrirModalPerfil);
    btnFecharModalPerfilEl.addEventListener('click', fecharModalPerfil);
    modalPerfilEl.addEventListener('click', (e) => { if (e.target === modalPerfilEl) fecharModalPerfil(); });
    formEditarNomeEl.addEventListener('submit', handleEditarNome);
    formAlterarSenhaEl.addEventListener('submit', handleAlterarSenha);
    // ****** FIM NOVO ******

    // Inicia o carregamento dos dados da página
    fetchDashboardData();
});