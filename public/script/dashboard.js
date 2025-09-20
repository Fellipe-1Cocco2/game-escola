document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const professorNome = document.getElementById('professor-nome');
    const listaSalas = document.getElementById('lista-salas');
    const formNovaSala = document.getElementById('form-nova-sala');
    const inputNovaSala = document.getElementById('input-nova-sala');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    // Pega o token do localStorage
    const token = localStorage.getItem('authToken');

    // Se não houver token, redireciona para a página de login
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Função para buscar e renderizar os dados do professor e suas salas
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/users/me', {
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
                throw new Error('Não foi possível carregar os dados do dashboard.');
            }
            
            const professor = await response.json();
            
            // Atualiza o nome do professor no cabeçalho
            professorNome.textContent = professor.name;

            // Renderiza os cards das salas
            renderSalas(professor.salas);

        } catch (error) {
            console.error('Erro:', error);
            showToast(error.message, 'error');
        }
    };
    
    // Função para renderizar os cards das salas
    const renderSalas = (salas) => {
        listaSalas.innerHTML = ''; // Limpa a lista
        if (salas.length === 0) {
            listaSalas.innerHTML = '<p class="placeholder">Você ainda não criou nenhuma sala. Use o formulário abaixo para começar!</p>';
        } else {
            salas.forEach(sala => {
                const salaCard = document.createElement('a'); // ATUALIZADO: Usando <a> para ser um link
                salaCard.className = 'sala-card';
                salaCard.href = `/sala/${sala._id}`; // ATUALIZADO: Define o link para a página da sala
                salaCard.innerHTML = `
                    <h3>${sala.num_serie}</h3>
                    <div class="sala-info">
                        <span><strong>${sala.tarefas.length}</strong> Tarefas</span>
                        <span><strong>${sala.alunos.length}</strong> Alunos</span>
                    </div>
                    <div class="card-footer">
                        <span>Gerenciar Sala &rarr;</span>
                    </div>
                `;
                listaSalas.appendChild(salaCard);
            });
        }
    };
    
    // Event listener para o formulário de nova sala
    formNovaSala.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeSala = inputNovaSala.value.trim();
        if (!nomeSala) return;

        try {
            const response = await fetch('/api/game/salas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ num_serie: nomeSala })
            });

            const novaSala = await response.json();

            if (!response.ok) {
                throw new Error(novaSala.message || 'Não foi possível criar a sala.');
            }

            // Adiciona o novo card à lista sem precisar recarregar a página
            const placeholder = listaSalas.querySelector('.placeholder');
            if(placeholder) placeholder.remove();

            const salaCard = document.createElement('a');
            salaCard.className = 'sala-card';
            salaCard.href = `/sala/${novaSala._id}`;
            salaCard.innerHTML = `
                <h3>${novaSala.num_serie}</h3>
                <div class="sala-info">
                    <span><strong>0</strong> Tarefas</span>
                    <span><strong>0</strong> Alunos</span>
                </div>
                <div class="card-footer">
                    <span>Gerenciar Sala &rarr;</span>
                </div>
            `;
            listaSalas.appendChild(salaCard);

            inputNovaSala.value = ''; // Limpa o input
            showToast('Sala criada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao criar sala:', error);
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
    
    // Carrega os dados do dashboard ao iniciar a página
    fetchDashboardData();
});

