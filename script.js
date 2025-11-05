document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---

    // Seções principais
    const gestaoClientes = document.getElementById('gestaoClientes');
    const gestaoContatos = document.getElementById('gestaoContatos');

    // Formulário Cliente
    const formCliente = document.getElementById('formCliente');
    const clienteIdInput = document.getElementById('clienteId');
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf'); // Seletor já existe
    const dataNascimentoInput = document.getElementById('data_nascimento');
    const enderecoInput = document.getElementById('endereco');
    const btnCancelarCliente = document.getElementById('btnCancelarCliente');

    // --- CÓDIGO DA MÁSCARA DE CPF (NOVO) ---
    cpfInput.addEventListener('input', (e) => {
        // 1. Pega o valor atual e remove tudo que não for dígito
        let value = e.target.value.replace(/\D/g, '');

        // 2. Limita o valor a 11 dígitos (tamanho de um CPF)
        value = value.substring(0, 11);

        // 3. Aplica a máscara dinamicamente
        
        // Adiciona o primeiro ponto (ex: 123.4)
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        // Adiciona o segundo ponto (ex: 123.456.7)
        value = value.replace(/(\d{3}\.\d{3})(\d)/, '$1.$2');
        // Adiciona o traço (ex: 123.456.789-01)
        value = value.replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})/, '$1-$2');

        // 4. Devolve o valor formatado para o input
        e.target.value = value;
    });
    // --- FIM DO CÓDIGO DA MÁSCARA ---

    // Lista Cliente
    const buscaClienteInput = document.getElementById('buscaCliente');
    const tabelaClientesBody = document.getElementById('tabelaClientes').querySelector('tbody');

    // Formulário Contato
    const formContato = document.getElementById('formContato');
    const nomeClienteContatos = document.getElementById('nomeClienteContatos');
    const contatoIdInput = document.getElementById('contatoId');
    const tipoInput = document.getElementById('tipo');
    const valorInput = document.getElementById('valor');
    const observacaoInput = document.getElementById('observacao');
    const btnCancelarContato = document.getElementById('btnCancelarContato');
    
    // Lista Contato
    const tabelaContatosBody = document.getElementById('tabelaContatos').querySelector('tbody');
    const btnVoltarClientes = document.getElementById('btnVoltarClientes');

    // --- ESTADO DA APLICAÇÃO (Simulação de BD) ---
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let contatos = JSON.parse(localStorage.getItem('contatos')) || [];
    let clienteEmEdicaoId = null;
    let contatoEmEdicaoId = null;
    let clienteVisaoContatosId = null;

    // --- FUNÇÕES DE PERSISTÊNCIA ---
    const salvarClientes = () => {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    };

    const salvarContatos = () => {
        localStorage.setItem('contatos', JSON.stringify(contatos));
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO (UI) ---

    /**
     * Renderiza a tabela de clientes (RF04)
     * Aplica filtro de busca (RF05)
     */
    const renderizarClientes = () => {
        tabelaClientesBody.innerHTML = '';
        const termoBusca = buscaClienteInput.value.toLowerCase();

        const clientesFiltrados = clientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(termoBusca) || 
            cliente.cpf.replace(/\D/g, '').includes(termoBusca.replace(/\D/g, '')) // Busca CPF sem máscara
        );

        clientesFiltrados.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.cpf}</td>
                <td>${formatarData(cliente.dataNascimento)}</td>
                <td>${cliente.endereco || ''}</td>
                <td class="acoes">
                    <button class="btn-contacts" data-id="${cliente.id}">Contatos (${getContatosCliente(cliente.id).length})</button>
                    <button class="btn-edit" data-id="${cliente.id}">Editar</button>
                    <button class="btn-delete" data-id="${cliente.id}">Excluir</button>
                </td>
            `;
            tabelaClientesBody.appendChild(tr);
        });
    };

    /**
     * Renderiza a tabela de contatos de um cliente específico (RF09)
     */
    const renderizarContatos = () => {
        tabelaContatosBody.innerHTML = '';
        if (clienteVisaoContatosId === null) return;

        const contatosDoCliente = getContatosCliente(clienteVisaoContatosId);

        contatosDoCliente.forEach(contato => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${contato.tipo}</td>
                <td>${contato.valor}</td>
                <td>${contato.observacao || ''}</td>
                <td class="acoes">
                    <button class="btn-edit" data-id="${contato.id}">Editar</button>
                    <button class="btn-delete" data-id="${contato.id}">Excluir</button>
                </td>
            `;
            tabelaContatosBody.appendChild(tr);
        });
    };

    // --- LÓGICA DE CLIENTES (RF01, RF02, RF03) ---

    formCliente.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const cpf = cpfInput.value.trim(); // O CPF já virá com a máscara
        const dataNascimento = dataNascimentoInput.value;
        const endereco = enderecoInput.value.trim();

        // Validações (RN01, RN04, RN05, RN08)
        if (!nome || !cpf) {
            alert("Nome e CPF são obrigatórios! (RN01, RN04)");
            return;
        }

        // Validação de CPF (comprimento)
        if (cpf.length !== 14) {
            alert("CPF inválido. Deve ter o formato 123.456.789-00.");
            return;
        }

        if (!dataNascimento || !isDataValida(dataNascimento)) {
             alert("Data de Nascimento inválida! (RN05)");
            return;
        }

        // Validação de CPF único (RN03)
        const cpfExiste = clientes.some(cliente => cliente.cpf === cpf && cliente.id !== clienteEmEdicaoId);
        if (cpfExiste) {
            alert("Este CPF já está cadastrado no sistema! (RN03)");
            return;
        }

        if (clienteEmEdicaoId) {
            // Editando cliente (RF02)
            const index = clientes.findIndex(c => c.id === clienteEmEdicaoId);
            if (index !== -1) {
                clientes[index] = { ...clientes[index], nome, cpf, dataNascimento, endereco };
            }
        } else {
            // Cadastrando novo cliente (RF01)
            const novoCliente = {
                id: Date.now(), // Simula um ID único
                nome,
                cpf,
                dataNascimento,
                endereco
            };
            clientes.push(novoCliente);
        }

        salvarClientes();
        renderizarClientes();
        resetarFormularioCliente();
    });

    // Ações na tabela de clientes (Editar, Excluir, Ver Contatos)
    tabelaClientesBody.addEventListener('click', (e) => {
        const target = e.target;
        const clienteId = parseInt(target.dataset.id);

        if (target.classList.contains('btn-edit')) {
            // Editar Cliente (RF02)
            prepararEdicaoCliente(clienteId);
        } else if (target.classList.contains('btn-delete')) {
            // Excluir Cliente (RF03)
            excluirCliente(clienteId);
        } else if (target.classList.contains('btn-contacts')) {
            // Ver Contatos (RF09)
            mostrarGestaoContatos(clienteId);
        }
    });

    const prepararEdicaoCliente = (id) => {
        const cliente = clientes.find(c => c.id === id);
        if (cliente) {
            clienteEmEdicaoId = id;
            clienteIdInput.value = id;
            nomeInput.value = cliente.nome;
            cpfInput.value = cliente.cpf;
            dataNascimentoInput.value = cliente.dataNascimento;
            enderecoInput.value = cliente.endereco;
            btnCancelarCliente.classList.remove('hidden');
            window.scrollTo(0, 0); // Rola para o topo
        }
    };

    const excluirCliente = (id) => {
        if (confirm("Tem certeza que deseja excluir este cliente? Todos os seus contatos também serão removidos. (RN07)")) {
            // Exclui cliente (RF03)
            clientes = clientes.filter(c => c.id !== id);
            
            // Exclui contatos associados (RN07)
            contatos = contatos.filter(c => c.clienteId !== id);
            
            salvarClientes();
            salvarContatos();
            renderizarClientes();
        }
    };

    btnCancelarCliente.addEventListener('click', resetarFormularioCliente);

    function resetarFormularioCliente() {
        clienteEmEdicaoId = null;
        formCliente.reset();
        btnCancelarCliente.classList.add('hidden');
    }

    // --- LÓGICA DE CONTATOS (RF06, RF07, RF08, RF09) ---

    const mostrarGestaoContatos = (clienteId) => {
        const cliente = clientes.find(c => c.id === clienteId);
        if (!cliente) return;

        clienteVisaoContatosId = clienteId;
        nomeClienteContatos.textContent = cliente.nome;

        gestaoClientes.classList.add('hidden');
        gestaoContatos.classList.remove('hidden');
        
        renderizarContatos();
        resetarFormularioContato();
    };

    btnVoltarClientes.addEventListener('click', () => {
        clienteVisaoContatosId = null;
        gestaoContatos.classList.add('hidden');
        gestaoClientes.classList.remove('hidden');
        renderizarClientes(); // Atualiza contagem de contatos
    });

    formContato.addEventListener('submit', (e) => {
        e.preventDefault();

        const tipo = tipoInput.value;
        const valor = valorInput.value.trim();
        const observacao = observacaoInput.value.trim();

        // Validação (RN02, RN08)
        if (!tipo || !valor) {
            alert("Tipo e Valor do Contato são obrigatórios! (RN02)");
            return;
        }

        if (contatoEmEdicaoId) {
            // Editando contato (RF07)
            const index = contatos.findIndex(c => c.id === contatoEmEdicaoId);
            if (index !== -1) {
                contatos[index] = { ...contatos[index], tipo, valor, observacao };
            }
        } else {
            // Cadastrando novo contato (RF06)
            const novoContato = {
                id: Date.now(), // Simula ID único
                clienteId: clienteVisaoContatosId,
                tipo,
                valor,
                observacao
            };
            contatos.push(novoContato);
        }

        salvarContatos();
        renderizarContatos();
        resetarFormularioContato();
    });

    // Ações na tabela de contatos (Editar, Excluir)
    tabelaContatosBody.addEventListener('click', (e) => {
        const target = e.target;
        const contatoId = parseInt(target.dataset.id);

        if (target.classList.contains('btn-edit')) {
            // Editar Contato (RF07)
            prepararEdicaoContato(contatoId);
        } else if (target.classList.contains('btn-delete')) {
            // Excluir Contato (RF08)
            excluirContato(contatoId);
        }
    });

    const prepararEdicaoContato = (id) => {
        const contato = contatos.find(c => c.id === id);
        if (contato) {
            contatoEmEdicaoId = id;
            contatoIdInput.value = id;
            tipoInput.value = contato.tipo;
            valorInput.value = contato.valor;
            observacaoInput.value = contato.observacao;
            btnCancelarContato.classList.remove('hidden');
        }
    };

    const excluirContato = (id) => {
        if (confirm("Tem certeza que deseja excluir este contato?")) {
            contatos = contatos.filter(c => c.id !== id);
            salvarContatos();
            renderizarContatos();
        }
    };

    btnCancelarContato.addEventListener('click', resetarFormularioContato);

    function resetarFormularioContato() {
        contatoEmEdicaoId = null;
        formContato.reset();
        btnCancelarContato.classList.add('hidden');
    }

    // --- FUNÇÕES UTILITÁRIAS ---

    const getContatosCliente = (clienteId) => {
        return contatos.filter(c => c.clienteId === clienteId);
    };

    const formatarData = (dataString) => {
        // Input: "YYYY-MM-DD" -> Output: "DD/MM/YYYY"
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const isDataValida = (dataString) => {
        const data = new Date(dataString);
        // Adiciona verificação para garantir que a data não é no futuro
        // e que é uma data real (ex: new Date('2023-02-31') é inválido)
        const hoje = new Date();
        hoje.setHours(0,0,0,0); // Zera a hora para comparar só o dia
        
        // new Date('YYYY-MM-DD') pode ter problemas com fuso horário, 
        // A forma mais segura é new Date('YYYY', 'MM' - 1, 'DD')
        const [ano, mes, dia] = dataString.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);

        // Verifica se a data "virou" (ex: 31/02 vira 03/03)
        if (dataObj.getFullYear() !== ano || dataObj.getMonth() !== mes - 1 || dataObj.getDate() !== dia) {
            return false;
        }

        return dataObj instanceof Date && !isNaN(dataObj) && dataObj <= hoje;
    };
    
    // --- INICIALIZAÇÃO ---
    renderizarClientes();
});