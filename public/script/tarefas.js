document.addEventListener('DOMContentLoaded', () => {
    const nomeAlunoEl = document.getElementById('nome-aluno');
    const subtituloTarefasEl = document.getElementById('subtitulo-tarefas');
    const listaTarefasEl = document.getElementById('lista-tarefas-jogo');
    const btnSair = document.getElementById('btn-sair');

    // --- SELETORES PARA O MODAL ---
    const btnConfig = document.getElementById('btn-config');
    const modalConfig = document.getElementById('modal-configuracoes');
    const btnSalvarConfig = document.getElementById('btn-salvar-config');
    const selectMusica = document.getElementById('select-musica');
    const toggleNarracao = document.getElementById('toggle-narracao');

    const nomeAluno = sessionStorage.getItem('aluno_nome');
    const alunoId = sessionStorage.getItem('aluno_id');
    const salaId = sessionStorage.getItem('sala_id_atual');

    const rankingListaEl = document.getElementById('ranking-lista');

    // Validação inicial
    if (!nomeAlunoEl || !listaTarefasEl || !btnSair || !btnConfig || !modalConfig || !rankingListaEl) { // Adicionado rankingListaEl
        console.error("Erro crítico: Elementos essenciais não foram encontrados.");
        return;
    }
    if (!nomeAluno || !alunoId || !salaId) {
        alert("Sessão inválida. Por favor, faça o login novamente.");
        window.location.href = '/jogar';
        return;
    }

    nomeAlunoEl.textContent = nomeAluno;

    // --- FUNÇÕES DO MODAL ---
    function carregarConfiguracoes() {
        const musica = localStorage.getItem('config_musica') || 'musica1';
        const narracao = localStorage.getItem('config_narracao') !== 'false'; // Padrão é true

        selectMusica.value = musica;
        toggleNarracao.checked = narracao;
    }

    function salvarConfiguracoes() {
        localStorage.setItem('config_musica', selectMusica.value);
        localStorage.setItem('config_narracao', toggleNarracao.checked);
        modalConfig.classList.add('hidden');
    }

    // --- EVENT LISTENERS DO MODAL ---
    btnConfig.addEventListener('click', () => {
        carregarConfiguracoes(); 
        modalConfig.classList.remove('hidden');
    });

    btnSalvarConfig.addEventListener('click', salvarConfiguracoes);

    modalConfig.addEventListener('click', (e) => {
        if (e.target === modalConfig) {
            modalConfig.classList.add('hidden');
        }
    });


    const buscarERenderizarRanking = async () => {
         // Verifica se o elemento existe antes de tentar buscar
         if (!rankingListaEl) {
              console.warn("Elemento ranking-lista não encontrado, pulando busca do ranking.");
              return;
         }
        try {
            // Usa a nova rota da API
            const response = await fetch(`/api/game/salas/${salaId}/ranking`);
            if (!response.ok) {
                throw new Error('Não foi possível buscar o ranking.');
            }
            const ranking = await response.json();
            renderizarRanking(ranking);
        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
            if (rankingListaEl) { // Verifica de novo antes de escrever
                 rankingListaEl.innerHTML = '<p>Erro ao carregar o ranking.</p>';
            }
        }
    };

    const renderizarRanking = (ranking) => {
        if (!rankingListaEl) return;
        rankingListaEl.innerHTML = ''; // Limpa "Carregando..."

        if (!ranking || ranking.length === 0) {
            rankingListaEl.innerHTML = '<p>Ninguém pontuou ainda!</p>';
            return;
        }

        ranking.forEach((aluno, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';

            // Adiciona destaque se for o aluno logado
            if (aluno.alunoId === alunoId) {
                item.style.backgroundColor = '#eff6ff'; // Azul claro
                item.style.fontWeight = 'bold';
            }

            // Define a posição (1º, 2º, 3º...)
            let posicao = `${index + 1}º`;
            if (index === 0) posicao = '🥇'; // Ouro
            else if (index === 1) posicao = '🥈'; // Prata
            else if (index === 2) posicao = '🥉'; // Bronze

            item.innerHTML = `
                <span class="ranking-posicao">${posicao}</span>
                <span class="ranking-nome">${aluno.nome || 'Aluno Desconhecido'}</span>
                <span class="ranking-pontos">${aluno.pontuacaoTotal} pts</span>
            `;
            rankingListaEl.appendChild(item);
        });
    };


    // Função para renderizar as tarefas na tela
    const renderizarTarefas = (tarefas) => {
        listaTarefasEl.innerHTML = '';

        // --- ADICIONADO: Filtra tarefas sem perguntas ---
        const tarefasComPerguntas = tarefas.filter(tarefa => tarefa.numPerguntas > 0);
        // --- FIM ADIÇÃO ---

        if (tarefasComPerguntas.length === 0) { // Usa a lista filtrada
            if (subtituloTarefasEl) subtituloTarefasEl.style.display = 'none';
            listaTarefasEl.innerHTML = `<div class="tarefa-card-vazio">Nenhuma tarefa com perguntas disponível no momento!</div>`;
            return;
        }

        if (subtituloTarefasEl) subtituloTarefasEl.textContent = "Mostre que você é um Sabidin!";

        // Itera sobre a lista filtrada
        tarefasComPerguntas.forEach(tarefa => {
            const tarefaCard = document.createElement('div');
            const progresso = tarefa.progressos ? tarefa.progressos.find(p => p.alunoId === alunoId) : null;
            const concluida = progresso && progresso.status === 'concluido';

            const agora = new Date();
            let encerrada = false;
            let dataInfo = 'Sem prazo de encerramento';

            if (tarefa.dataFechamento) { // Verifica se dataFechamento existe
                const horaEncerramento = tarefa.horaFechamento || '23:59:59';
                 // Garante que a data seja tratada corretamente
                const dataParte = tarefa.dataFechamento.split('T')[0];
                const dataEncerramento = new Date(`${dataParte}T${horaEncerramento}`);

                if (!isNaN(dataEncerramento)) { // Verifica se a data é válida
                     dataInfo = `Encerra em: ${dataEncerramento.toLocaleDateString('pt-BR')} às ${tarefa.horaFechamento ? dataEncerramento.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : ''}`;
                    if (agora > dataEncerramento) encerrada = true;
                } else {
                     dataInfo = "Data inválida"; // Caso a data não possa ser parseada
                }
            }


            const indisponivel = encerrada || concluida;
            tarefaCard.className = `tarefa-card ${indisponivel ? 'encerrada' : 'disponivel'}`;
            let textoBotao = concluida ? 'Concluído' : (encerrada ? 'Encerrado' : 'Jogar!');

            // Escapa o JSON para o atributo data-tarefa
            const tarefaJsonString = JSON.stringify(tarefa).replace(/"/g, '&quot;');

            tarefaCard.innerHTML = `
                <div class="tarefa-icone">${indisponivel ? '⏳' : '✅'}</div>
                <div class="tarefa-info">
                    <span class="tarefa-titulo">${tarefa.titulo || 'Tarefa sem título'}</span>
                    <span class="tarefa-prazo">${encerrada ? 'Prazo encerrado' : dataInfo}</span>
                </div>
                <button class="btn-jogar-tarefa" data-tarefa="${tarefaJsonString}" ${indisponivel ? 'disabled' : ''}>
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
        // CORREÇÃO: Procura pelo botão ou por um elemento DENTRO do botão
        const targetButton = e.target.closest('.btn-jogar-tarefa');
        
        if (targetButton) { // Se clicou no botão ou em algo dentro dele
            const tarefaDataString = targetButton.getAttribute('data-tarefa');
            
            // O getAttribute reverte o '&quot;' para '"' automaticamente
            const tarefaSelecionada = JSON.parse(tarefaDataString); 

            if (tarefaSelecionada) {
                sessionStorage.setItem('tarefa_atual', JSON.stringify(tarefaSelecionada));
                window.location.href = `/jogar/tarefa/${tarefaSelecionada._id}`;
            }
        }
    });

    // Inicia a busca dos dados ao carregar a página
    buscarTarefasAtualizadas();
    buscarERenderizarRanking();
});