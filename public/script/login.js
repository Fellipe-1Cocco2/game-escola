document.addEventListener('DOMContentLoaded', () => {

    // ATUALIZADO: Seleciona o formulário pelo seu ID único para ser mais preciso
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    // Se o formulário não for encontrado, exibe um erro e para a execução
    if (!form) {
        console.error("Erro Crítico: O formulário com id='login-form' não foi encontrado.");
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            const email = emailInput.value.trim();
            const password = senhaInput.value.trim();
            
            if (!email || !password) {
                showToast('Por favor, forneça email e senha.', 'error');
                // Apenas retorna em vez de lançar um erro, para não poluir o console desnecessariamente
                return;
            }

            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciais inválidas.');
            }

            showToast('Login realizado com sucesso! Redirecionando...', 'success');
            localStorage.setItem('authToken', data.token);

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);

        } catch (error) {
            console.error('Erro de login:', error);
            showToast(error.message || 'Ocorreu um problema ao tentar fazer login.', 'error');
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
});

