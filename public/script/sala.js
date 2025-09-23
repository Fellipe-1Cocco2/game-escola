document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da página
    const nomeSalaEl = document.getElementById('nome-sala');
    const criadorSalaEl = document.getElementById('criador-sala');
    const listaTarefasEl = document.getElementById('lista-tarefas');
    const formNovaTarefa = document.getElementById('form-nova-tarefa');
    const inputTarefa = document.getElementById('input-tarefa');
    const listaAlunosEl = document.getElementById('lista-alunos');
    const formNovoAluno = document.getElementById('form-novo-aluno');
    const inputAlunoNome = document.getElementById('input-aluno-nome');
    const inputAlunoRa = document.getElementById('input-aluno-ra');
    const cardEditores = document.getElementById('card-editores');
    const formConvidarEditor = document.getElementById('form-convidar-editor');
    const inputEmailConvidado = document.getElementById('input-email-convidado');
    const listaEditoresEl = document.getElementById('lista-editores');
    const btnExcluirSala = document.getElementById('btn-excluir-sala');
    const modalExcluir = document.getElementById('modal-excluir');
    const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    const toastNotification = document.getElementById('toast-notification');
    
    // NOVOS Elementos para o Código da Sala
    const codigoSalaDisplayEl = document.getElementById('codigo-sala-display');
    const btnCopiarCodigo = document.getElementById('btn-copiar-codigo');


    let salaAtual;
    let professorLogado;

    const salaId = window.location.pathname.split('/').pop();
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    // --- Funções de Renderização ---
    const renderTarefas = (tarefas) => {
        listaTarefasEl.innerHTML = '';
        if ((tarefas || []).length === 0) {
            listaTarefasEl.innerHTML = '<li>Nenhuma tarefa cadastrada.</li>';
            return;
        }
        (tarefas || []).forEach(tarefa => {
            const li = document.createElement('li');
            li.textContent = tarefa.descricao;
            listaTarefasEl.appendChild(li);
        });
    };
    const renderAlunos = (alunos) => {
        listaAlunosEl.innerHTML = '';
        if ((alunos || []).length === 0) {
            listaAlunosEl.innerHTML = '<li>Nenhum aluno cadastrado.</li>';
            return;
        }
        (alunos || []).forEach(aluno => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="lista-info"><strong>${aluno.nome}</strong><span>RA: ${aluno.RA}</span></div>`;
            listaAlunosEl.appendChild(li);
        });
    };
    const renderEditores = (editores) => {
        listaEditoresEl.innerHTML = '';
        (editores || []).forEach(editor => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="lista-info"><strong>${editor.name}</strong><span>${editor.email}</span></div>`;
            listaEditoresEl.appendChild(li);
        });
    };

    // --- Lógica Principal ---
    const fetchSalaData = async () => {
        try {
            const [meResponse, salaResponse] = await Promise.all([
                fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/game/salas/${salaId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!meResponse.ok || !salaResponse.ok) throw new Error('Não foi possível carregar os dados.');
            
            professorLogado = await meResponse.json();
            salaAtual = await salaResponse.json();

            nomeSalaEl.textContent = salaAtual.num_serie;
            criadorSalaEl.textContent = `Criada por: ${salaAtual.criador.name}`;
            codigoSalaDisplayEl.textContent = salaAtual._id; // Mostra o ID da sala

            renderTarefas(salaAtual.tarefas);
            renderAlunos(salaAtual.alunos);

            const isCriador = professorLogado._id === salaAtual.criador._id;
            if (isCriador) {
                cardEditores.classList.remove('hidden');
                btnExcluirSala.classList.remove('hidden');
                renderEditores(salaAtual.editoresConvidados);
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast(error.message || 'Erro ao carregar dados.', 'error');
        }
    };
    
    // --- Event Listeners ---
    formNovaTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descricao = inputTarefa.value.trim();
        if (!descricao) return;
        try {
            const res = await fetch(`/api/game/salas/${salaId}/tarefas`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ descricao })
            });
            if (!res.ok) throw new Error('Falha ao adicionar tarefa.');
            const salaAtualizada = await res.json();
            renderTarefas(salaAtualizada.tarefas);
            inputTarefa.value = '';
            showToast('Tarefa adicionada com sucesso!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    formNovoAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = inputAlunoNome.value.trim();
        const RA = inputAlunoRa.value.trim();
        if (!nome || !RA) return;
        try {
            const res = await fetch(`/api/game/salas/${salaId}/alunos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, RA })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Falha ao cadastrar aluno.');
            renderAlunos(data.alunos);
            formNovoAluno.reset();
            showToast('Aluno cadastrado com sucesso!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    // NOVO Event Listener para o botão de copiar
    btnCopiarCodigo.addEventListener('click', () => {
        navigator.clipboard.writeText(salaAtual._id)
            .then(() => {
                showToast('Código copiado!', 'success');
            })
            .catch(err => {
                console.error('Falha ao copiar:', err);
                showToast('Não foi possível copiar o código.', 'error');
            });
    });

    btnExcluirSala.addEventListener('click', () => modalExcluir.classList.remove('hidden'));
    btnCancelarExclusao.addEventListener('click', () => modalExcluir.classList.add('hidden'));
    modalExcluir.addEventListener('click', (e) => {
        if (e.target === modalExcluir) modalExcluir.classList.add('hidden');
    });
    btnConfirmarExclusao.addEventListener('click', async () => {
        try {
            const res = await fetch(`/api/game/salas/${salaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao excluir a sala.');
            showToast('Sala excluída com sucesso!', 'success');
            setTimeout(() => window.location.href = '/dashboard', 1500);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    let toastTimeout;
    function showToast(message, type = 'error') {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    fetchSalaData();
});

