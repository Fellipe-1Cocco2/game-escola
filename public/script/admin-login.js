/**
 * Lógica de login para a página de administração.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos ---
    const form = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout;

    if (!form || !emailInput || !senhaInput || !toastNotification) {
        console.error("Erro Crítico: Elementos do formulário de login admin não encontrados.");
        return;
    }

    // --- "Ouvinte" do Formulário ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão

        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!email || !senha) {
            showToast('Por favor, preencha o email e a senha.', 'error');
            return;
        }

        try {
            // --- ALTERAÇÃO: Chama a rota de login do admin ---
            const response = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Usa a mensagem de erro do servidor se existir, senão usa uma genérica
                throw new Error(data.message || 'Credenciais de admin inválidas.');
            }

            // Verifica se o token existe na resposta
            if (data && data.token) {
                // --- ALTERAÇÃO: Guarda o token como 'admin_token' para diferenciar ---
                localStorage.setItem('admin_token', data.token);
                
                showToast('Login de admin bem-sucedido! Redirecionando...', 'success');
                
                // --- ALTERAÇÃO: Redireciona para o admin-dashboard ---
                setTimeout(() => {
                    window.location.href = '/admin/dashboard'; // Nova URL do dashboard admin
                }, 1000);
            } else {
                throw new Error('Resposta de login inválida do servidor.');
            }

        } catch (error) {
            console.error('Erro de login admin:', error);
            showToast(error.message, 'error');
        }
    });

    /**
     * Função para exibir o pop-up flutuante (toast).
     */
    function showToast(message, type = 'error') {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }
});
