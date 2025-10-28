document.addEventListener('DOMContentLoaded', () => {

    // Função auxiliar para pegar elementos, com log de erro se não encontrado
    const getElement = (id, required = true) => {
        const el = document.getElementById(id);
        if (!el && required) {
            console.error(`ERRO CRÍTICO: Elemento com ID #${id} não encontrado.`);
        } else if (!el && !required) {
            console.warn(`Aviso: Elemento opcional com ID #${id} não encontrado.`);
        }
        return el;
    };

    const tabLinks = document.querySelectorAll('.tab-link'); // Certifique-se que tabLinks e tabPanes estão definidos
    const tabPanes = document.querySelectorAll('.tab-pane'); // ANTES destes loops
    // --- SELETORES DE ELEMENTOS ---
    const nomeSalaHeader = getElement('nome-sala-header');
    const nomeCriadorHeader = getElement('nome-criador-header');
    const codigoSalaDisplay = getElement('codigo-sala-display');
    const btnCopiarCodigo = getElement('btn-copiar-codigo');
    const listaTarefasAtivas = getElement('lista-tarefas-ativas');
    const listaTarefasEncerradas = getElement('lista-tarefas-encerradas');
    const listaAlunos = getElement('lista-alunos');
    const listaEditores = getElement('lista-editores'); // Verifique o ID no HTML!
    const btnAbrirModalTarefa = getElement('btn-abrir-modal-tarefa');
    const btnAbrirModalAluno = getElement('btn-abrir-modal-aluno');
    const modalNovaTarefa = getElement('modal-nova-tarefa');
    const formNovaTarefa = getElement('form-nova-tarefa');
    const modalNovoAluno = getElement('modal-novo-aluno');
    const formNovoAluno = getElement('form-novo-aluno');
    const modalEditarAluno = getElement('modal-editar-aluno');
    const formEditarAluno = getElement('form-editar-aluno');
    const modalExcluirAluno = getElement('modal-excluir-aluno');
    const btnConfirmarExclusaoAluno = getElement('btn-confirmar-exclusao-aluno');
    const formConvidarEditor = getElement('form-convidar-editor');
    const containerConvite = getElement('container-convite');
    const btnAbrirModalExcluirSala = getElement('btn-abrir-modal-excluir-sala');
    const modalExcluirSala = getElement('modal-excluir-sala');
    const btnConfirmarExclusaoSala = getElement('btn-confirmar-exclusao-sala');
    const btnAbrirModalVincular = getElement('btn-abrir-modal-vincular');
    const modalVincularAluno = getElement('modal-vincular-aluno');
    const formVincularAluno = getElement('form-vincular-aluno');
    const toastNotification = getElement('toast-notification');

    // Seletores de Importação
    const btnAbrirModalImportar = getElement('btn-abrir-modal-importar', false);
    const modalImportarAlunos = getElement('modal-importar-alunos', false);
    const formImportarAlunos = getElement('form-importar-alunos', false);
    const inputArquivoAlunos = getElement('input-arquivo-alunos', false);
    const checkboxCabecalho = getElement('checkbox-cabecalho', false);
    const previewAlunosImportar = getElement('preview-alunos-importar', false);
    const previewTabelaAlunosBody = document.querySelector('#preview-tabela-alunos tbody'); // Usa querySelector aqui
    const previewContadorAlunos = getElement('preview-contador-alunos', false);
    const loadingImportarAlunos = getElement('loading-importar-alunos', false);
    const btnConfirmarImportacao = getElement('btn-confirmar-importacao', false);
    const btnsFecharModalImportar = document.querySelectorAll('.btn-fechar-modal-importar');

    // Seletores Chat IA
    const btnAbrirChatIA = getElement('btn-abrir-chat-ia', false);
    const modalChatIA = getElement('modal-chat-ia', false);
    // Usa querySelector para o botão fechar DENTRO do modal IA
    const btnFecharChatIA = modalChatIA ? modalChatIA.querySelector('.btn-fechar-modal') : null;
    const chatCorpo = getElement('chat-ia-corpo', false);
    const formChatIA = getElement('form-chat-ia', false);
    const inputChatIA = getElement('input-chat-ia', false);
    const btnEnviarChatIA = getElement('btn-enviar-chat-ia', false);

    // Estado
    let toastTimeout;
    let salaAtual = null;
    let professorLogado = null;
    let alunoParaExcluirId = null;
    const salaId = window.location.pathname.split('/').pop();
    let alunosParaImportar = [];
    let historicoChatIA = [];

    // Verificação inicial se elementos críticos existem
    if (!nomeSalaHeader || !listaAlunos || !modalNovaTarefa || !listaTarefasAtivas || !listaTarefasEncerradas) {
        console.error("Erro crítico: Elementos essenciais da página não foram encontrados. Verifique os IDs no sala.html.");
        // Poderia desabilitar funcionalidades ou mostrar mensagem ao usuário
        return; // Interrompe a execução se elementos cruciais faltam
    }


        document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            console.log(`Clicou na aba principal: ${tabId}`); // LOG 1: Verifica clique

            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            link.classList.add('active');
            const targetPane = document.getElementById(`tab-${tabId}`);

            // LOG 2: Verifica se o painel foi encontrado
            if (targetPane) {
                console.log(`Encontrou o painel #tab-${tabId}, adicionando classe 'active'.`);
                targetPane.classList.add('active');
            } else {
                console.error(`ERRO: Painel com ID #tab-${tabId} NÃO encontrado! Verifique o HTML.`);
            }
        });
    });

// --- LÓGICA DAS SUB-ABAS (TAREFAS) ---
// Adicione os console.log aqui
    document.querySelectorAll('.sub-tab-link').forEach(link => {
        link.addEventListener('click', () => {
            const subTabId = link.getAttribute('data-subtab');
            console.log(`Clicou na sub-aba: ${subTabId}`); // LOG 3: Verifica clique

            document.querySelectorAll('.sub-tab-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.sub-tab-pane').forEach(p => p.classList.remove('active'));

            link.classList.add('active');
            const targetSubPane = document.getElementById(`sub-tab-${subTabId}`);

            // LOG 4: Verifica se o sub-painel foi encontrado
            if (targetSubPane) {
                console.log(`Encontrou o sub-painel #sub-tab-${subTabId}, adicionando classe 'active'.`);
                targetSubPane.classList.add('active');
            } else {
                console.error(`ERRO: Sub-painel com ID #sub-tab-${subTabId} NÃO encontrado! Verifique o HTML.`);
            }
        });
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderAlunos = (alunos, podeEditar) => {
        if (!listaAlunos) return;
        listaAlunos.innerHTML = '';
        if (!alunos || alunos.length === 0) {
            listaAlunos.innerHTML = '<div class="lista-item">Nenhum aluno cadastrado.</div>';
            return;
        }
        alunos.forEach(aluno => {
            const item = document.createElement('div');
            item.className = 'lista-item';
            item.innerHTML = `<div class="lista-item-info"><span>${aluno.nome}</span><small>RA: ${aluno.RA}</small></div>`;
            if (podeEditar) {
                const acoesDiv = document.createElement('div');
                acoesDiv.className = 'lista-item-actions';
                // Adicione os data-feather attributes aos seus SVGs/ícones aqui, como antes
                acoesDiv.innerHTML = `
                    <button class="btn-action-icon edit" data-aluno-id="${aluno._id}" data-aluno-nome="${aluno.nome}" data-aluno-ra="${aluno.RA}">
                        <i data-feather="edit-2"></i> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    <button class="btn-action-icon delete" data-aluno-id="${aluno._id}">
                        <i data-feather="trash-2"></i> <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0,0,256,256">
<g fill="#20c997" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(10.66667,10.66667)"><path d="M19.17188,2c-0.72375,0 -1.4475,0.27562 -2,0.82813l-1.17187,1.17188l4,4l1.17188,-1.17187c1.104,-1.104 1.104,-2.895 0,-4c-0.5525,-0.5525 -1.27625,-0.82812 -2,-0.82812zM14.5,5.5l-11.5,11.5v4h4l11.5,-11.5z"></path></g></g>
</svg>
                    </button>
                `;
                item.appendChild(acoesDiv);
            }
            listaAlunos.appendChild(item);
        });

        // --- ADICIONE ESTA LINHA ---
        // Chama o Feather Icons para renderizar os ícones recém-adicionados
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        // --- FIM DA ADIÇÃO ---
    };

    const renderTarefas = (tarefas) => {
        if (!listaTarefasAtivas || !listaTarefasEncerradas) return;
        listaTarefasAtivas.innerHTML = '';
        listaTarefasEncerradas.innerHTML = '';

        if (!tarefas || tarefas.length === 0) {
            listaTarefasAtivas.innerHTML = '<div class="lista-item">Nenhuma tarefa cadastrada.</div>';
            listaTarefasEncerradas.innerHTML = '<div class="lista-item">Nenhuma tarefa encerrada.</div>';
            return;
        }
        // ... (resto da lógica de renderTarefas que você já tem) ...
         const agora = new Date();
         const tarefasAtivas = [];
         const tarefasEncerradas = [];

         tarefas.forEach(tarefa => {
            let encerrada = false;
            if (tarefa.dataFechamento) {
                const horaEncerramento = tarefa.horaFechamento || '23:59:59';
                const dataEncerramento = new Date(`${tarefa.dataFechamento.split('T')[0]}T${horaEncerramento}`);
                if (!isNaN(dataEncerramento) && agora > dataEncerramento) {
                    encerrada = true;
                }
            }
            if (encerrada) {
                tarefasEncerradas.push(tarefa);
            } else {
                tarefasAtivas.push(tarefa);
            }
         });

         const criarItemTarefa = (tarefa) => {
             const linkTarefa = document.createElement('a');
             linkTarefa.className = 'lista-item-link';
             linkTarefa.href = `/tarefa/${tarefa._id}/sala/${salaId}`;
             const dataInfo = tarefa.dataFechamento ? `Fecha em: ${new Date(tarefa.dataFechamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às ${tarefa.horaFechamento || ''}` : 'Sem data de fechamento';
             const avisoSemPerguntas = (!tarefa.perguntas || tarefa.perguntas.length === 0) ? '<span class="sem-perguntas-tag">⚠️ Sem Perguntas</span>' : '';
             linkTarefa.innerHTML = `<div class="lista-item-info"><span>${tarefa.titulo || 'Tarefa s/ título'} ${avisoSemPerguntas}</span><small>${dataInfo}</small></div><div class="lista-item-arrow">&rarr;</div>`;
             return linkTarefa;
         };

         if (tarefasAtivas.length === 0) listaTarefasAtivas.innerHTML = '<div class="lista-item">Nenhuma tarefa ativa.</div>';
         else {
             tarefasAtivas.sort((a, b) => (a.dataFechamento ? new Date(a.dataFechamento) : Infinity) - (b.dataFechamento ? new Date(b.dataFechamento) : Infinity));
             tarefasAtivas.forEach(tarefa => listaTarefasAtivas.appendChild(criarItemTarefa(tarefa)));
         }

         if (tarefasEncerradas.length === 0) listaTarefasEncerradas.innerHTML = '<div class="lista-item">Nenhuma tarefa encerrada.</div>';
         else {
             tarefasEncerradas.sort((a, b) => new Date(b.dataFechamento) - new Date(a.dataFechamento));
             tarefasEncerradas.forEach(tarefa => listaTarefasEncerradas.appendChild(criarItemTarefa(tarefa)));
         }
    };

    const renderEditores = (editores) => {
        if (!listaEditores) return; // Segurança extra
        listaEditores.innerHTML = '';
        if (!editores || editores.length === 0) {
            listaEditores.innerHTML = '<div class="lista-item">Nenhum editor convidado.</div>';
            return;
        }
        editores.forEach(editor => {
            const item = document.createElement('div');
            item.className = 'lista-item';
            // Garante que o nome existe
            item.textContent = (editor && editor.name) ? editor.name : 'Editor sem nome';
            listaEditores.appendChild(item);
        });
    };

    // --- LÓGICA PRINCIPAL ---
    const fetchSalaData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        try {
            const [salaRes, meRes] = await Promise.all([
                fetch(`/api/game/salas/${salaId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

             // Tratamento de erro aprimorado
            if (!salaRes.ok) throw new Error(`Falha ao buscar sala: ${salaRes.status}`);
            if (!meRes.ok) throw new Error(`Falha ao buscar dados do professor: ${meRes.status}`);

            salaAtual = await salaRes.json();
            professorLogado = await meRes.json();

            // Verificações para evitar erros se dados estiverem incompletos
            const isCriador = salaAtual && salaAtual.criador && professorLogado && professorLogado._id === salaAtual.criador._id;
            const isEditor = isCriador || (salaAtual && salaAtual.editoresConvidados && professorLogado && salaAtual.editoresConvidados.some(e => e && e._id === professorLogado._id));

            if (nomeSalaHeader) nomeSalaHeader.textContent = salaAtual?.num_serie || 'Sala sem nome';
            if (nomeCriadorHeader) nomeCriadorHeader.textContent = `por ${salaAtual?.criador?.name || 'Desconhecido'}`;
            if (codigoSalaDisplay) codigoSalaDisplay.textContent = salaAtual?.codigoCurto || 'N/A';

            renderTarefas(salaAtual?.tarefas);
            renderAlunos(salaAtual?.alunos, isEditor);
            renderEditores(salaAtual?.editoresConvidados);

            // Controla visibilidade de botões com segurança
            if (containerConvite && isCriador) containerConvite.style.display = 'grid';
            if (btnAbrirModalExcluirSala && isCriador) btnAbrirModalExcluirSala.style.display = 'flex';
            if (btnAbrirModalTarefa && isEditor) btnAbrirModalTarefa.style.display = 'block';
            if (btnAbrirModalAluno && isEditor) btnAbrirModalAluno.style.display = 'block';
            // Botões de importação/vínculo também dependem de ser editor
            if (btnAbrirModalVincular && isEditor) btnAbrirModalVincular.style.display = 'inline-flex'; // Ajuste conforme seu CSS
            if (btnAbrirModalImportar && isEditor) btnAbrirModalImportar.style.display = 'inline-flex'; // Ajuste conforme seu CSS

        } catch (error) {
            console.error("Erro ao carregar dados da sala:", error);
            showToast(`Não foi possível carregar os dados da sala: ${error.message}`, 'error');
            // Poderia limpar a tela ou mostrar mensagens de erro nos elementos
            if (nomeSalaHeader) nomeSalaHeader.textContent = 'Erro ao carregar';
            // ... limpar outras listas ...
        }
    };

    // --- FUNÇÕES MODAIS (Importação) ---
    const abrirModalImportar = () => {
        if (!modalImportarAlunos) return;
        if (formImportarAlunos) formImportarAlunos.reset();
        alunosParaImportar = [];
        if (previewAlunosImportar) previewAlunosImportar.classList.add('hidden');
        if (previewTabelaAlunosBody) previewTabelaAlunosBody.innerHTML = '';
        if (btnConfirmarImportacao) btnConfirmarImportacao.disabled = true;
        if (loadingImportarAlunos) loadingImportarAlunos.classList.add('hidden');
        modalImportarAlunos.style.display = 'flex';
    };
    const fecharModalImportar = () => {
        if (modalImportarAlunos) modalImportarAlunos.style.display = 'none';
    };

    const handleArquivoSelecionado = (event) => {
        const file = event.target.files[0];
        if (!file || !previewTabelaAlunosBody || !btnConfirmarImportacao) return;

        // ... (reset do preview) ...
        alunosParaImportar = [];
        previewTabelaAlunosBody.innerHTML = '';
        if (previewAlunosImportar) previewAlunosImportar.classList.add('hidden');
        btnConfirmarImportacao.disabled = true;

        const reader = new FileReader();

        reader.onload = (e) => {
            const arrayBuffer = e.target.result; // O resultado é um ArrayBuffer
            try {
                let workbook;
                let fileContentAsString = ''; // Para logging

                // --- PRIORIZA LEITURA COMO UTF-8 PARA CSV ---
                if (file.name.toLowerCase().endsWith('.csv')) {
                    try {
                        console.log("Tentando decodificar CSV como UTF-8...");
                        const decoder = new TextDecoder('utf-8'); // *** TENTA UTF-8 PRIMEIRO ***
                        fileContentAsString = decoder.decode(arrayBuffer);
                        console.log("Texto decodificado (UTF-8):", fileContentAsString.substring(0, 100)); // Loga os primeiros 100 chars
                        // Passa a string UTF-8 decodificada para SheetJS
                        workbook = XLSX.read(fileContentAsString, { type: 'string' });
                        console.log("CSV lido com sucesso como string UTF-8.");
                    } catch (utf8Error) {
                        console.warn("Falha ao decodificar/ler CSV como UTF-8 string. Tentando fallback com ArrayBuffer (SheetJS pode adivinhar):", utf8Error);
                        // Fallback: Se UTF-8 falhar (improvável para texto visível), tenta direto do buffer
                        try {
                            workbook = XLSX.read(arrayBuffer, { type: 'array' }); // Deixa SheetJS tentar
                            // Log fallback text attempt (talvez como Latin1 para ver?)
                            try { fileContentAsString = new TextDecoder('iso-8859-1').decode(arrayBuffer); console.log("Texto (fallback Latin1):", fileContentAsString.substring(0,100)); } catch {}
                        } catch (fallbackError) {
                            console.error("Erro no fallback de leitura do CSV:", fallbackError);
                            throw new Error("Não foi possível ler o arquivo CSV. Verifique o formato e a codificação.");
                        }
                    }
                } else { // Para XLSX
                    console.log("Lendo arquivo não-CSV como ArrayBuffer...");
                    workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    // Log XLSX text attempt (pode ser binário)
                    try { fileContentAsString = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer); console.log("Texto (XLSX, pode ser binário):", fileContentAsString.substring(0, 100)); } catch {}
                }
                // --- FIM DA LÓGICA DE LEITURA ---

                if (!workbook) { // Verifica se workbook foi criado
                    throw new Error("Não foi possível processar o arquivo.");
                }

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

                if (!jsonData || jsonData.length === 0) {
                    throw new Error('Planilha vazia ou formato não reconhecido.');
                }

                // ... (resto da lógica de parse, filtro e preview - SEM ALTERAÇÕES) ...
                const temCabecalho = checkboxCabecalho ? checkboxCabecalho.checked : false;
                const dadosAlunosRaw = (temCabecalho && jsonData.length > 0) ? jsonData.slice(1) : jsonData;

                alunosParaImportar = dadosAlunosRaw
                    .map(row => ({ nome: String(row[0] || '').trim(), RA: String(row[1] || '').trim() }))
                    .filter(aluno => aluno.nome && aluno.RA);

                console.log("Alunos parseados FINAL:", alunosParaImportar); // <<< Verifique os acentos aqui

                if (alunosParaImportar.length === 0) {
                    throw new Error('Nenhum aluno válido encontrado (verifique Nome e RA nas colunas 1 e 2).');
                }
                // ... (atualiza preview) ...
                if (previewTabelaAlunosBody) {
                    previewTabelaAlunosBody.innerHTML = '';
                    const previewRows = alunosParaImportar.slice(0, 5);
                    previewRows.forEach(aluno => {
                        const tr = previewTabelaAlunosBody.insertRow();
                        const nomeCell = tr.insertCell();
                        const raCell = tr.insertCell();
                        nomeCell.textContent = aluno.nome; // Deve mostrar acento correto
                        raCell.textContent = aluno.RA;
                    });
                }
                if (previewContadorAlunos) previewContadorAlunos.textContent = `Total de ${alunosParaImportar.length} alunos detectados.`;
                if (previewAlunosImportar) previewAlunosImportar.classList.remove('hidden');
                if (btnConfirmarImportacao) btnConfirmarImportacao.disabled = false;


            } catch (error) {
                console.error("Erro ao ler/parsear:", error);
                showToast(`Erro ao processar: ${error.message}`, 'error');
                if (formImportarAlunos) formImportarAlunos.reset();
            }
        };

        reader.onerror = (error) => {
            console.error("Erro ao ler arquivo:", error);
            showToast('Não foi possível ler o arquivo selecionado.', 'error');
        };

        // Mantém a leitura como ArrayBuffer
        reader.readAsArrayBuffer(file);
    };

    const handleConfirmarImportacao = async (event) => {
        event.preventDefault();
        if (alunosParaImportar.length === 0 || !loadingImportarAlunos || !btnConfirmarImportacao) return;

        loadingImportarAlunos.classList.remove('hidden');
        btnConfirmarImportacao.disabled = true;
        btnsFecharModalImportar.forEach(btn => btn.disabled = true);

        const result = await sendRequest(
            `/api/game/salas/${salaId}/alunos/importar`, 'POST', { alunos: alunosParaImportar }
            // A mensagem de sucesso agora vem do backend no 'result.message'
        );

        loadingImportarAlunos.classList.add('hidden');
        btnsFecharModalImportar.forEach(btn => btn.disabled = false);

        if (result && result.message) { // Usa a mensagem do backend
            showToast(result.message, 'success'); // Mostra o resumo
            fecharModalImportar();
            // fetchSalaData(); // sendRequest já chama fetchSalaData no sucesso
        } else if (result === false) { // Se sendRequest retornar false em erro
            btnConfirmarImportacao.disabled = false; // Permite tentar novamente
        } else { // Caso inesperado
             showToast('Importação concluída, mas resposta inesperada.', 'info');
             fecharModalImportar();
        }
    };

    // --- FUNÇÕES AUXILIARES ---
    const sendRequest = async (url, method, body, successMsg = null, redirectOnSuccess = false) => { // Tornar successMsg opcional
        const token = localStorage.getItem('token');
        try {
            const options = {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: body ? JSON.stringify(body) : null
            };
            if (body) options.headers['Content-Type'] = 'application/json';

            const response = await fetch(url, options);

            // Tratamento especial para DELETE sucesso (sem corpo JSON)
            if (method === 'DELETE' && (response.status === 200 || response.status === 204)) {
                showToast(successMsg || 'Exclusão bem-sucedida!', 'success'); // Usa msg padrão se não fornecida
                if (redirectOnSuccess) setTimeout(() => window.location.href = '/dashboard', 1500);
                else fetchSalaData(); // Recarrega se não redirecionar
                return true; // Indica sucesso
            }

            const data = await response.json(); // Lê o corpo para outros casos
            if (!response.ok) throw new Error(data.message || `Erro ${response.status}`);

             // Usa a mensagem de sucesso da resposta se existir (para importação), senão usa a padrão
            showToast(data.message || successMsg || 'Operação bem-sucedida!', 'success');

            if (redirectOnSuccess && method !== 'DELETE') { // Redireciona se necessário
                 setTimeout(() => window.location.href = '/dashboard', 1500);
            } else if (method !== 'DELETE') { // Recarrega dados se não for redirecionar ou DELETE
                 fetchSalaData();
            }
             return data; // Retorna os dados recebidos (útil para importação)

        } catch (error) {
            console.error('Erro na requisição:', error);
            const errorMsg = error.message || 'Ocorreu um erro desconhecido.';
             showToast(errorMsg, 'error');
            // Tratamento de erro 401 (não autorizado/token expirado)
             if (error.message.includes('401') || response?.status === 401) { // Checa status se disponível
                 setTimeout(() => window.location.href = '/login', 2000);
             }
             return false; // Indica falha explicitamente
        }
    };

    const showToast = (message, type = 'success') => { 
        if (!toastNotification) return; // Não tenta mostrar se não existe
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.className = 'toast-notification'; 
        
        if (type === 'success') toastNotification.classList.add('success');
        else if (type === 'info') toastNotification.classList.add('info'); 
        else toastNotification.classList.add('error');
        
        toastNotification.classList.add('show');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000); 
    };
    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        // Modais básicos
        if (btnAbrirModalTarefa && modalNovaTarefa) btnAbrirModalTarefa.addEventListener('click', () => modalNovaTarefa.style.display = 'flex');
        if (btnAbrirModalAluno && modalNovoAluno) btnAbrirModalAluno.addEventListener('click', () => modalNovoAluno.style.display = 'flex');
        if (btnAbrirModalExcluirSala && modalExcluirSala) btnAbrirModalExcluirSala.addEventListener('click', () => modalExcluirSala.style.display = 'flex');
        if (btnAbrirModalVincular && modalVincularAluno) btnAbrirModalVincular.addEventListener('click', () => modalVincularAluno.style.display = 'flex');

        // Botões de fechar genéricos
        document.querySelectorAll('.btn-fechar-modal').forEach(btn => {
            btn.addEventListener('click', (e) => e.target.closest('.modal-overlay').style.display = 'none');
        });

        // Formulários
        if (formNovaTarefa) formNovaTarefa.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo-tarefa').value.trim();
            const data = document.getElementById('data-fechamento-tarefa').value;
            const hora = document.getElementById('hora-fechamento-tarefa').value;
            if (!titulo || !data || !hora) return showToast('Preencha todos os campos da tarefa.', 'error'); // Validação
            await sendRequest(`/api/game/salas/${salaId}/tarefas`, 'POST', { titulo, dataFechamento: data, horaFechamento: hora }, 'Tarefa criada!');
            formNovaTarefa.reset();
            if (modalNovaTarefa) modalNovaTarefa.style.display = 'none';
        });

        if (formNovoAluno) formNovoAluno.addEventListener('submit', async (e) => {
             e.preventDefault();
             const nome = document.getElementById('nome-aluno-form').value.trim();
             const RA = document.getElementById('ra-aluno-form').value.trim();
             if (!nome || !RA) return;
             await sendRequest(`/api/game/salas/${salaId}/alunos`, 'POST', { nome, RA }, 'Aluno cadastrado!');
             formNovoAluno.reset();
             if(modalNovoAluno) modalNovoAluno.style.display = 'none';
        });

        if (formVincularAluno) formVincularAluno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const RA = document.getElementById('ra-aluno-vincular-form').value.trim();
            if (!RA) return;
            await sendRequest(`/api/game/salas/${salaId}/alunos/vincular`, 'PUT', { RA }, 'Aluno vinculado!');
            formVincularAluno.reset();
            if (modalVincularAluno) modalVincularAluno.style.display = 'none';
        });

        if (formEditarAluno) formEditarAluno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('id-aluno-editar').value;
            const nome = document.getElementById('nome-aluno-editar').value.trim();
            const RA = document.getElementById('ra-aluno-editar').value.trim();
            if (!id || !nome || !RA) return;
            await sendRequest(`/api/game/salas/${salaId}/alunos/${id}`, 'PUT', { nome, RA }, 'Aluno atualizado!');
            if (modalEditarAluno) modalEditarAluno.style.display = 'none';
        });

        if (formConvidarEditor) formConvidarEditor.addEventListener('submit', async (e) => {
             e.preventDefault();
             const email = document.getElementById('email-convidado').value.trim();
             if (!email) return;
             await sendRequest(`/api/game/salas/${salaId}/convidar`, 'POST', { emailConvidado: email }, 'Convite enviado!');
             formConvidarEditor.reset();
        });

        // Botões de confirmação
        if (btnConfirmarExclusaoAluno) btnConfirmarExclusaoAluno.addEventListener('click', async () => {
            if (!alunoParaExcluirId) return;
            await sendRequest(`/api/game/salas/${salaId}/alunos/${alunoParaExcluirId}`, 'DELETE', null, 'Aluno desvinculado!');
            if (modalExcluirAluno) modalExcluirAluno.style.display = 'none';
            alunoParaExcluirId = null; // Limpa o ID
        });

        if (btnConfirmarExclusaoSala) btnConfirmarExclusaoSala.addEventListener('click', async () => {
            await sendRequest(`/api/game/salas/${salaId}`, 'DELETE', null, 'Sala excluída!', true); // true para redirecionar
        });

        // Lista de Alunos (Delegação de evento)
        if (listaAlunos) listaAlunos.addEventListener('click', (e) => {
            const btnEditar = e.target.closest('.edit');
            const btnExcluir = e.target.closest('.delete');
            if (btnEditar && modalEditarAluno) {
                document.getElementById('id-aluno-editar').value = btnEditar.dataset.alunoId;
                document.getElementById('nome-aluno-editar').value = btnEditar.dataset.alunoNome;
                document.getElementById('ra-aluno-editar').value = btnEditar.dataset.alunoRa;
                modalEditarAluno.style.display = 'flex';
            }
            if (btnExcluir && modalExcluirAluno) {
                alunoParaExcluirId = btnExcluir.dataset.alunoId;
                modalExcluirAluno.style.display = 'flex';
            }
        });

        // Botão Copiar Código
        if (btnCopiarCodigo && codigoSalaDisplay) btnCopiarCodigo.addEventListener('click', () => {
            const codigo = codigoSalaDisplay.textContent;
            if (codigo && codigo !== '...' && codigo !== 'N/A') {
                navigator.clipboard.writeText(codigo).then(() => showToast('Código copiado!', 'success'), () => showToast('Falha ao copiar.', 'error'));
            }
        });

        // --- Listeners de Importação ---
        if (btnAbrirModalImportar) btnAbrirModalImportar.addEventListener('click', abrirModalImportar);
        btnsFecharModalImportar.forEach(btn => btn.addEventListener('click', fecharModalImportar));
        if (modalImportarAlunos) modalImportarAlunos.addEventListener('click', (e) => { if (e.target === modalImportarAlunos) fecharModalImportar(); });
        if (inputArquivoAlunos) inputArquivoAlunos.addEventListener('change', handleArquivoSelecionado);
        if (checkboxCabecalho && inputArquivoAlunos) checkboxCabecalho.addEventListener('change', () => { if (inputArquivoAlunos.files.length > 0) inputArquivoAlunos.dispatchEvent(new Event('change')); });
        if (formImportarAlunos) formImportarAlunos.addEventListener('submit', handleConfirmarImportacao);

        // --- Listeners Chat IA ---
        if (btnAbrirChatIA && modalChatIA) btnAbrirChatIA.addEventListener('click', () => {
             modalChatIA.style.display = 'flex';
             if (historicoChatIA.length === 0 && chatCorpo) { // Inicia conversa se vazia
                 const msgInicial = "Olá! Vamos criar um quiz. Qual é o tópico?";
                 adicionarMensagemAoChat('model', msgInicial);
                 historicoChatIA.push({ role: 'model', text: JSON.stringify({ status: "incompleto", proximaPergunta: msgInicial }) });
             }
        });

        // Listener de fechar Chat IA (Delegação)
        if (modalChatIA) modalChatIA.addEventListener('click', (e) => {
             if (e.target.classList.contains('btn-fechar-modal')) {
                 modalChatIA.style.display = 'none';
             }
        });

        if (formChatIA && inputChatIA && btnEnviarChatIA && chatCorpo) formChatIA.addEventListener('submit', async (e) => {
             e.preventDefault();
             const textoUsuario = inputChatIA.value.trim();
             if (!textoUsuario) return;

             adicionarMensagemAoChat('user', textoUsuario);
             historicoChatIA.push({ role: 'user', text: textoUsuario });
             inputChatIA.value = '';
             btnEnviarChatIA.disabled = true;

             const token = localStorage.getItem('token');
             try {
                const response = await fetch(`/api/game/salas/${salaId}/ai/gerar-tarefa`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ historicoChat: historicoChatIA })
                });
                const aiResponse = await response.json();
                if (!response.ok) throw new Error(aiResponse.message || 'Erro na IA');

                historicoChatIA.push({ role: 'model', text: JSON.stringify(aiResponse) });

                if (aiResponse.status === 'incompleto') {
                    adicionarMensagemAoChat('model', aiResponse.proximaPergunta);
                } else if (aiResponse.status === 'completo') {
                    adicionarMensagemAoChat('model', 'Tarefa criada! As perguntas foram geradas.');
                    // fetchSalaData(); // sendRequest já recarrega
                    setTimeout(() => {
                        if (modalChatIA) modalChatIA.style.display = 'none';
                        historicoChatIA = []; // Reseta
                    }, 2000);
                }
             } catch (error) {
                 adicionarMensagemAoChat('model', `Erro: ${error.message}`);
             }
             btnEnviarChatIA.disabled = false;
        });

         // Função para adicionar mensagem no chat (necessária aqui se não for global)
         const adicionarMensagemAoChat = (remetente, texto) => {
             if (!chatCorpo) return;
             const msgDiv = document.createElement('div');
             msgDiv.className = `chat-msg ${remetente}`;
             msgDiv.textContent = texto;
             chatCorpo.appendChild(msgDiv);
             chatCorpo.scrollTop = chatCorpo.scrollHeight;
         };
    };

    // --- INICIALIZAÇÃO ---
    fetchSalaData(); // Busca os dados iniciais
    setupEventListeners(); // Configura todos os listeners

}); // Fim do DOMContentLoaded