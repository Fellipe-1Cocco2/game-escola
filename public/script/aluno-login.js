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

            // Guarda os dados no sessionStorage para a próxima página usar
            sessionStorage.setItem('aluno_id', data.aluno._id); // GUARDA O ID DO ALUNO
            sessionStorage.setItem('aluno_nome', data.aluno.nome);
            sessionStorage.setItem('tarefas', JSON.stringify(data.tarefas))
            // Redireciona para a página de tarefas
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

