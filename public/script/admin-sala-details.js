document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores Globais ---
    const salaNameHeader = document.getElementById('sala-name-header');
    const salaCreatorName = document.getElementById('sala-creator-name');
    const salaShortcode = document.getElementById('sala-shortcode');
    const collaboratorsList = document.getElementById('collaborators-list');
    const formAddCollaborator = document.getElementById('form-add-collaborator');
    const collaboratorEmailInput = document.getElementById('collaborator-email');
    const alunosTableBody = document.getElementById('alunos-table-body');
    const tarefasTableBody = document.getElementById('tarefas-table-body');
    const btnLogout = document.getElementById('btn-logout');
    const btnEditSalaName = document.getElementById('btn-edit-sala-name');
    const breadcrumbSchoolLink = document.getElementById('breadcrumb-school-link');
    const toastNotification = document.getElementById('toast-notification');
    const salaSchoolName = document.getElementById('sala-school-name');

    // --- NOVOS Seletores para Modais de Aluno ---
    const modalEditAluno = document.getElementById('modal-edit-aluno-admin');
    const formEditAluno = document.getElementById('form-edit-aluno-admin');
    const editAlunoIdInput = document.getElementById('edit-aluno-id-admin');
    const editAlunoNameInput = document.getElementById('edit-aluno-name-admin');
    const editAlunoRaInput = document.getElementById('edit-aluno-ra-admin');

    const modalMoveAluno = document.getElementById('modal-move-aluno-admin');
    const formMoveAluno = document.getElementById('form-move-aluno-admin');
    const moveAlunoIdInput = document.getElementById('move-aluno-id-admin');
    const moveAlunoNameEl = document.getElementById('move-aluno-name-admin');
    const moveAlunoNewSalaSelect = document.getElementById('move-aluno-new-sala-select');

    const modalConfirmUnlink = document.getElementById('modal-confirm-unlink-aluno');
    const unlinkAlunoNameEl = document.getElementById('unlink-aluno-name-admin');
    const btnConfirmAlunoUnlinking = document.getElementById('btn-confirm-aluno-unlinking');
    let alunoToUnlinkId = null; // Guarda ID para desvincular
    
    const modalViewTarefa = document.getElementById('modal-view-tarefa-admin');
    const viewTarefaTitle = document.getElementById('view-tarefa-title');
    const viewTarefaTituloSpan = document.getElementById('view-tarefa-titulo-span');
    const viewTarefaFechamentoSpan = document.getElementById('view-tarefa-fechamento-span');
    const viewTarefaPerguntasList = document.getElementById('view-tarefa-perguntas-list');

    const modalEditTarefa = document.getElementById('modal-edit-tarefa-admin');
    const formEditTarefa = document.getElementById('form-edit-tarefa-admin');
    const editTarefaIdInput = document.getElementById('edit-tarefa-id-admin');
    const editTarefaTituloInput = document.getElementById('edit-tarefa-titulo-admin');
    const editTarefaDataInput = document.getElementById('edit-tarefa-data-admin');
    const editTarefaHoraInput = document.getElementById('edit-tarefa-hora-admin');

    const modalConfirmDeleteTarefa = document.getElementById('modal-confirm-delete-tarefa');
    const deleteTarefaNameEl = document.getElementById('delete-tarefa-name-admin');
    const btnConfirmTarefaDeletion = document.getElementById('btn-confirm-tarefa-deletion');
    let tarefaToDeleteId = null;

    const modalConfirmRemovePergunta = document.getElementById('modal-confirm-remove-pergunta');
    const btnConfirmPerguntaRemoval = document.getElementById('btn-confirm-pergunta-removal');
    let perguntaToRemove = { tarefaId: null, perguntaId: null };

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    let toastTimeout;
    const adminToken = localStorage.getItem('admin_token');
    const salaId = window.location.pathname.split('/')[3]; // Pega o ID da URL /admin/salas/{ID}/details

    let currentSalaData = null; // Para guardar dados da sala
    let schoolIdOfCurrentSala = null;

    // --- Verificação Inicial ---
    if (!adminToken) {
        window.location.href = '/admin/login';
        return;
    }
    if (!salaId) {
        alert('ID da sala não encontrado na URL.');
        window.location.href = '/admin/dashboard'; // Volta para o dashboard principal
        return;
    }
    // Verifica elementos essenciais
    if (/*!salaNameHeader ||*/ !alunosTableBody || !tarefasTableBody || !collaboratorsList || !modalEditAluno || !modalMoveAluno || !modalConfirmUnlink || !modalViewTarefa || !modalEditTarefa || !modalConfirmDeleteTarefa || !modalConfirmRemovePergunta) { // Adiciona verificação
            console.error("Erro Crítico: Elementos essenciais ou modais (aluno/tarefa) não encontrados.");
            return;
        }

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');

            // Remove 'active' de todos
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Adiciona 'active' ao link clicado e ao painel correspondente
            link.classList.add('active');
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) {
                targetPane.classList.add('active');
            } else {
                console.error(`Painel da aba #${tabId} não encontrado!`);
            }
        });
    });    

    document.querySelectorAll('.btn-close-modal').forEach(button => {
        button.addEventListener('click', () => {
            // Verifica se o dataset.modalId existe antes de usar
            if (button.dataset.modalId) {
                closeModal(button.dataset.modalId);
            } else {
                // Fallback: Tenta encontrar o modal pai mais próximo se data-modal-id faltar
                const modal = button.closest('.modal-overlay');
                if (modal) {
                    closeModal(modal.id);
                } else {
                    console.warn('Não foi possível encontrar o modal para fechar o botão:', button);
                }
            }
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { // Só fecha se clicar no fundo
                closeModal(overlay.id);
            }
        });
    });

    const openViewTarefaModal = async (tarefaId, titulo) => {
        viewTarefaTitle.textContent = `Detalhes: ${titulo}`;
        viewTarefaTituloSpan.textContent = titulo;
        viewTarefaFechamentoSpan.textContent = 'Carregando...';
        viewTarefaPerguntasList.innerHTML = '<p class="loading-text">Carregando perguntas...</p>';
        openModal('modal-view-tarefa-admin');

        // Busca os detalhes completos da tarefa (incluindo perguntas populadas)
        const tarefaDetails = await sendAdminRequest(`/api/admin/salas/${salaId}/tarefas/${tarefaId}`, 'GET');
        if (tarefaDetails) {
            const dataFech = tarefaDetails.dataFechamento ? new Date(tarefaDetails.dataFechamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
            const horaFech = tarefaDetails.horaFechamento || 'N/A';
            viewTarefaFechamentoSpan.textContent = `${dataFech} às ${horaFech}`;

            // Renderiza a lista de perguntas
            viewTarefaPerguntasList.innerHTML = '';
            if (tarefaDetails.perguntas && tarefaDetails.perguntas.length > 0) {
                tarefaDetails.perguntas.forEach(itemPergunta => {
                    // Verifica se a pergunta está populada corretamente
                    const pergunta = itemPergunta.pergunta;
                    if (pergunta && pergunta._id && pergunta.texto) {
                        const div = document.createElement('div');
                        div.className = 'pergunta-item-modal';
                        div.innerHTML = `
                            <span>${pergunta.texto} (${pergunta.tipo === 'vf' ? 'V/F' : 'Múltipla'})</span>
                            <button class="btn-delete-inline btn-remove-pergunta-tarefa" data-tarefa-id="${tarefaId}" data-pergunta-id="${pergunta._id}" title="Remover da Tarefa">
                                <i data-feather="trash-2"></i>
                            </button>
                        `;
                        viewTarefaPerguntasList.appendChild(div);
                    } else {
                         console.warn("Pergunta mal formada ou não populada:", itemPergunta);
                         const div = document.createElement('div');
                         div.className = 'pergunta-item-modal text-red-500';
                         div.textContent = 'Erro ao carregar pergunta.';
                         viewTarefaPerguntasList.appendChild(div);
                    }
                });
                feather.replace(); // Renderiza ícones de lixo
            } else {
                viewTarefaPerguntasList.innerHTML = '<p>Nenhuma pergunta nesta tarefa.</p>';
            }
        } else {
            viewTarefaFechamentoSpan.textContent = 'Erro';
            viewTarefaPerguntasList.innerHTML = '<p class="text-red-500">Erro ao carregar detalhes da tarefa.</p>';
        }
    };

    // Abre Modal Editar Tarefa
    const openEditTarefaModal = (tarefaId, titulo, data, hora) => {
        editTarefaIdInput.value = tarefaId;
        editTarefaTituloInput.value = titulo;
        // Formata a data para YYYY-MM-DD
        editTarefaDataInput.value = data ? new Date(data).toISOString().split('T')[0] : '';
        editTarefaHoraInput.value = hora || '';
        openModal('modal-edit-tarefa-admin');
    };

    // Abre Modal Excluir Tarefa
    const openDeleteTarefaModal = (tarefaId, titulo) => {
        tarefaToDeleteId = tarefaId;
        deleteTarefaNameEl.textContent = titulo;
        openModal('modal-confirm-delete-tarefa');
    };

     // Abre Modal Remover Pergunta da Tarefa
    const openRemovePerguntaModal = (tarefaId, perguntaId) => {
        perguntaToRemove = { tarefaId, perguntaId }; // Guarda ambos os IDs
        openModal('modal-confirm-remove-pergunta');
    };

    // Submissão Editar Tarefa
    formEditTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tarefaId = editTarefaIdInput.value;
        const titulo = editTarefaTituloInput.value.trim();
        const data = editTarefaDataInput.value;
        const hora = editTarefaHoraInput.value;

        if (!titulo || !data || !hora) {
            showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }
        const result = await sendAdminRequest(`/api/admin/salas/${salaId}/tarefas/${tarefaId}`, 'PUT', {
            titulo: titulo,
            dataFechamento: data,
            horaFechamento: hora
        });
        if (result) {
            showToast('Tarefa atualizada!', 'success');
            closeModal('modal-edit-tarefa-admin');
            loadSalaDetails(); // Recarrega
        }
    });

    // Confirmação Excluir Tarefa
    btnConfirmTarefaDeletion.addEventListener('click', async () => {
        if (!tarefaToDeleteId) return;
        const result = await sendAdminRequest(`/api/admin/salas/${salaId}/tarefas/${tarefaToDeleteId}`, 'DELETE', null, true); // ignoreResponseData
        if (result) {
            showToast('Tarefa excluída com sucesso.', 'success');
            closeModal('modal-confirm-delete-tarefa');
            loadSalaDetails(); // Recarrega
        }
    });

     // Confirmação Remover Pergunta da Tarefa
     btnConfirmPerguntaRemoval.addEventListener('click', async () => {
        const { tarefaId, perguntaId } = perguntaToRemove;
        if (!tarefaId || !perguntaId) return;

        const result = await sendAdminRequest(`/api/admin/salas/${salaId}/tarefas/${tarefaId}/perguntas/${perguntaId}`, 'DELETE', null, true); // ignoreResponseData
        if (result) {
            showToast('Pergunta removida da tarefa.', 'success');
            closeModal('modal-confirm-remove-pergunta');
            // Recarrega os detalhes da tarefa DENTRO do modal de visualização, se estiver aberto
            const activeViewModal = document.querySelector('#modal-view-tarefa-admin:not(.hidden)');
            if (activeViewModal) {
                 const currentTitle = viewTarefaTituloSpan.textContent;
                 // Re-chama a função para abrir/atualizar o modal de visualização
                 openViewTarefaModal(tarefaId, currentTitle);
            }
            loadSalaDetails(); // Recarrega também a lista principal
        }
     });

    // --- Funções Auxiliares (Reutilizadas/Adaptadas de admin-school-details.js) ---
     const showToast = (message, type = 'success') => {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    };

    const sendAdminRequest = async (url, method, body = null, ignoreResponseData = false) => {
        try {
            const options = {
                method,
                headers: {'Authorization': `Bearer ${adminToken}`},
                body: body ? JSON.stringify(body) : null
            };
            if (body) options.headers['Content-Type'] = 'application/json';

            const response = await fetch(url, options);
            if (response.status === 401) throw new Error('Sessão expirada. Faça login novamente.');
            if (response.status === 204) return true; // Sucesso sem conteúdo (DELETE, PUT)
            if (response.ok && ignoreResponseData) return true; // Ignora corpo se solicitado

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Erro ${response.status}`);
            return data;
        } catch (error) {
            console.error(`Erro na requisição admin para ${url}:`, error);
            if (error.message.includes('Sessão expirada')) {
                 localStorage.removeItem('admin_token');
                 setTimeout(() => window.location.href = '/admin/login', 1500);
            }
            showToast(error.message || 'Ocorreu um erro na operação.', 'error');
            return null;
        }
    };

    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    const closeModal = (modalId) => {
         const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Limpa variáveis de estado específicas
        if (modalId === 'modal-confirm-unlink-aluno') {
            alunoToUnlinkId = null;
        }
    };

    // --- Funções de Renderização Específicas ---
    const renderSalaDetails = (sala) => {
        currentSalaData = sala;
        // Tenta pegar o ID da escola diretamente do objeto sala se ele for populado, senão do criador
        schoolIdOfCurrentSala = sala.school?._id || sala.school || sala.criador?.school;

        salaNameHeader.textContent = sala.num_serie;
        salaCreatorName.textContent = sala.criador?.name || 'Desconhecido';
        salaShortcode.textContent = sala.codigoCurto || 'N/A';

        // Atualiza breadcrumb e nome da escola
        if (schoolIdOfCurrentSala && breadcrumbSchoolLink) {
             breadcrumbSchoolLink.href = `/admin/schools/${schoolIdOfCurrentSala}/details`;
             breadcrumbSchoolLink.textContent = `Escola`; // Mantém simples
             // Tenta buscar o nome da escola (opcional)
             fetchSchoolName(schoolIdOfCurrentSala); // Chama função separada
        } else if (breadcrumbSchoolLink) { /* ... */ }

        // Chama as funções que populam DENTRO das abas
        renderCollaborators(sala.editoresConvidados || []);
        renderAlunos(sala.alunos || []);
        renderTarefas(sala.tarefas || []);
    };

     // NOVA Função para buscar nome da escola (separada para não bloquear render inicial)
     const fetchSchoolName = async (idEscola) => {
         if (!idEscola || !salaSchoolName) return;
         try {
             // Reutiliza a API de detalhes da escola, mas só precisamos do nome
             const schoolData = await sendAdminRequest(`/api/admin/schools/${idEscola}/details`, 'GET');
             if (schoolData && schoolData.school) {
                 salaSchoolName.textContent = schoolData.school.name;
             } else {
                 salaSchoolName.textContent = 'Nome não encontrado';
             }
         } catch(e) {
             console.error("Erro ao buscar nome da escola:", e);
             salaSchoolName.textContent = 'Erro ao carregar';
         }
     };

    const renderCollaborators = (collaborators) => {
        collaboratorsList.innerHTML = '';
        if (collaborators.length === 0) {
            collaboratorsList.innerHTML = '<li>Nenhum colaborador convidado.</li>';
            return;
        }
        collaborators.forEach(collab => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${collab.name || 'Nome Desconhecido'} (${collab.email || 'Email Desconhecido'})
                <button class="btn-delete-inline btn-remove-collaborator" data-professor-id="${collab._id}" title="Remover Colaborador">
                    <i data-feather="x-circle"></i>
                </button>
            `;
            collaboratorsList.appendChild(li);
        });
        feather.replace();
    };


    const renderAlunos = (alunos) => {
        alunosTableBody.innerHTML = '';
        if (alunos.length === 0) {
            alunosTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Nenhum aluno nesta sala.</td></tr>';
            return;
        }
        alunos.forEach(aluno => {
            const row = alunosTableBody.insertRow();
            row.innerHTML = `
                <td>${aluno.nome}</td>
                <td>${aluno.RA}</td>
                <td>
                    <button class="btn-edit btn-edit-aluno" data-id="${aluno._id}" data-nome="${aluno.nome}" data-ra="${aluno.RA}">
                        <i data-feather="edit-2"></i> Editar
                    </button>
                    <button class="btn-secondary btn-move-aluno" data-id="${aluno._id}" data-nome="${aluno.nome}">
                        <i data-feather="move"></i> Mover
                    </button>
                    <button class="btn-delete btn-delete-aluno" data-id="${aluno._id}">
                        <i data-feather="user-x"></i> Desvincular
                    </button>
                </td>
            `;
            // TODO: Adicionar modal e lógica para Editar, Mover e Desvincular/Excluir Aluno
        });
        feather.replace();
    };

    const renderTarefas = (tarefas) => {
        tarefasTableBody.innerHTML = '';
        if (tarefas.length === 0) {
            tarefasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Nenhuma tarefa nesta sala.</td></tr>';
            return;
        }
        tarefas.forEach(tarefa => {
            const row = tarefasTableBody.insertRow();
            const dataFechamento = tarefa.dataFechamento
                ? new Date(tarefa.dataFechamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                : 'N/A';
            const numPerguntas = tarefa.perguntas ? tarefa.perguntas.length : 0;

            row.innerHTML = `
                <td>${tarefa.titulo}</td>
                <td>${numPerguntas}</td>
                <td>${dataFechamento}</td>
                <td>${tarefa.horaFechamento || 'N/A'}</td>
                <td>
                    <button class="btn-view-details btn-view-tarefa-details" data-id="${tarefa._id}" data-titulo="${tarefa.titulo}">
                        <i data-feather="eye"></i> Ver Detalhes
                    </button>
                    <button class="btn-edit btn-edit-tarefa"
                        data-id="${tarefa._id}"
                        data-titulo="${tarefa.titulo || ''}"
                        data-data="${tarefa.dataFechamento || ''}"
                        data-hora="${tarefa.horaFechamento || ''}">
                        <i data-feather="edit-2"></i> Editar
                    </button>
                    <button class="btn-delete btn-delete-tarefa" data-id="${tarefa._id}">
                        <i data-feather="trash-2"></i> Excluir
                    </button>
                </td>
            `;
             // TODO: Adicionar modal e lógica para Editar e Excluir Tarefa
        });
        feather.replace();
    };

    // --- Carregamento Inicial ---
    const loadSalaDetails = async () => {
        // Usa a rota GET /api/admin/salas/:salaId que busca todos os detalhes
        const data = await sendAdminRequest(`/api/admin/salas/${salaId}`, 'GET');
        if (data) {
            renderSalaDetails(data);
        } else {
             // Limpa campos em caso de erro
             if(salaNameHeader) salaNameHeader.textContent = "Erro ao carregar sala";
             if(alunosTableBody) alunosTableBody.innerHTML = '<tr><td colspan="3" class="no-data-text">Erro ao carregar alunos.</td></tr>';
             if(tarefasTableBody) tarefasTableBody.innerHTML = '<tr><td colspan="5" class="no-data-text">Erro ao carregar tarefas.</td></tr>';
             if(collaboratorsList) collaboratorsList.innerHTML = '<li>Erro ao carregar</li>';
        }
    };

     // --- Logout ---
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    };
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // --- Handlers de Ações ---

    // Editar Nome da Sala
    btnEditSalaName.addEventListener('click', async () => {
        if (!currentSalaData) return;
        const currentName = currentSalaData.num_serie;
        const newName = prompt(`Editar nome da sala (${currentName}):`, currentName);
        if (newName && newName.trim() !== '' && newName !== currentName) {
            const result = await sendAdminRequest(`/api/admin/salas/${salaId}`, 'PUT', { num_serie: newName.trim() });
            if (result) {
                showToast('Nome da sala atualizado!', 'success');
                loadSalaDetails(); // Recarrega
            }
        }
    });

    // Adicionar Colaborador
    formAddCollaborator.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = collaboratorEmailInput.value.trim();
        if (!email) {
            showToast('Digite o email do professor.', 'error');
            return;
        }
        const result = await sendAdminRequest(`/api/admin/salas/${salaId}/collaborators`, 'POST', { emailProfessor: email });
        if (result) {
            showToast('Colaborador adicionado!', 'success');
            collaboratorEmailInput.value = ''; // Limpa o input
            loadSalaDetails(); // Recarrega para mostrar na lista
        }
    });

    // Remover Colaborador (Delegação de evento)
     collaboratorsList.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.btn-remove-collaborator');
        if (removeBtn) {
            const professorId = removeBtn.dataset.professorId;
            if (confirm('Tem certeza que deseja remover este colaborador?')) {
                const result = await sendAdminRequest(`/api/admin/salas/${salaId}/collaborators/${professorId}`, 'DELETE', null, true); // ignoreResponseData = true
                if (result) {
                    showToast('Colaborador removido.', 'success');
                    loadSalaDetails(); // Recarrega
                }
            }
        }
     });

    // --- Delegação de Eventos para Alunos e Tarefas (Ações a implementar) ---

    if (alunosTableBody) {
        alunosTableBody.addEventListener('click', (e) => {
            console.log("[alunosTableBody Click] Elemento clicado:", e.target); // Log 1: O que foi clicado

            const editBtn = e.target.closest('.btn-edit-aluno');
            const moveBtn = e.target.closest('.btn-move-aluno');
            const unlinkBtn = e.target.closest('.btn-delete-aluno');

            console.log("[alunosTableBody Click] Botão Mover encontrado:", moveBtn); // Log 2: Encontrou o botão?

            if (editBtn) {
                console.log("[alunosTableBody Click] Ação: Editar");
                openEditAlunoModal(editBtn.dataset.id, editBtn.dataset.nome, editBtn.dataset.ra);
            } else if (moveBtn) {
                console.log("[alunosTableBody Click] Ação: Mover"); // Log 3: Entrou no IF correto?
                openMoveAlunoModal(moveBtn.dataset.id, moveBtn.dataset.nome);
            } else if (unlinkBtn) {
                console.log("[alunosTableBody Click] Ação: Desvincular");
                openUnlinkAlunoModal(unlinkBtn.dataset.id, unlinkBtn.dataset.nome);
            } else {
                console.log("[alunosTableBody Click] Nenhuma ação correspondente.");
            }
        });
    }

    const populateSalasSelect = async (selectElement, currentSalaId, schoolId) => {
        console.log("[populateSalasSelect] Iniciando. Escola:", schoolId, "Excluir Sala:", currentSalaId);
        selectElement.innerHTML = '<option value="">Carregando...</option>';
        if (!schoolId) {
            selectElement.innerHTML = '<option value="">Erro: Escola não identificada</option>';
            return;
        }
        try {
            // Busca detalhes da escola para pegar a lista de salas
            const schoolDetails = await sendAdminRequest(`/api/admin/schools/${schoolId}/details`, 'GET');
            if (!schoolDetails || !schoolDetails.salas) throw new Error();

            selectElement.innerHTML = '<option value="">-- Selecione a nova sala --</option>';
            schoolDetails.salas.forEach(sala => {
                // Não inclui a sala atual na lista de destino
                if (sala._id !== currentSalaId) {
                    const option = document.createElement('option');
                    option.value = sala._id;
                    option.textContent = `${sala.num_serie} (Criador: ${sala.criadorNome})`;
                    selectElement.appendChild(option);
                }
            });
            if (selectElement.options.length <= 1) { // Se só tem a opção padrão
                selectElement.innerHTML = '<option value="">Nenhuma outra sala nesta escola</option>';
            }
        } catch (error) {
            console.error("Erro ao carregar salas para mover aluno:", error);
            selectElement.innerHTML = '<option value="">Erro ao carregar salas</option>';
        }
    };

    // Abre modal Editar Aluno
    const openEditAlunoModal = (alunoId, nome, ra) => {
        editAlunoIdInput.value = alunoId;
        editAlunoNameInput.value = nome;
        editAlunoRaInput.value = ra;
        openModal('modal-edit-aluno-admin');
    };

    // Abre modal Mover Aluno
    const openMoveAlunoModal = (alunoId, nome) => {
        console.log("[openMoveAlunoModal] Iniciando para:", alunoId, nome); // Log 4: Função foi chamada?
        console.log("[openMoveAlunoModal] ID da Escola Atual:", schoolIdOfCurrentSala); // Log 5: ID da escola está disponível?
        moveAlunoIdInput.value = alunoId;
        moveAlunoNameEl.textContent = nome;
        // Popula o select com as outras salas da mesma escola
        populateSalasSelect(moveAlunoNewSalaSelect, salaId, schoolIdOfCurrentSala);
        openModal('modal-move-aluno-admin');
        console.log("[openMoveAlunoModal] Chamou openModal."); // Log 6: Chamou openModal?
    };

    // Abre modal Desvincular Aluno
    const openUnlinkAlunoModal = (alunoId, nome) => {
        alunoToUnlinkId = alunoId;
        unlinkAlunoNameEl.textContent = nome;
        openModal('modal-confirm-unlink-aluno');
    };

    // Submissão Editar Aluno
    formEditAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alunoId = editAlunoIdInput.value;
        const nome = editAlunoNameInput.value.trim();
        const ra = editAlunoRaInput.value.trim();
        if (!nome || !ra) {
            showToast('Nome e RA são obrigatórios.', 'error');
            return;
        }
        const result = await sendAdminRequest(`/api/admin/alunos/${alunoId}`, 'PUT', { nome, ra });
        if (result) {
            showToast('Aluno atualizado!', 'success');
            closeModal('modal-edit-aluno-admin');
            loadSalaDetails(); // Recarrega
        }
    });

    // Submissão Mover Aluno
    formMoveAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alunoId = moveAlunoIdInput.value;
        const novaSalaId = moveAlunoNewSalaSelect.value;
        if (!novaSalaId) {
            showToast('Selecione a sala de destino.', 'error');
            return;
        }
        const result = await sendAdminRequest(`/api/admin/alunos/${alunoId}/move`, 'PUT', { novaSalaId });
        if (result) {
            showToast(result.message || 'Aluno movido com sucesso!', 'success');
            closeModal('modal-move-aluno-admin');
            loadSalaDetails(); // Recarrega (o aluno sumirá desta lista)
        }
    });

    // Confirmação Desvincular Aluno
    btnConfirmAlunoUnlinking.addEventListener('click', async () => {
        if (!alunoToUnlinkId) return;
        // Usa a rota do gameController que apenas desvincula da sala atual
        const result = await sendAdminRequest(`/api/game/salas/${salaId}/alunos/${alunoToUnlinkId}`, 'DELETE', null, true); // ignoreResponseData
        // Alternativa: Usar a rota admin que exclui o aluno do sistema:
        // const result = await sendAdminRequest(`/api/admin/alunos/${alunoToUnlinkId}`, 'DELETE', null, true);
        if (result) {
            showToast('Aluno desvinculado da sala.', 'success');
            closeModal('modal-confirm-unlink-aluno');
            loadSalaDetails(); // Recarrega
        }
    });


    // --- Delegação de Eventos ---
    // Alunos
    if (alunosTableBody) {
        alunosTableBody.addEventListener('click', (e) => {
            // ****** ADICIONAR LOGS AQUI ******
            console.log("Clique detectado na tabela de alunos!");
            console.log("Elemento clicado (e.target):", e.target);

            const editBtn = e.target.closest('.btn-edit-aluno');
            const moveBtn = e.target.closest('.btn-move-aluno');
            // CORREÇÃO: A classe no HTML é btn-delete-aluno, não btn-unlink-aluno
            const unlinkBtn = e.target.closest('.btn-delete-aluno'); // <<< Corrigido aqui

            console.log("Resultado closest('.btn-edit-aluno'):", editBtn);
            console.log("Resultado closest('.btn-move-aluno'):", moveBtn);
            console.log("Resultado closest('.btn-delete-aluno'):", unlinkBtn); // <<< Corrigido aqui
            // ****** FIM DOS LOGS ******

            if (editBtn) {
                console.log("Botão EDITAR encontrado, abrindo modal..."); // Log de confirmação
                openEditAlunoModal(editBtn.dataset.id, editBtn.dataset.nome, editBtn.dataset.ra);
            } else if (moveBtn) {
                console.log("Botão MOVER encontrado, abrindo modal..."); // Log de confirmação
                openMoveAlunoModal(moveBtn.dataset.id, moveBtn.dataset.nome); // CORREÇÃO: Usar moveBtn.dataset.nome
            } else if (unlinkBtn) {
                console.log("Botão DESVINCULAR encontrado, abrindo modal..."); // Log de confirmação
                    // CORREÇÃO: Pegar nome do botão unlinkBtn
                openUnlinkAlunoModal(unlinkBtn.dataset.id, unlinkBtn.dataset.nome);
            } else {
                console.log("Nenhum botão de ação de aluno correspondente encontrado."); // Log caso nenhum botão seja achado
            }
        });
    }
    // Tarefas (existente, mas adiciona TODOs)
    if (tarefasTableBody) {
        tarefasTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.btn-view-tarefa-details');
            const editBtn = e.target.closest('.btn-edit-tarefa');
            const deleteBtn = e.target.closest('.btn-delete-tarefa');

            if (viewBtn) {
                 openViewTarefaModal(viewBtn.dataset.id, viewBtn.dataset.titulo);
            } else if (editBtn) {
                 openEditTarefaModal(
                    editBtn.dataset.id,
                    editBtn.dataset.titulo,
                    editBtn.dataset.data,
                    editBtn.dataset.hora
                 );
            } else if (deleteBtn) {
                 openDeleteTarefaModal(deleteBtn.dataset.id, deleteBtn.dataset.titulo);
            }
        });
    }

     // Listener para remover perguntas DENTRO do modal de visualização
     if (viewTarefaPerguntasList) {
         viewTarefaPerguntasList.addEventListener('click', (e) => {
             const removePerguntaBtn = e.target.closest('.btn-remove-pergunta-tarefa');
             if (removePerguntaBtn) {
                 const tarefaId = removePerguntaBtn.dataset.tarefaId;
                 const perguntaId = removePerguntaBtn.dataset.perguntaId;
                 openRemovePerguntaModal(tarefaId, perguntaId);
             }
         });
     }

    // Inicia carregamento
    loadSalaDetails();
});