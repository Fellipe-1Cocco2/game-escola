/**
 * Aguarda o DOM estar completamente carregado.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos ---
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    // Verificação de segurança
    if (!form || !emailInput || !senhaInput) {
        console.error("Erro Crítico: Um ou mais elementos do formulário de login não foram encontrados. Verifique os IDs no ficheiro login.html.");
        return;
    }

    // --- "Ouvinte" do Formulário ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!email || !senha) {
            showToast('Por favor, preencha o email e a senha.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Usa a mensagem de erro do servidor se existir, senão usa uma genérica
                throw new Error(data.message || 'Credenciais inválidas.');
            }

            // **PONTO CRÍTICO: Verifica se o token existe na resposta**
            if (data && data.token) {
                // Guarda o token no armazenamento local do browser
                localStorage.setItem('token', data.token);
                
                showToast('Login bem-sucedido! A redirecionar...', 'success');
                
                // Redireciona para o dashboard após um pequeno atraso
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                // Se a resposta for 200 OK mas não tiver um token
                throw new Error('Resposta de login inválida do servidor.');
            }

        } catch (error) {
            console.error('Erro de login:', error);
            showToast(error.message, 'error');
        }
    });

    /**
     * Função para exibir o pop-up flutuante (toast).
     */
    function showToast(message, type = 'error') {
        if (!toastNotification) return;
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }
});

