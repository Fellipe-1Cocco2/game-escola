document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('aluno-login-form');
    const codigoSalaInput = document.getElementById('codigo-sala');
    const raAlunoInput = document.getElementById('ra-aluno');
    const toastNotification = document.getElementById('toast-notification');
    const codigoSalaErrorEl = document.getElementById('codigo-sala-error');
    const raAlunoErrorEl = document.getElementById('ra-aluno-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        codigoSalaErrorEl.textContent = '';
        raAlunoErrorEl.textContent = '';
        const codigoSala = codigoSalaInput.value.trim();
        const RA = raAlunoInput.value.trim();

        if (!codigoSala || !RA) {
            if (!codigoSala) codigoSalaErrorEl.textContent = 'Este campo é obrigatório.';
            if (!RA) raAlunoErrorEl.textContent = 'Este campo é obrigatório.';
            return;
        }

        try {
            const response = await fetch('/api/game/aluno/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoSala, RA })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha no login.');
            }
            
            console.log("Login bem-sucedido. Dados recebidos do servidor:", data);
            console.log("Guardando no sessionStorage o nome:", data.aluno.nome);

            sessionStorage.setItem('aluno_id', data.aluno._id);
            sessionStorage.setItem('aluno_nome', data.aluno.nome);
            // Salva o código da sala que o aluno acabou de usar para logar
            sessionStorage.setItem('sala_id_atual', data.salaIdOriginal);
            // O 'tarefas' no sessionStorage agora serve apenas como um fallback inicial
            sessionStorage.setItem('tarefas', JSON.stringify(data.tarefas));

            window.location.href = '/tarefas';

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
        }, 4000);
    }
});

