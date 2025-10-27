document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores ---
    const schoolNameHeader = document.getElementById('school-name-header');
    const professorsTableBody = document.getElementById('professors-table-body');
    const salasTableBody = document.getElementById('salas-table-body');
    const btnLogout = document.getElementById('btn-logout');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;
    const adminToken = localStorage.getItem('admin_token');
    const schoolId = window.location.pathname.split('/')[3]; // Pega o ID da URL /admin/schools/{ID}/details

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

    // --- Funções Auxiliares (Reutilizadas) ---
     const showToast = (message, type = 'success') => {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    };

    const sendAdminRequest = async (url, method, body = null) => {
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

            if (response.status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
                localStorage.removeItem('admin_token');
                setTimeout(() => window.location.href = '/admin/login', 1500);
                throw new Error('Não autorizado');
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

    // --- Funções de Renderização ---
    const renderProfessors = (professors) => {
        professorsTableBody.innerHTML = '';
        if (!professors || professors.length === 0) {
            professorsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Nenhum professor encontrado para esta escola.</td></tr>';
            return;
        }
        professors.forEach(prof => {
            const row = professorsTableBody.insertRow();
            row.innerHTML = `
                <td>${prof.name}</td>
                <td>${prof.email}</td>
                <td>
                    <button class="btn-edit-professor" data-id="${prof._id}"><i data-feather="edit-2"></i> Editar</button>
                    <button class="btn-delete-professor" data-id="${prof._id}"><i data-feather="user-x"></i> Desvincular/Excluir</button>
                </td>
            `;
        });
        feather.replace();
    };

    const renderSalas = (salas) => {
         salasTableBody.innerHTML = '';
         if (!salas || salas.length === 0) {
             salasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Nenhuma sala encontrada para esta escola.</td></tr>';
             return;
         }
         salas.forEach(sala => {
             const row = salasTableBody.insertRow();
             row.innerHTML = `
                 <td>${sala.num_serie}</td>
                 <td>${sala.criadorNome}</td>
                 <td>${sala.numAlunos}</td>
                 <td>${sala.numTarefas}</td>
                 <td>
                     <button class="btn-edit-sala" data-id="${sala._id}" data-name="${sala.num_serie}"><i data-feather="edit"></i> Editar Nome</button>
                     <button class="btn-view-sala-details" data-id="${sala._id}"><i data-feather="eye"></i> Ver Tarefas</button>
                     <button class="btn-delete-sala" data-id="${sala._id}"><i data-feather="trash-2"></i> Excluir Sala</button>
                 </td>
             `;
         });
         feather.replace();
     };


    // --- Carregamento Inicial ---
    const loadSchoolDetails = async () => {
        const data = await sendAdminRequest(`/api/admin/schools/${schoolId}/details`, 'GET');
        if (data) {
            if (schoolNameHeader) schoolNameHeader.textContent = data.school.name;
            renderProfessors(data.professors);
            renderSalas(data.salas);
        } else {
             // Limpa tabelas em caso de erro
             if(schoolNameHeader) schoolNameHeader.textContent = "Erro ao carregar";
             if(professorsTableBody) professorsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Erro ao carregar professores.</td></tr>';
             if(salasTableBody) salasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Erro ao carregar salas.</td></tr>';
        }
    };

     // --- Logout ---
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    };
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // --- Listeners para Ações nas Tabelas (Delegação) ---
    // Edição/Exclusão de Professores (Ainda não implementado no backend)
    if (professorsTableBody) {
        professorsTableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit-professor');
            const deleteBtn = e.target.closest('.btn-delete-professor');
            if (editBtn) alert(`Editar professor ${editBtn.dataset.id} - não implementado.`);
            if (deleteBtn) alert(`Excluir professor ${deleteBtn.dataset.id} - não implementado.`);
        });
    }

    // Edição/Exclusão/Visualização de Salas
    if (salasTableBody) {
        salasTableBody.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit-sala');
            const viewBtn = e.target.closest('.btn-view-sala-details');
            const deleteBtn = e.target.closest('.btn-delete-sala');

            if (editBtn) {
                const salaId = editBtn.dataset.id;
                const currentName = editBtn.dataset.name;
                const newName = prompt(`Editar nome da sala (${currentName}):`, currentName);
                if (newName && newName.trim() !== '' && newName !== currentName) {
                    // TODO: Criar a rota PUT /api/admin/salas/:salaId no backend
                    alert(`Chamaria API para renomear sala ${salaId} para ${newName.trim()} - não implementado.`);
                    // const result = await sendAdminRequest(`/api/admin/salas/${salaId}`, 'PUT', { num_serie: newName.trim() });
                    // if (result) loadSchoolDetails(); // Recarrega
                }
            }
            if (viewBtn) {
                 const salaId = viewBtn.dataset.id;
                 // TODO: Criar a página /admin/salas/:salaId/details e a rota correspondente
                 alert(`Navegaria para a página de detalhes da sala ${salaId} - não implementado.`);
                 // window.location.href = `/admin/salas/${salaId}/details`;
            }
             if (deleteBtn) {
                 const salaId = deleteBtn.dataset.id;
                 if (confirm('Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita.')) {
                     // TODO: Usar a rota DELETE /api/game/salas/:salaId (precisa verificar se o admin pode usar)
                     // ou criar DELETE /api/admin/salas/:salaId
                      alert(`Chamaria API para excluir sala ${salaId} - não implementado.`);
                     // const result = await sendAdminRequest(`/api/admin/salas/${salaId}`, 'DELETE');
                     // if (result) loadSchoolDetails(); // Recarrega
                 }
            }
        });
    }


    // Inicia carregamento
    loadSchoolDetails();
});
