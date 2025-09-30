document.addEventListener('DOMContentLoaded', () => {
    const nomeAlunoEl = document.getElementById('nome-aluno');
    const subtituloTarefasEl = document.getElementById('subtitulo-tarefas');
    const listaTarefasEl = document.getElementById('lista-tarefas-jogo');
    const btnSair = document.getElementById('btn-sair');


    if (!nomeAlunoEl || !subtituloTarefasEl || !listaTarefasEl || !btnSair) {
        console.error("Erro crítico: Elementos essenciais da página de tarefas não foram encontrados.");
        return window.location.href = '/jogar';
    }

    btnSair.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/jogar';
    });

    const nomeAluno = sessionStorage.getItem('aluno_nome');
    const tarefasString = sessionStorage.getItem('tarefas');

    if (!nomeAluno || !tarefasString) {
        return window.location.href = '/jogar';
    }

    nomeAlunoEl.textContent = nomeAluno;
    const tarefas = JSON.parse(tarefasString);

    if (tarefas.length === 0) {
        subtituloTarefasEl.style.display = 'none';
        listaTarefasEl.innerHTML = `<div class="tarefa-card-vazio">Uau! Nenhuma tarefa por enquanto. Bom descanso!</div>`;
    } else {
        subtituloTarefasEl.textContent = "Mostre que você é um Sabidin!";
        listaTarefasEl.innerHTML = '';
        
        tarefas.forEach(tarefa => {
            const tarefaCard = document.createElement('div');
            
            const agora = new Date();
            let encerrada = false;
            let dataInfo = 'Sem prazo de encerramento';

            if (tarefa.dataFechamento && tarefa.horaFechamento) {
                const dataEncerramento = new Date(`${tarefa.dataFechamento.split('T')[0]}T${tarefa.horaFechamento}`);
                dataInfo = `Encerra em: ${dataEncerramento.toLocaleDateString('pt-BR')} às ${dataEncerramento.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
                if (agora > dataEncerramento) encerrada = true;
            }
            
            tarefaCard.className = `tarefa-card ${encerrada ? 'encerrada' : 'disponivel'}`;
            
            // Adiciona o ID da tarefa ao botão para sabermos em qual tarefa clicar
            tarefaCard.innerHTML = `
                <div class="tarefa-icone">${encerrada ? '⏳' : '✅'}</div>
                <div class="tarefa-info">
                    <span class="tarefa-titulo">${tarefa.titulo || 'Tarefa sem título'}</span>
                    <span class="tarefa-prazo">${encerrada ? 'Prazo encerrado' : dataInfo}</span>
                </div>
                <button class="btn-jogar-tarefa" data-tarefa-id="${tarefa._id}" ${encerrada ? 'disabled' : ''}>
                    ${encerrada ? 'Encerrado' : 'Jogar!'}
                </button>
            `;
            listaTarefasEl.appendChild(tarefaCard);
        });

        // Adiciona um "ouvinte" de eventos à lista inteira
        listaTarefasEl.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('btn-jogar-tarefa')) {
                const tarefaId = e.target.getAttribute('data-tarefa-id');
                const tarefaSelecionada = tarefas.find(t => t._id === tarefaId);

                if (tarefaSelecionada) {
                    // Guarda a tarefa selecionada para a página do jogo usar
                    sessionStorage.setItem('tarefa_atual', JSON.stringify(tarefaSelecionada));
                    // Redireciona para a nova página de jogo
                    window.location.href = `/jogar/tarefa/${tarefaId}`;
                }
            }
        });
    }
});

