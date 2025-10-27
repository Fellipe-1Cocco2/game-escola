document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores Globais ---
    const adminNameEl = document.getElementById('admin-name');
    const btnLogout = document.getElementById('btn-logout');
    const schoolsTableBody = document.getElementById('schools-table-body');
    const adminsTableBody = document.getElementById('admins-table-body');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;
    let adminToken = localStorage.getItem('admin_token'); // Pega o token do admin

    // --- Seletores de Botões e Modais ---
    const btnAddSchool = document.getElementById('btn-add-school');
    const modalAddSchool = document.getElementById('modal-add-school');
    const formAddSchool = document.getElementById('form-add-school');
    const inputSchoolName = document.getElementById('school-name');

    const btnAddAdmin = document.getElementById('btn-add-admin');
    const modalAddAdmin = document.getElementById('modal-add-admin');
    const formAddAdmin = document.getElementById('form-add-admin');
    const inputAdminName = document.getElementById('admin-new-name');
    const inputAdminEmail = document.getElementById('admin-new-email');
    const inputAdminPassword = document.getElementById('admin-new-password');


    // --- Verificação Inicial ---
    if (!adminToken) {
        // Se não houver token de admin, redireciona para a página de login admin
        window.location.href = '/admin/login';
        return; // Interrompe a execução do script
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

    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        // Limpa formulários ao fechar (opcional, mas útil)
        const form = modal.querySelector('form');
        if (form) form.reset();
    };

    // Adiciona listeners para fechar modais
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

    // --- Requisição Genérica ---
    const sendAdminRequest = async (url, method, body = null, successMsg = null, ignoreResponseData = false) => {
        try {
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : null
            };
            const response = await fetch(url, options);

            // Se o token expirar ou for inválido, o backend retornará 401
            if (response.status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
                localStorage.removeItem('admin_token');
                setTimeout(() => window.location.href = '/admin/login', 1500);
                throw new Error('Não autorizado'); // Interrompe a execução
            }

            const data = await response.json();

            if (!response.ok) {
                 // Usa a mensagem de erro do servidor, se disponível
                throw new Error(data.message || `Erro ${response.status} ao ${method} ${url}`);
            }
            
            if (successMsg) {
                showToast(successMsg, 'success');
            }
            
            return ignoreResponseData ? true : data; // Retorna true ou os dados

        } catch (error) {
            // Não redireciona automaticamente em caso de outros erros, apenas mostra
            if (error.message !== 'Não autorizado') {
                console.error(`Erro na requisição admin para ${url}:`, error);
                showToast(error.message || 'Ocorreu um erro na operação.', 'error');
            }
            return null; // Indica que houve erro
        }
    };


    // --- Funções de Carregamento de Dados ---
    const loadSchools = async () => {
        const schools = await sendAdminRequest('/api/admin/schools', 'GET');
        schoolsTableBody.innerHTML = '';
        if (schools && schools.length > 0) {
            schools.forEach(school => {
                const row = schoolsTableBody.insertRow();
                // --- ALTERAÇÃO: Troca "Editar" por "Ver Detalhes" ---
                row.innerHTML = `
                    <td>${school.name}</td>
                    <td>
                        <button class="btn-view-details" data-id="${school._id}">
                             <i data-feather="eye"></i> Ver Detalhes
                        </button>
                        <button class="btn-delete" data-id="${school._id}" data-type="school">
                            <i data-feather="trash-2"></i> Excluir
                        </button>
                    </td>
                `;
                // --- FIM DA ALTERAÇÃO ---
            });
            feather.replace();
        } else if (schools) {
            schoolsTableBody.innerHTML = '<tr><td colspan="2" class="no-data-text">Nenhuma escola cadastrada.</td></tr>';
        }
    };

    const loadAdmins = async () => {
         const admins = await sendAdminRequest('/api/admin/admins', 'GET');
         adminsTableBody.innerHTML = '';
         if (admins && admins.length > 0) {
             admins.forEach(admin => {
                 const row = adminsTableBody.insertRow();
                 row.innerHTML = `
                     <td>${admin.name}</td>
                     <td>${admin.email}</td>
                     <td>
                         <button class="btn-edit-admin" data-id="${admin._id}" data-name="${admin.name}" data-email="${admin.email}">
                              <i data-feather="edit-2"></i> Editar
                         </button>
                         <button class="btn-delete-admin" data-id="${admin._id}" data-type="admin">
                              <i data-feather="trash-2"></i> Excluir
                         </button>
                     </td>
                 `;
             });
             feather.replace();
         } else if (admins) {
             adminsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Nenhum outro administrador cadastrado.</td></tr>';
         }
     };

    // --- Handlers de Ações ---
    const handleAddSchool = async (event) => {
        event.preventDefault();
        const name = inputSchoolName.value.trim();
        if (!name) {
            showToast('Nome da escola não pode ser vazio.', 'error');
            return;
        }
        const result = await sendAdminRequest('/api/admin/schools', 'POST', { name }, 'Escola adicionada com sucesso!');
        if (result) {
            closeModal('modal-add-school');
            loadSchools(); // Recarrega a lista
        }
    };
    
    const handleAddAdmin = async (event) => {
         event.preventDefault();
         const name = inputAdminName.value.trim();
         const email = inputAdminEmail.value.trim();
         const password = inputAdminPassword.value.trim();

         if (!name || !email || !password) {
             showToast('Todos os campos são obrigatórios.', 'error');
             return;
         }
         if (password.length < 6) {
             showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
             return;
         }

         const result = await sendAdminRequest('/api/admin/admins', 'POST', { name, email, password }, 'Administrador adicionado com sucesso!');
         if (result) {
             closeModal('modal-add-admin');
             loadAdmins();
         }
     };


    // --- Logout ---
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    };

    


    // --- Inicialização ---
    const initializeDashboard = async () => {
         // Tenta buscar os dados do admin logado (exemplo, não implementado no backend ainda)
         // const adminData = await sendAdminRequest('/api/auth/admin/me', 'GET');
         // if (adminData && adminNameEl) {
         //     adminNameEl.textContent = adminData.name;
         // } else if(adminNameEl) {
         //      adminNameEl.textContent = 'Admin'; // Fallback
         // }
         if (schoolsTableBody) {
            schoolsTableBody.addEventListener('click', async (e) => {
                const viewButton = e.target.closest('.btn-view-details'); // <<< MUDA PARA btn-view-details
                const deleteButton = e.target.closest('.btn-delete');

                if (viewButton) { // <<< MUDA PARA viewButton
                    const schoolId = viewButton.dataset.id; // <<< MUDA PARA viewButton
                    // --- ALTERAÇÃO: Navega para a página de detalhes ---
                    window.location.href = `/admin/schools/${schoolId}/details`;
                    // --- FIM DA ALTERAÇÃO ---
                }

                if (deleteButton) {
                    const schoolId = deleteButton.dataset.id;
                     if (confirm('Tem certeza que deseja excluir esta escola? Professores vinculados impedirão a exclusão.')) {
                         const result = await sendAdminRequest(`/api/admin/schools/${schoolId}`, 'DELETE', null, 'Escola excluída!', true);
                         if (result) loadSchools();
                     }
                }
            });
        }

        if(adminNameEl) adminNameEl.textContent = 'Admin'; // Placeholder

        // Carrega as listas iniciais
        loadSchools();
        loadAdmins();

        // Adiciona listeners aos botões principais
        if (btnLogout) btnLogout.addEventListener('click', handleLogout);
        if (btnAddSchool) btnAddSchool.addEventListener('click', () => openModal('modal-add-school'));
        if (formAddSchool) formAddSchool.addEventListener('submit', handleAddSchool);
        
        if (btnAddAdmin) btnAddAdmin.addEventListener('click', () => openModal('modal-add-admin'));
        if (formAddAdmin) formAddAdmin.addEventListener('submit', handleAddAdmin);


        // Adicionar listeners para botões de editar/excluir (usando delegação de eventos)
        // Exemplo para escolas (adaptar para admins depois)
        if (schoolsTableBody) {
            schoolsTableBody.addEventListener('click', async (e) => {
                const editButton = e.target.closest('.btn-edit');
                const deleteButton = e.target.closest('.btn-delete');

                if (editButton) {
                    const schoolId = editButton.dataset.id;
                    const currentName = editButton.dataset.name;
                    const newName = prompt(`Editar nome da escola (${currentName}):`, currentName);
                    if (newName && newName.trim() !== '' && newName !== currentName) {
                        const result = await sendAdminRequest(`/api/admin/schools/${schoolId}`, 'PUT', { name: newName.trim() }, 'Escola atualizada!');
                        if (result) loadSchools();
                    }
                }

                if (deleteButton) {
                    const schoolId = deleteButton.dataset.id;
                     if (confirm('Tem certeza que deseja excluir esta escola? Professores vinculados impedirão a exclusão.')) {
                         const result = await sendAdminRequest(`/api/admin/schools/${schoolId}`, 'DELETE', null, 'Escola excluída!', true); // ignoreResponseData = true
                         if (result) loadSchools();
                     }
                }
            });
        }
        
         // Adicionar listeners para botões de editar/excluir ADMINS
         if (adminsTableBody) {
             adminsTableBody.addEventListener('click', async (e) => {
                 const editBtn = e.target.closest('.btn-edit-admin');
                 const deleteBtn = e.target.closest('.btn-delete-admin');

                 if (editBtn) {
                     // Lógica de edição de admin (nome/email) - Senha requer fluxo separado
                     alert('Edição de admin ainda não implementada.');
                     // const adminId = editBtn.dataset.id;
                     // Abrir modal de edição, etc.
                 }

                 if (deleteBtn) {
                     // Lógica de exclusão de admin - CUIDADO: Não excluir o próprio ou o último admin
                      alert('Exclusão de admin ainda não implementada.');
                     // const adminId = deleteBtn.dataset.id;
                     // if(confirm('...')) { await sendAdminRequest(...) }
                 }
             });
         }

    };

    initializeDashboard();
});
