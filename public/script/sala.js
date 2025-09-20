document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const salaTitulo = document.getElementById('sala-titulo');
    const listaTarefas = document.getElementById('lista-tarefas');
    const formNovaTarefa = document.getElementById('form-nova-tarefa');
    const inputNovaTarefa = document.getElementById('input-nova-tarefa');
    
    const listaAlunos = document.getElementById('lista-alunos');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    // Extrair o ID da sala da URL
    const salaId = window.location.pathname.split('/').pop();
    const token = localStorage.getItem('authToken');

    // Se não houver ID da sala ou token, redireciona
    if (!salaId || !token) {
        window.location.href = '/login';
        return;
    }

    // Função para buscar e renderizar os dados da sala
    const fetchSalaData = async () => {
        try {
            const response = await fetch(`/api/game/salas/${salaId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) { // Não autorizado
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados da sala.');
            }

            const sala = await response.json();
            
            // Atualiza o título
            salaTitulo.textContent = `Gerenciando Sala: ${sala.num_serie}`;

            // Renderiza as tarefas
            renderTarefas(sala.tarefas);
            // Renderiza os alunos
            renderAlunos(sala.alunos);

        } catch (error) {
            console.error('Erro:', error);
            salaTitulo.textContent = 'Erro ao carregar a sala';
            showToast(error.message, 'error');
        }
    };

    // Função para renderizar a lista de tarefas
    const renderTarefas = (tarefas) => {
        listaTarefas.innerHTML = ''; // Limpa a lista
        if (tarefas.length === 0) {
            listaTarefas.innerHTML = '<p class="placeholder">Nenhuma tarefa criada ainda.</p>';
        } else {
            tarefas.forEach(tarefa => {
                const item = document.createElement('div');
                item.className = 'item-tarefa';
                item.innerHTML = `<span>${tarefa.texto}</span>`; // Adicionar botões de ação aqui depois
                listaTarefas.appendChild(item);
            });
        }
    };
    
    // Função para renderizar a lista de alunos
    const renderAlunos = (alunos) => {
        listaAlunos.innerHTML = '';
        if (alunos.length === 0) {
            listaAlunos.innerHTML = '<p class="placeholder">Nenhum aluno nesta sala ainda.</p>';
        } else {
            alunos.forEach(aluno => {
                const item = document.createElement('div');
                item.className = 'item-aluno';
                item.innerHTML = `<span>${aluno.nome} <span class="ra">(RA: ${aluno.RA})</span></span>`;
                listaAlunos.appendChild(item);
            });
        }
    };
    
    // Event listener para o formulário de nova tarefa
    formNovaTarefa.addEventListener('submit', async (event) => {
        event.preventDefault();
        const textoTarefa = inputNovaTarefa.value.trim();
        if (!textoTarefa) return;

        try {
            const response = await fetch(`/api/game/salas/${salaId}/tarefas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ texto: textoTarefa })
            });

            const novaTarefa = await response.json();

            if (!response.ok) {
                throw new Error(novaTarefa.message || 'Não foi possível adicionar a tarefa.');
            }

            // Adiciona a nova tarefa à lista sem precisar recarregar a página
            const placeholder = listaTarefas.querySelector('.placeholder');
            if (placeholder) placeholder.remove();
            
            const item = document.createElement('div');
            item.className = 'item-tarefa';
            item.innerHTML = `<span>${novaTarefa.texto}</span>`;
            listaTarefas.appendChild(item);

            inputNovaTarefa.value = ''; // Limpa o input
            showToast('Tarefa adicionada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            showToast(error.message, 'error');
        }
    });

    function showToast(message, type = 'error') {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    }

    // Carrega os dados da sala ao iniciar a página
    fetchSalaData();
});

