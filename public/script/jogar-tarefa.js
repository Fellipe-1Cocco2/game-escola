document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE TELA ---
    const loadingScreen = document.getElementById('loading-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');

    // --- SELETORES DO JOGO ---
    const taskTitleEl = document.getElementById('task-title');
    const questionCounterEl = document.getElementById('question-counter');
    const scoreDisplayEl = document.getElementById('score-display');
    const questionTextEl = document.getElementById('question-text');
    const answerButtons = document.querySelectorAll('.answer-btn');

    // --- SELETORES DOS RESULTADOS ---
    const finalScoreEl = document.getElementById('final-score');
    const finalMessageEl = document.getElementById('final-message');
    const btnVoltarTarefas = document.getElementById('btn-voltar-tarefas');

    // --- ESTADO DO JOGO ---
    let currentTask = null;
    let currentQuestionIndex = 0;
    let score = 0;
    const correctSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(1e3).join('1211'));
    const incorrectSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(1e3).join('1122'));


    function startGame() {
        const taskString = sessionStorage.getItem('tarefa_atual');
        if (!taskString) {
            alert('Nenhuma tarefa selecionada!');
            window.location.href = '/tarefas';
            return;
        }
        currentTask = JSON.parse(taskString);

        // --- VERIFICAÇÃO DE SEGURANÇA CRUCIAL ---
        // Verifica se as perguntas existem e se os dados completos (com 'opcoes') foram carregados.
        if (!currentTask.perguntas || currentTask.perguntas.length === 0 || !currentTask.perguntas[0].pergunta || !currentTask.perguntas[0].pergunta.opcoes) {
            alert('Erro: Os dados das perguntas não foram carregados corretamente. O backend pode não estar a enviar os detalhes completos. Tente fazer o login de aluno novamente.');
            window.location.href = '/tarefas'; // Volta para a lista de tarefas
            return;
        }

        loadingScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        displayQuestion();
    }

    function displayQuestion() {
        answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });

        const item = currentTask.perguntas[currentQuestionIndex];
        const question = item.pergunta;

        taskTitleEl.textContent = currentTask.titulo;
        questionCounterEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentTask.perguntas.length}`;
        questionTextEl.textContent = question.texto;
        
        answerButtons.forEach((button, index) => {
            // A verificação em startGame() garante que question.opcoes existe aqui.
            button.querySelector('.answer-text').textContent = question.opcoes[index];
        });
    }

    function handleAnswerClick(e) {
        const selectedButton = e.currentTarget;
        const selectedIndex = parseInt(selectedButton.dataset.index);
        const item = currentTask.perguntas[currentQuestionIndex];
        const correctIndex = item.pergunta.opcaoCorreta;

        answerButtons.forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            selectedButton.classList.add('correct');
            score += 100;
            scoreDisplayEl.textContent = score;
            correctSound.play();
        } else {
            selectedButton.classList.add('incorrect');
            answerButtons[correctIndex].classList.add('correct');
            incorrectSound.play();
        }

        setTimeout(nextQuestion, 2000);
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentTask.perguntas.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');

        finalScoreEl.textContent = score;
        const totalQuestions = currentTask.perguntas.length;
        const correctAnswers = score / 100;

        if (correctAnswers === totalQuestions) {
            finalMessageEl.textContent = "Incrível! Você acertou todas!";
        } else if (correctAnswers > totalQuestions / 2) {
            finalMessageEl.textContent = `Muito bem! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        } else {
            finalMessageEl.textContent = `Continue tentando! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        }
        salvarResultado(correctAnswers, totalQuestions);
    }

    // NOVA FUNÇÃO para enviar o resultado para o servidor
    async function salvarResultado(pontos, totalPerguntas) {
        const alunoId = sessionStorage.getItem('aluno_id');
        const alunoNome = sessionStorage.getItem('aluno_nome');
        const tarefaId = currentTask._id;
        
        // O ID da sala está na URL da página anterior, mas não o guardamos.
        // Vamos extraí-lo da tarefa, se possível, ou precisaríamos de uma pequena mudança.
        // Por agora, vamos assumir que o ID da sala está disponível de alguma forma.
        // A melhor forma é guardá-lo no sessionStorage também.
        const salaId = currentTask.salaId; // Assumindo que o ID da sala virá com a tarefa
        // Se `salaId` não vier na tarefa, teríamos que buscar de outra forma ou ajustar o `tarefas.js`

        // CORREÇÃO NECESSÁRIA NO FUTURO: O ID da sala não está a ser passado.
        // Para este exemplo, vamos assumir que a URL da API pode ser construída.
        // A URL da API para salvar é: /api/game/salas/:salaId/tarefas/:tarefaId/resultados

        const pathParts = window.location.pathname.split('/'); // Ex: /jogar/tarefa/ID_TAREFA
        // Se a salaId não estiver aqui, precisaremos de a adicionar ao sessionStorage no `tarefas.js`
        // Vamos assumir que o `tarefas.js` foi atualizado para guardar o `salaId`.
        
        try {
            // Este `salaId` deveria vir do sessionStorage também. Vamos ajustar o tarefas.js.
            // Para já, vamos assumir que o temos.
            // Vamos precisar de fazer uma pequena correção no `tarefas.js`
            const salaIdFromSession = sessionStorage.getItem('sala_id_atual');

            await fetch(`/api/game/salas/${salaIdFromSession}/tarefas/${tarefaId}/resultados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alunoId,
                    alunoNome,
                    pontuacao: pontos,
                    totalPerguntas
                })
            });
            console.log("Resultado salvo!");
        } catch (error) {
            console.error("Erro ao salvar o resultado:", error);
        }
    }
    
    answerButtons.forEach(button => button.addEventListener('click', handleAnswerClick));
    btnVoltarTarefas.addEventListener('click', () => window.location.href = '/tarefas');

    startGame();
});

