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
    const alunoId = sessionStorage.getItem('aluno_id');
    const salaId = sessionStorage.getItem('sala_id_atual'); 

    const correctSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(1e3).join('1211'));
    const incorrectSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(1e3).join('1122'));


    function startGame() {
        const taskString = sessionStorage.getItem('tarefa_atual');
        if (!taskString || !alunoId) {
            alert('Nenhuma tarefa ou aluno selecionado!');
            window.location.href = '/tarefas';
            return;
        }
        currentTask = JSON.parse(taskString);

        // Verificação de segurança crucial
        if (!currentTask.perguntas || currentTask.perguntas.length === 0 || !currentTask.perguntas[0].pergunta) {
            alert('Erro: Esta tarefa não tem perguntas válidas. Avise o professor.');
            window.location.href = '/tarefas'; 
            return;
        }
        
        const progresso = currentTask.progressos ? currentTask.progressos.find(p => p.alunoId === alunoId) : null;
        if (progresso) {
            score = progresso.pontuacao || 0;
            currentQuestionIndex = progresso.respostas.length; 
            scoreDisplayEl.textContent = score;
        }
        
        if (progresso && progresso.status === 'concluido') {
            alert('Você já concluiu esta tarefa!');
            window.location.href = '/tarefas';
            return;
        }

        loadingScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentTask.perguntas.length) {
            showResults();
            return;
        }

        answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });

        // --- CORREÇÃO APLICADA AQUI ---
        const item = currentTask.perguntas[currentQuestionIndex];
        const question = item.pergunta; // Acessa o objeto da pergunta aninhado

        taskTitleEl.textContent = currentTask.titulo;
        questionCounterEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentTask.perguntas.length}`;
        questionTextEl.textContent = question.texto;
        
        answerButtons.forEach((button, index) => {
            button.querySelector('.answer-text').textContent = question.opcoes[index];
        });
    }

    async function handleAnswerClick(e) {
        const selectedButton = e.currentTarget;
        const selectedIndex = parseInt(selectedButton.dataset.index);

        // --- CORREÇÃO APLICADA AQUI ---
        const item = currentTask.perguntas[currentQuestionIndex];
        const question = item.pergunta; // Acessa o objeto da pergunta aninhado
        
        const correctIndex = question.opcaoCorreta;
        const acertou = selectedIndex === correctIndex;

        answerButtons.forEach(btn => btn.disabled = true);

        if (acertou) {
            selectedButton.classList.add('correct');
            score += 100;
            scoreDisplayEl.textContent = score;
            correctSound.play();
        } else {
            selectedButton.classList.add('incorrect');
            answerButtons[correctIndex].classList.add('correct');
            incorrectSound.play();
        }

        await salvarProgressoNoBackend(question._id, selectedIndex, acertou, score);

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
    }

    async function salvarProgressoNoBackend(perguntaId, respostaIndex, acertou, pontuacaoAtual) {
        // O ID da sala está no `currentTask`, que foi populado no login do aluno
        const salaIdDoAluno = currentTask.salaId; 
        if (!salaIdDoAluno) {
            // Se não encontrar o salaId na tarefa, tenta pegar da URL como um fallback
            const pathParts = window.location.pathname.split('/');
            const tarefaIdFromUrl = pathParts[3];
            // Lógica para encontrar a qual sala a tarefa pertence seria necessária aqui
            // Por ora, vamos assumir que o backend está enviando o salaId
            console.error("ERRO CRÍTICO: salaId não encontrado. Verifique o populate no backend.");
            return;
        }

        try {
            const response = await fetch(`/api/game/salas/${salaIdDoAluno}/tarefas/${currentTask._id}/progresso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alunoId,
                    perguntaId,
                    respostaIndex,
                    acertou,
                    pontuacaoAtual
                })
            });
            if (!response.ok) throw new Error('Falha ao salvar o progresso.');
            console.log("Progresso salvo!");
        } catch (error) {
            console.error("Erro ao salvar o progresso:", error);
        }
    }
    
    answerButtons.forEach(button => button.addEventListener('click', handleAnswerClick));
    btnVoltarTarefas.addEventListener('click', () => window.location.href = '/tarefas');

    startGame();
});