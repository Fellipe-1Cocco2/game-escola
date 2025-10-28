document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores ---
    const schoolNameHeader = document.getElementById('school-name-header');
    const professorsTableBody = document.getElementById('professors-table-body');
    const salasTableBody = document.getElementById('salas-table-body');
    const btnLogout = document.getElementById('btn-logout');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;
    const adminToken = localStorage.getItem('admin_token');
    const schoolId = window.location.pathname.split('/')[3];

    // --- Seletores dos Novos Modais de Professor ---
    const modalEditProfessor = document.getElementById('modal-edit-professor');
    const formEditProfessor = document.getElementById('form-edit-professor');
    const editProfessorIdInput = document.getElementById('edit-professor-id');
    const editProfessorNameInput = document.getElementById('edit-professor-name');
    const editProfessorEmailInput = document.getElementById('edit-professor-email');
    const editProfessorSchoolSelect = document.getElementById('edit-professor-school');

    const modalChangePassword = document.getElementById('modal-change-professor-password');
    const formChangePassword = document.getElementById('form-change-professor-password');
    const changePasswordProfessorIdInput = document.getElementById('change-password-professor-id');
    const changePasswordProfessorNameEl = document.getElementById('change-password-professor-name');
    const newProfessorPasswordInput = document.getElementById('new-professor-password');
    const confirmNewProfessorPasswordInput = document.getElementById('confirm-new-professor-password');

    const modalConfirmDelete = document.getElementById('modal-confirm-delete-professor');
    const deleteProfessorNameEl = document.getElementById('delete-professor-name');
    const btnConfirmProfessorDeletion = document.getElementById('btn-confirm-professor-deletion');
    let professorToDeleteId = null; // Variável para guardar o ID a ser excluído

    // --- Verificação Inicial ---
    if (!adminToken) {
        window.location.href = '/admin/login';
        return;
    }
    if (!schoolId) {
        alert('ID da escola não encontrado na URL.');
        window.location.href = '/admin/dashboard';
        return;
    }
    // Verifica se os elementos essenciais existem
    if (!schoolNameHeader || !professorsTableBody || !salasTableBody || !modalEditProfessor || !modalChangePassword || !modalConfirmDelete) {
        console.error("Erro Crítico: Elementos essenciais da página ou modais não encontrados.");
        return;
    }


    // --- Funções Auxiliares ---
    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    };

    const sendAdminRequest = async (url, method, body = null, ignoreResponseData = false) => { // Adicionado ignoreResponseData
        try {
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: body ? JSON.stringify(body) : null
            };
            // Adiciona Content-Type apenas se houver corpo
            if (body) {
                options.headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(url, options);

            if (response.status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
                localStorage.removeItem('admin_token');
                setTimeout(() => window.location.href = '/admin/login', 1500);
                throw new Error('Não autorizado');
            }

            // Para DELETE e alguns PUT, pode não haver corpo na resposta de sucesso (204 No Content)
            if (response.status === 204) {
                 return true; // Indica sucesso sem dados
            }
             // Para DELETE com sucesso 200, podemos querer ignorar os dados
            if (response.ok && ignoreResponseData) {
                return true;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}`);
            }
            return data;

        } catch (error) {
            if (error.message !== 'Não autorizado') {
                console.error(`Erro na requisição admin para ${url}:`, error);
                showToast(error.message || 'Ocorreu um erro na operação.', 'error');
            }
            return null; // Indica erro
        }
    };

    // --- Funções de Modal Genéricas ---
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        // Limpa formulários associados ao fechar (boa prática)
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Limpa variáveis de estado se necessário (ex: ID a ser excluído)
        if (modalId === 'modal-confirm-delete-professor') {
            professorToDeleteId = null;
        }
    };

    // Adiciona listeners para fechar modais (botão X e clique fora)
    document.querySelectorAll('.btn-close-modal').forEach(button => {
        button.addEventListener('click', () => {
            closeModal(button.dataset.modalId);
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
         overlay.addEventListener('click', (e) => {
             if (e.target === overlay) { // Só fecha se clicar no fundo
                 closeModal(overlay.id);
             }
         });
     });

    // --- Funções de Renderização ---
    const renderProfessors = (professors) => {
        professorsTableBody.innerHTML = '';
        if (!professors || professors.length === 0) {
            professorsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Nenhum professor encontrado para esta escola.</td></tr>';
            return;
        }
        professors.forEach(prof => {
            console.log('Dados do Professor recebidos em renderProfessors:', prof);
            console.log('Valor específico de prof.school:', prof.school);
            const row = professorsTableBody.insertRow();
            // Guarda a escola atual do professor no botão de edição para pré-selecionar no modal
            row.innerHTML = `
                <td>${prof.name}</td>
                <td>${prof.email}</td>
                <td>
                    <button class="btn-edit btn-edit-professor" data-id="${prof._id}" data-name="${prof.name}" data-email="${prof.email}" data-school-id="${prof.school ? (prof.school._id || prof.school) : ''}">
                        <i data-feather="edit-2"></i> Editar Dados
                    </button>
                    <button class="btn-secondary btn-change-password-professor" data-id="${prof._id}" data-name="${prof.name}">
                        <i data-feather="lock"></i> Alterar Senha
                    </button>
                    <button class="btn-delete btn-delete-professor" data-id="${prof._id}" data-name="${prof.name}">
                        <i data-feather="trash-2"></i> Excluir
                    </button>
                </td>
            `;
        });
        feather.replace(); // Renderiza os ícones Feather
    };

    const renderSalas = (salas) => {
         // ... (código renderSalas existente, sem alterações) ...
         salasTableBody.innerHTML = '';
         if (!salas || salas.length === 0) {
             salasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Nenhuma sala encontrada para esta escola.</td></tr>';
             return;
         }
         salas.forEach(sala => {
             const row = salasTableBody.insertRow();
             // Simplificando botões de sala por enquanto
             row.innerHTML = `
                 <td>${sala.num_serie}</td>
                 <td>${sala.criadorNome}</td>
                 <td>${sala.numAlunos}</td>
                 <td>${sala.numTarefas}</td>
                 <td>
                     <button class="btn-view-details btn-view-sala-details" data-id="${sala._id}"><i data-feather="eye"></i> Ver Detalhes</button>
                     </td>
             `;
         });
         feather.replace();
     };

    // --- Carregamento Inicial ---
    const loadSchoolDetails = async () => {
        const data = await sendAdminRequest(`/api/admin/schools/${schoolId}/details`, 'GET');
        if (data && data.school) { // Verifica se data.school existe
            if (schoolNameHeader) schoolNameHeader.textContent = data.school.name;
            renderProfessors(data.professors);
            renderSalas(data.salas);
        } else if (data === null) { // Se sendAdminRequest retornou null (erro)
             if(schoolNameHeader) schoolNameHeader.textContent = "Erro ao carregar";
             if(professorsTableBody) professorsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Erro ao carregar professores.</td></tr>';
             if(salasTableBody) salasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Erro ao carregar salas.</td></tr>';
        } else {
            // Caso data exista mas data.school não (inesperado)
            showToast('Dados da escola inválidos recebidos do servidor.', 'error');
            if(schoolNameHeader) schoolNameHeader.textContent = "Erro";
        }
    };

     // --- Logout ---
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    };
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // --- Funções e Handlers para Modais de Professor ---

    // Carrega escolas para o select do modal de edição
    const populateSchoolSelect = async (selectElement, selectedSchoolId = null) => {
        try { // Wrap in try...catch
            const schools = await sendAdminRequest('/api/admin/schools', 'GET');
            selectElement.innerHTML = '<option value="">-- Selecione a Escola --</option>'; // Opção padrão
            if (schools) {
                schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school._id;
                    option.textContent = school.name;
                    // Pré-seleciona a escola atual do professor
                    if (school._id === selectedSchoolId) { // <--- LÓGICA DE SELEÇÃO
                        option.selected = true;
                        console.log(`-->> School matched and selected: ${school.name} (ID: ${school._id})`); // Log specific match
                    }
                    selectElement.appendChild(option);
                });
            } else {
                selectElement.innerHTML = '<option value="">Erro ao carregar escolas</option>';
            }

            // *** MOVA O CONSOLE.LOG PARA CÁ ***
            console.log(`Inside populateSchoolSelect - AFTER loop - select value: ${selectElement.value}`);
            console.log(`Inside populateSchoolSelect - Expected schoolId: ${selectedSchoolId}`);

        } catch (error) { // Add catch block
            console.error("Error fetching or populating schools:", error);
            selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    };
    // Abre o modal de edição de dados do professor
    const openEditProfessorModal = (professorId, name, email, currentSchoolId) => {
        editProfessorIdInput.value = professorId;
        editProfessorNameInput.value = name;
        editProfessorEmailInput.value = email;

        populateSchoolSelect(editProfessorSchoolSelect, currentSchoolId); // Popula e seleciona a escola
        openModal('modal-edit-professor');
        console.log(editProfessorSchoolSelect.value)
        console.log(currentSchoolId)
    };

    // Abre o modal de alteração de senha
    const openChangePasswordModal = (professorId, name) => {
        changePasswordProfessorIdInput.value = professorId;
        changePasswordProfessorNameEl.textContent = name;
        formChangePassword.reset(); // Limpa senhas anteriores
        openModal('modal-change-professor-password');
    };

    // Abre o modal de confirmação de exclusão
    const openDeleteProfessorModal = (professorId, name) => {
        professorToDeleteId = professorId; // Guarda o ID
        deleteProfessorNameEl.textContent = name;
        openModal('modal-confirm-delete-professor');
    };

    // Submissão do formulário de edição de dados
    formEditProfessor.addEventListener('submit', async (e) => {
        e.preventDefault();
        const professorId = editProfessorIdInput.value;
        const name = editProfessorNameInput.value.trim();
        const email = editProfessorEmailInput.value.trim();
        const schoolId = editProfessorSchoolSelect.value;

        if (!name || !email || !schoolId) {
            showToast('Nome, email e escola são obrigatórios.', 'error');
            return;
        }

        const result = await sendAdminRequest(`/api/admin/professors/${professorId}`, 'PUT', { name, email, schoolId });
        if (result) {
            showToast('Dados do professor atualizados!', 'success');
            closeModal('modal-edit-professor');
            loadSchoolDetails(); // Recarrega os dados da página
        }
    });

    // Submissão do formulário de alteração de senha
    formChangePassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const professorId = changePasswordProfessorIdInput.value;
        const newPassword = newProfessorPasswordInput.value;
        const confirmPassword = confirmNewProfessorPasswordInput.value;

        if (!newPassword || !confirmPassword) {
            showToast('Preencha a nova senha e a confirmação.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('As novas senhas não coincidem.', 'error');
            return;
        }

        // Envia APENAS a nova senha no corpo da requisição PUT
        const result = await sendAdminRequest(`/api/admin/professors/${professorId}`, 'PUT', { password: newPassword });
        if (result) {
            showToast('Senha do professor alterada com sucesso!', 'success');
            closeModal('modal-change-professor-password');
            // Não precisa recarregar a lista, pois a senha não é exibida
        }
    });

    // Confirmação da exclusão do professor
    btnConfirmProfessorDeletion.addEventListener('click', async () => {
        if (!professorToDeleteId) return;

        // Adicionado ignoreResponseData = true para DELETE
        const result = await sendAdminRequest(`/api/admin/professors/${professorToDeleteId}`, 'DELETE', null, true);
        if (result) {
            showToast('Professor excluído com sucesso.', 'success');
            closeModal('modal-confirm-delete-professor');
            loadSchoolDetails(); // Recarrega a lista
        }
    });


    // --- Delegação de Eventos para Ações nas Tabelas ---
    if (professorsTableBody) {
        professorsTableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit-professor');
            const changePwdBtn = e.target.closest('.btn-change-password-professor');
            const deleteBtn = e.target.closest('.btn-delete-professor');

            if (editBtn) {
                console.log('Button data-school-id:', editBtn.dataset.schoolId);
                openEditProfessorModal(
                    editBtn.dataset.id,
                    editBtn.dataset.name,
                    editBtn.dataset.email,
                    editBtn.dataset.schoolId // Passa o ID da escola atual
                );
            } else if (changePwdBtn) {
                openChangePasswordModal(changePwdBtn.dataset.id, changePwdBtn.dataset.name);
            } else if (deleteBtn) {
                openDeleteProfessorModal(deleteBtn.dataset.id, deleteBtn.dataset.name);
            }
        });
    }

    if (salasTableBody) {
        salasTableBody.addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.btn-view-sala-details');
            // Os botões de editar/excluir sala podem ser adicionados aqui depois

            if (viewBtn) {
                 const salaId = viewBtn.dataset.id;
                 // TODO: Criar a página /admin/salas/:salaId/details e a rota correspondente
                 window.location.href = `/admin/salas/${salaId}/details`;
                 // window.location.href = `/admin/salas/${salaId}/details`;
            }
            // ... (Lógica para editar/excluir sala, se os botões forem adicionados) ...
        });
    }


    // Inicia carregamento
    loadSchoolDetails();
});