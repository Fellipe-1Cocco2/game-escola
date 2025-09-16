// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os elementos do formulário e o pop-up
    const form = document.getElementById('cadastro-form');
    // CORREÇÃO: O ID no HTML original era "Nome" com 'N' maiúsculo.
    const nomeInput = document.getElementById('Nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmeSenhaInput = document.getElementById('confirme-senha');
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout; // Variável para controlar o timer do pop-up

    // Verificação de segurança para garantir que todos os elementos foram encontrados
    // Isso evita o erro "Cannot read properties of null" e ajuda a depurar
    if (!form || !nomeInput || !emailInput || !senhaInput || !confirmeSenhaInput || !toastNotification) {
        console.error("Erro Crítico: Um ou mais elementos do formulário não foram encontrados no DOM. Verifique os IDs no seu arquivo HTML (cadastro.html).");
        // IDs esperados: 'cadastro-form', 'Nome', 'email', 'senha', 'confirme-senha', 'toast-notification'
        return; // Impede que o resto do script seja executado
    }


    // Adiciona um "ouvinte" para o evento de submissão do formulário
    form.addEventListener('submit', (event) => {
        // Previne o comportamento padrão do formulário
        event.preventDefault();

        // Pega os valores dos inputs, removendo espaços em branco
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        const confirmeSenha = confirmeSenhaInput.value.trim();

        // 1. Validação: Verifica se algum campo está vazio
        if (!nome || !email || !senha || !confirmeSenha) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // 2. Validação: Verifica se o e-mail tem um formato válido
        if (!isValidEmail(email)) {
            showToast('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        // 3. Validação: Verifica se a senha tem pelo menos 6 caracteres
        if (senha.length < 6) {
            showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        // 4. Validação: Verifica se as senhas são iguais
        if (senha !== confirmeSenha) {
            showToast('As senhas não coincidem.', 'error');
            return;
        }

        // Se todas as validações passarem...
        console.log('Validação bem-sucedida! Enviando dados...');

        // AJUSTE: Mapeia os dados do formulário para o schema do Prisma
        const dadosUsuario = {
            name: nome, // 'nome' vira 'name'
            email: email,
            password: senha // 'senha' vira 'password'
        };
        
        console.log(dadosUsuario);

        // AJUSTE: Altera a URL para corresponder ao endpoint do backend
        fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosUsuario),
        })
        .then(response => {
            // Se o backend retornar um erro (ex: e-mail já existe), ele será tratado aqui
            if (response.status === 409) { // 409 Conflict é um bom status para "usuário já existe"
                 throw new Error('Este e-mail já está cadastrado.');
            }
            if (!response.ok) {
                throw new Error('Ocorreu um problema no cadastro. Tente novamente.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Sucesso:', data);
            showToast('Cadastro realizado com sucesso!', 'success');
            form.reset();
        })
        .catch((error) => {
            console.error('Erro:', error);
            showToast(error.message || 'Não foi possível conectar ao servidor.', 'error');
        });
    });

    /**
     * Função para exibir o pop-up flutuante (toast)
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - 'error' ou 'success' para estilização.
     */
    function showToast(message, type = 'error') {
        // Limpa qualquer timer anterior para evitar que o pop-up suma antes da hora
        clearTimeout(toastTimeout);

        toastNotification.textContent = message;
        // Remove classes antigas e adiciona as novas
        toastNotification.className = 'toast-notification'; // Reseta
        toastNotification.classList.add(type); // Adiciona 'error' ou 'success'
        toastNotification.classList.add('show'); // Adiciona 'show' para ativar a animação

        // Define um timer para esconder o pop-up após 4 segundos
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    }

    /**
     * Função simples para validar o formato do e-mail
     * @param {string} email - O e-mail a ser validado.
     * @returns {boolean}
     */
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

});

