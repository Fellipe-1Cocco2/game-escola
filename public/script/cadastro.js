// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os elementos do formulário e o pop-up
    const form = document.getElementById('cadastro-form');
    const nomeInput = document.getElementById('Nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmeSenhaInput = document.getElementById('confirme-senha');
    const schoolSelect = document.getElementById('school-select'); // NOVO SELETOR
    const toastNotification = document.getElementById('toast-notification');
    let toastTimeout; // Variável para controlar o timer do pop-up

    // --- VERIFICAÇÃO ATUALIZADA ---
    if (!form || !nomeInput || !emailInput || !senhaInput || !confirmeSenhaInput || !schoolSelect || !toastNotification) {
        console.error("Erro Crítico: Um ou mais elementos do formulário não foram encontrados no DOM. Verifique os IDs no seu arquivo HTML (cadastro.html).");
        // IDs esperados: 'cadastro-form', 'Nome', 'email', 'senha', 'confirme-senha', 'school-select', 'toast-notification'
        return; // Impede que o resto do script seja executado
    }

    // --- NOVA FUNÇÃO: Buscar e popular escolas ---
    const loadSchools = async () => {
        try {
            // Usa a rota pública que criamos
            const response = await fetch('/api/users/schools');
            if (!response.ok) {
                throw new Error('Não foi possível carregar as escolas.');
            }
            const schools = await response.json();

            // Limpa opções antigas (exceto a primeira "Carregando...")
            schoolSelect.innerHTML = '<option value="" disabled selected>Selecione sua escola</option>';

            if (schools.length === 0) {
                 schoolSelect.innerHTML = '<option value="" disabled selected>Nenhuma escola cadastrada</option>';
                 schoolSelect.disabled = true; // Desabilita se não houver escolas
            } else {
                 schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school._id; // O valor será o ID da escola
                    option.textContent = school.name; // O texto será o nome
                    schoolSelect.appendChild(option);
                });
                schoolSelect.disabled = false; // Habilita o select
            }

        } catch (error) {
            console.error('Erro ao carregar escolas:', error);
            schoolSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar escolas</option>';
            schoolSelect.disabled = true;
            showToast(error.message || 'Erro ao buscar escolas.', 'error');
        }
    };
    // --- FIM DA NOVA FUNÇÃO ---


    // Adiciona um "ouvinte" para o evento de submissão do formulário
    form.addEventListener('submit', async (event) => { // Tornada async
        // Previne o comportamento padrão do formulário
        event.preventDefault();

        // Pega os valores dos inputs, removendo espaços em branco
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        const confirmeSenha = confirmeSenhaInput.value.trim();
        const selectedSchoolId = schoolSelect.value; // NOVO: Pega o ID da escola selecionada

        // 1. Validação: Verifica se algum campo está vazio
        // --- VALIDAÇÃO ATUALIZADA ---
        if (!nome || !email || !senha || !confirmeSenha || !selectedSchoolId) {
            let errorMessage = 'Por favor, preencha todos os campos.';
            if (!selectedSchoolId) {
                errorMessage = 'Por favor, selecione sua escola.';
            }
            showToast(errorMessage, 'error');
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

        // Mapeia os dados do formulário para o schema do backend
        const dadosUsuario = {
            name: nome,
            email: email,
            password: senha,
            schoolId: selectedSchoolId // NOVO: Inclui o ID da escola
        };

        console.log('Dados a serem enviados:', dadosUsuario);

        // Envia para o backend
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosUsuario),
            });

            const data = await response.json(); // Tenta ler a resposta JSON mesmo se não for OK

            if (!response.ok) {
                // Usa a mensagem de erro específica do backend, se houver
                throw new Error(data.message || `Erro ${response.status} no cadastro.`);
            }

            console.log('Sucesso:', data);
            showToast('Cadastro realizado com sucesso! Redirecionando para login...', 'success'); // MENSAGEM ATUALIZADA
            form.reset();
            // Limpa e recarrega as escolas no select após sucesso (opcional)
             schoolSelect.innerHTML = '<option value="" disabled selected>Selecione sua escola</option>';
             loadSchools();

            // --- REDIRECIONAMENTO ADICIONADO ---
            setTimeout(() => {
                window.location.href = '/login'; // Redireciona para a página de login
            }, 2000); // Aguarda 2 segundos para o usuário ler o toast

        } catch (error) {
            console.error('Erro no cadastro:', error);
            showToast(error.message || 'Não foi possível conectar ao servidor.', 'error');
        }
    });

    /**
     * Função para exibir o pop-up flutuante (toast)
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - 'error' ou 'success' para estilização.
     */
    function showToast(message, type = 'error') {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type, 'show');
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

    // --- NOVO: Chama a função para carregar as escolas ao iniciar a página ---
    loadSchools();

});

