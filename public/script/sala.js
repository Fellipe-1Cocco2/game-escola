document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE ELEMENTOS ---
    const nomeSalaHeader = document.getElementById('nome-sala-header');
    const nomeCriadorHeader = document.getElementById('nome-criador-header');
    const codigoSalaDisplay = document.getElementById('codigo-sala-display');
    const btnCopiarCodigo = document.getElementById('btn-copiar-codigo');
    const listaTarefas = document.getElementById('lista-tarefas');
    const listaAlunos = document.getElementById('lista-alunos');
    const listaEditores = document.getElementById('lista-editores');
    
    const btnAbrirModalTarefa = document.getElementById('btn-abrir-modal-tarefa');
    const btnAbrirModalAluno = document.getElementById('btn-abrir-modal-aluno');
    
    const modalNovaTarefa = document.getElementById('modal-nova-tarefa');
    const formNovaTarefa = document.getElementById('form-nova-tarefa');
    const modalNovoAluno = document.getElementById('modal-novo-aluno');
    const formNovoAluno = document.getElementById('form-novo-aluno');
    const modalEditarAluno = document.getElementById('modal-editar-aluno');
    const formEditarAluno = document.getElementById('form-editar-aluno');
    const modalExcluirAluno = document.getElementById('modal-excluir-aluno');
    const btnConfirmarExclusaoAluno = document.getElementById('btn-confirmar-exclusao-aluno');
    const formConvidarEditor = document.getElementById('form-convidar-editor');
    const containerConvite = document.getElementById('container-convite');
    
    const btnAbrirModalExcluirSala = document.getElementById('btn-abrir-modal-excluir-sala');
    const modalExcluirSala = document.getElementById('modal-excluir-sala');
    const btnConfirmarExclusaoSala = document.getElementById('btn-confirmar-exclusao-sala');
    
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    let salaAtual = null;
    let professorLogado = null;
    let alunoParaExcluirId = null;
    const salaId = window.location.pathname.split('/').pop();

    // --- LÓGICA DAS ABAS ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderAlunos = (alunos, podeEditar) => {
        listaAlunos.innerHTML = '';
        if ((alunos || []).length === 0) {
            listaAlunos.innerHTML = '<div class="lista-item">Nenhum aluno cadastrado.</div>';
            return;
        }
        alunos.forEach(aluno => {
            const item = document.createElement('div');
            item.className = 'lista-item';
            item.innerHTML = `<div class="lista-item-info"><span>${aluno.nome}</span><small>RA: ${aluno.RA}</small></div>`;
            if (podeEditar) {
                const acoesDiv = document.createElement('div');
                acoesDiv.className = 'lista-item-actions';
                acoesDiv.innerHTML = `
                    <button class="btn-action-icon edit" data-aluno-id="${aluno._id}" data-aluno-nome="${aluno.nome}" data-aluno-ra="${aluno.RA}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-action-icon delete" data-aluno-id="${aluno._id}">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                `;
                item.appendChild(acoesDiv);
            }
            listaAlunos.appendChild(item);
        });
    };
    
    const renderTarefas = (tarefas) => {
        listaTarefas.innerHTML = '';
        if (!tarefas || tarefas.length === 0) {
            listaTarefas.innerHTML = '<div class="lista-item">Nenhuma tarefa cadastrada.</div>';
            return;
        }
        tarefas.forEach(tarefa => {
            const item = document.createElement('a');
            item.className = 'lista-item-link';
            item.href = `/tarefa/${tarefa._id}/sala/${salaId}`;
            
            // Cria a estrutura interna do card da tarefa
            const dataInfo = tarefa.dataFechamento 
                ? `Fecha em: ${new Date(tarefa.dataFechamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às ${tarefa.horaFechamento || ''}`
                : 'Sem data de fechamento';

            item.innerHTML = `
                <div class="lista-item-info">
                    <span>${tarefa.titulo || 'Tarefa sem título'}</span>
                    <small>${dataInfo}</small>
                </div>
                <div class="lista-item-arrow">&rarr;</div>
            `;
            listaTarefas.appendChild(item);
        });
    };
    
    const renderEditores = (editores) => {
        listaEditores.innerHTML = '';
        if (!editores || editores.length === 0) {
            listaEditores.innerHTML = '<div class="lista-item">Nenhum editor convidado.</div>';
            return;
        }
        editores.forEach(editor => {
            const item = document.createElement('div');
            item.className = 'lista-item';
            item.textContent = editor.name || 'Editor sem nome';
            listaEditores.appendChild(item);
        });
    };

    // --- LÓGICA PRINCIPAL ---
    const fetchSalaData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        try {
            const [salaRes, meRes] = await Promise.all([
                fetch(`/api/game/salas/${salaId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!salaRes.ok || !meRes.ok) throw new Error('Falha ao buscar dados.');
            salaAtual = await salaRes.json();
            professorLogado = await meRes.json();
            const isCriador = salaAtual.criador && professorLogado && professorLogado._id === salaAtual.criador._id;
            const isEditor = isCriador || (salaAtual.editoresConvidados && salaAtual.editoresConvidados.some(e => e._id === professorLogado._id));
            nomeSalaHeader.textContent = salaAtual.num_serie;
            nomeCriadorHeader.textContent = `por ${salaAtual.criador ? salaAtual.criador.name : 'Desconhecido'}`;
            codigoSalaDisplay.textContent = salaAtual._id;
            renderTarefas(salaAtual.tarefas);
            renderAlunos(salaAtual.alunos, isEditor);
            renderEditores(salaAtual.editoresConvidados);
            if (isCriador) {
                containerConvite.style.display = 'grid';
                btnAbrirModalExcluirSala.style.display = 'flex';
            }
            if (isEditor) {
                btnAbrirModalTarefa.style.display = 'block';
                btnAbrirModalAluno.style.display = 'block';
            }
        } catch (error) {
            console.error("Erro ao carregar dados da sala:", error);
            showToast('Não foi possível carregar os dados da sala.', 'error');
        }
    };

    // --- EVENT LISTENERS ---
    btnAbrirModalTarefa.addEventListener('click', () => modalNovaTarefa.style.display = 'flex');
    btnAbrirModalAluno.addEventListener('click', () => modalNovoAluno.style.display = 'flex');
    btnAbrirModalExcluirSala.addEventListener('click', () => modalExcluirSala.style.display = 'flex');
    document.querySelectorAll('.btn-fechar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    formNovaTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo-tarefa').value.trim();
        const dataFechamento = document.getElementById('data-fechamento-tarefa').value;
        const horaFechamento = document.getElementById('hora-fechamento-tarefa').value;
        if (!titulo) {
            showToast('O título da tarefa é obrigatório.', 'error');
            return;
        }
        await sendRequest(`/api/game/salas/${salaId}/tarefas`, 'POST', { titulo, dataFechamento, horaFechamento }, 'Tarefa adicionada com sucesso!');
        formNovaTarefa.reset();
        modalNovaTarefa.style.display = 'none';
    });
    
    formNovoAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-aluno-form').value.trim();
        const RA = document.getElementById('ra-aluno-form').value.trim();
        if (!nome || !RA) return;
        await sendRequest(`/api/game/salas/${salaId}/alunos`, 'POST', { nome, RA }, 'Aluno cadastrado com sucesso!');
        formNovoAluno.reset();
        modalNovoAluno.style.display = 'none';
    });

    listaAlunos.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.edit');
        const btnExcluir = e.target.closest('.delete');
        if (btnEditar) {
            document.getElementById('id-aluno-editar').value = btnEditar.dataset.alunoId;
            document.getElementById('nome-aluno-editar').value = btnEditar.dataset.alunoNome;
            document.getElementById('ra-aluno-editar').value = btnEditar.dataset.alunoRa;
            modalEditarAluno.style.display = 'flex';
        }
        if (btnExcluir) {
            alunoParaExcluirId = btnExcluir.dataset.alunoId;
            modalExcluirAluno.style.display = 'flex';
        }
    });

    formEditarAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alunoId = document.getElementById('id-aluno-editar').value;
        const nome = document.getElementById('nome-aluno-editar').value.trim();
        const RA = document.getElementById('ra-aluno-editar').value.trim();
        if (!nome || !RA) return;
        await sendRequest(`/api/game/salas/${salaId}/alunos/${alunoId}`, 'PUT', { nome, RA }, 'Aluno atualizado com sucesso!');
        modalEditarAluno.style.display = 'none';
    });

    btnConfirmarExclusaoAluno.addEventListener('click', async () => {
        if (!alunoParaExcluirId) return;
        await sendRequest(`/api/game/salas/${salaId}/alunos/${alunoParaExcluirId}`, 'DELETE', null, 'Aluno excluído com sucesso!');
        modalExcluirAluno.style.display = 'none';
    });

    btnConfirmarExclusaoSala.addEventListener('click', async () => {
        await sendRequest(`/api/game/salas/${salaId}`, 'DELETE', null, 'Sala excluída com sucesso!', true);
    });
    
    formConvidarEditor.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailConvidado = document.getElementById('email-convidado').value.trim();
        if (!emailConvidado) return;
        await sendRequest(`/api/game/salas/${salaId}/convidar`, 'POST', { emailConvidado }, 'Convite enviado com sucesso!');
        formConvidarEditor.reset();
    });

    btnCopiarCodigo.addEventListener('click', () => {
        if (salaAtual && salaAtual._id) {
            navigator.clipboard.writeText(salaAtual._id).then(() => {
                showToast('Código copiado!', 'success');
            }).catch(err => {
                 showToast('Falha ao copiar.', 'error');
            });
        }
    });

    // --- FUNÇÃO AUXILIAR E INICIALIZAÇÃO ---
    const sendRequest = async (url, method, body, successMsg, redirectOnSuccess = false) => {
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
            if (redirectOnSuccess) {
                setTimeout(() => window.location.href = '/dashboard', 1500);
            } else {
                fetchSalaData();
            }
        } catch (error) {
            showToast(error.message, 'error');
            console.error('Erro na requisição:', error);
        }
    };

    const showToast = (message, type = 'error') => {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification show';
        if(type === 'success') toastNotification.classList.add('success');
        if(type === 'error') toastNotification.classList.add('error');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    };
    
    if (nomeSalaHeader && listaAlunos && modalNovaTarefa) {
        fetchSalaData();
    } else {
        console.error("Erro crítico: Elementos essenciais não encontrados. Verifique os IDs no HTML.");
    }
});

