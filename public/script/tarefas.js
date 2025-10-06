document.addEventListener('DOMContentLoaded', () => {
    const nomeAlunoEl = document.getElementById('nome-aluno');
    const subtituloTarefasEl = document.getElementById('subtitulo-tarefas');
    const listaTarefasEl = document.getElementById('lista-tarefas-jogo');
    const btnSair = document.getElementById('btn-sair');

    const nomeAluno = sessionStorage.getItem('aluno_nome');
    const alunoId = sessionStorage.getItem('aluno_id');
    const salaId = sessionStorage.getItem('sala_id_atual');

    // Validação inicial
    if (!nomeAlunoEl || !listaTarefasEl || !btnSair) {
        console.error("Erro crítico: Elementos essenciais não foram encontrados.");
        return;
    }
    if (!nomeAluno || !alunoId || !salaId) {
        alert("Sessão inválida. Por favor, faça o login novamente.");
        window.location.href = '/jogar';
        return;
    }

    nomeAlunoEl.textContent = nomeAluno;

    // Função para renderizar as tarefas na tela
    const renderizarTarefas = (tarefas) => {
        listaTarefasEl.innerHTML = ''; // Limpa a lista antiga
        if (tarefas.length === 0) {
            subtituloTarefasEl.style.display = 'none';
            listaTarefasEl.innerHTML = `<div class="tarefa-card-vazio">Nenhuma tarefa por enquanto. Bom descanso!</div>`;
            return;
        }

        subtituloTarefasEl.textContent = "Mostre que você é um Sabidin!";
        tarefas.forEach(tarefa => {
            const tarefaCard = document.createElement('div');
            const progresso = tarefa.progressos ? tarefa.progressos.find(p => p.alunoId === alunoId) : null;
            const concluida = progresso && progresso.status === 'concluido';
            
            const agora = new Date();
            let encerrada = false;
            let dataInfo = 'Sem prazo de encerramento';

            if (tarefa.dataFechamento && tarefa.horaFechamento) {
                const dataEncerramento = new Date(`${tarefa.dataFechamento.split('T')[0]}T${tarefa.horaFechamento}`);
                dataInfo = `Encerra em: ${dataEncerramento.toLocaleDateString('pt-BR')} às ${dataEncerramento.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
                if (agora > dataEncerramento) encerrada = true;
            }
            
            const indisponivel = encerrada || concluida;
            tarefaCard.className = `tarefa-card ${indisponivel ? 'encerrada' : 'disponivel'}`;
            let textoBotao = concluida ? 'Concluído' : (encerrada ? 'Encerrado' : 'Jogar!');

            tarefaCard.innerHTML = `
                <div class="tarefa-icone">${indisponivel ? '⏳' : '✅'}</div>
                <div class="tarefa-info">
                    <span class="tarefa-titulo">${tarefa.titulo || 'Tarefa sem título'}</span>
                    <span class="tarefa-prazo">${encerrada ? 'Prazo encerrado' : dataInfo}</span>
                </div>
                <button class="btn-jogar-tarefa" data-tarefa='${JSON.stringify(tarefa)}' ${indisponivel ? 'disabled' : ''}>
                    ${textoBotao}
                </button>
            `;
            listaTarefasEl.appendChild(tarefaCard);
        });
    };

    // Função principal para buscar os dados atualizados do servidor
    const buscarTarefasAtualizadas = async () => {
        try {
            const response = await fetch(`/api/game/salas/${salaId}/tarefas`);
            if (!response.ok) {
                throw new Error('Não foi possível buscar as tarefas.');
            }
            const tarefas = await response.json();
            renderizarTarefas(tarefas);
        } catch (error) {
            console.error(error);
            listaTarefasEl.innerHTML = `<div class="tarefa-card-vazio">Ocorreu um erro ao carregar as tarefas.</div>`;
        }
    };

    // Event Listeners
    btnSair.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/jogar';
    });

    listaTarefasEl.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-jogar-tarefa')) {
            const tarefaDataString = e.target.getAttribute('data-tarefa');
            const tarefaSelecionada = JSON.parse(tarefaDataString);

            if (tarefaSelecionada) {
                sessionStorage.setItem('tarefa_atual', JSON.stringify(tarefaSelecionada));
                window.location.href = `/jogar/tarefa/${tarefaSelecionada._id}`;
            }
        }
    });

    // Inicia a busca dos dados ao carregar a página
    buscarTarefasAtualizadas();
});