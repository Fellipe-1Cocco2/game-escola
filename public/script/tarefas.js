document.addEventListener('DOMContentLoaded', () => {
    const nomeAlunoEl = document.getElementById('nome-aluno');
    const subtituloTarefasEl = document.getElementById('subtitulo-tarefas');
    const listaTarefasEl = document.getElementById('lista-tarefas-jogo');
    const btnSair = document.getElementById('btn-sair');

    if (!nomeAlunoEl || !subtituloTarefasEl || !listaTarefasEl || !btnSair) {
        console.error("Erro crítico: Elementos essenciais da página de tarefas não foram encontrados.");
        window.location.href = '/jogar';
        return;
    }

    btnSair.addEventListener('click', () => {
        sessionStorage.clear(); // Limpa toda a sessão para garantir
        window.location.href = '/jogar';
    });

    const nomeAluno = sessionStorage.getItem('aluno_nome');
    const tarefasString = sessionStorage.getItem('tarefas');

    if (!nomeAluno || !tarefasString) {
        window.location.href = '/jogar';
        return;
    }

    nomeAlunoEl.textContent = nomeAluno;
    const tarefas = JSON.parse(tarefasString);

    // Lógica para mostrar a mensagem correta
    if (tarefas.length === 0) {
        // Se não houver tarefas, esconde o subtítulo e mostra o "balão" especial
        subtituloTarefasEl.style.display = 'none';
        listaTarefasEl.innerHTML = `<div class="tarefa-card-vazio">Uau! Nenhuma tarefa por enquanto. Bom descanso!</div>`;
    } else {
        // Se houver tarefas, mostra o subtítulo e a lista de tarefas
        subtituloTarefasEl.textContent = "Mostre que você é um Sabidin!";
        listaTarefasEl.innerHTML = '';
        tarefas.forEach(tarefa => {
            const tarefaCard = document.createElement('div');
            tarefaCard.className = 'tarefa-card';
            tarefaCard.textContent = tarefa.descricao;
            listaTarefasEl.appendChild(tarefaCard);
        });
    }
});

