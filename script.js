document.addEventListener('DOMContentLoaded', () => {
 


    const gestaoClientes = document.getElementById('gestaoClientes');
    const gestaoContatos = document.getElementById('gestaoContatos');


    const formCliente = document.getElementById('formCliente');
    const clienteIdInput = document.getElementById('clienteId');
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf');
    const dataNascimentoInput = document.getElementById('data_nascimento');
    const enderecoInput = document.getElementById('endereco');
    const btnCancelarCliente = document.getElementById('btnCancelarCliente');


    cpfInput.addEventListener('input', (e) => {

        let value = e.target.value.replace(/\D/g, '');


        value = value.substring(0, 11);


        

        value = value.replace(/(\d{3})(\d)/, '$1.$2');

        value = value.replace(/(\d{3}\.\d{3})(\d)/, '$1.$2');

        value = value.replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})/, '$1-$2');


        e.target.value = value;
    });



    const buscaClienteInput = document.getElementById('buscaCliente');
    const tabelaClientesBody = document.getElementById('tabelaClientes').querySelector('tbody');

 
    const formContato = document.getElementById('formContato');
    const nomeClienteContatos = document.getElementById('nomeClienteContatos');
    const contatoIdInput = document.getElementById('contatoId');
    const tipoInput = document.getElementById('tipo');
    const valorInput = document.getElementById('valor');
    const observacaoInput = document.getElementById('observacao');
    const btnCancelarContato = document.getElementById('btnCancelarContato');
    

    const tabelaContatosBody = document.getElementById('tabelaContatos').querySelector('tbody');
    const btnVoltarClientes = document.getElementById('btnVoltarClientes');


    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let contatos = JSON.parse(localStorage.getItem('contatos')) || [];
    let clienteEmEdicaoId = null;
    let contatoEmEdicaoId = null;
    let clienteVisaoContatosId = null;


    const salvarClientes = () => {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    };

    const salvarContatos = () => {
        localStorage.setItem('contatos', JSON.stringify(contatos));
    };







    const renderizarClientes = () => {
        tabelaClientesBody.innerHTML = '';
        const termoBusca = buscaClienteInput.value.toLowerCase();

        const clientesFiltrados = clientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(termoBusca) || 
            cliente.cpf.replace(/\D/g, '').includes(termoBusca.replace(/\D/g, ''))
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



    formCliente.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const cpf = cpfInput.value.trim(); 
        const dataNascimento = dataNascimentoInput.value;
        const endereco = enderecoInput.value.trim();


        if (!nome || !cpf) {
            alert("Nome e CPF são obrigatórios! (RN01, RN04)");
            return;
        }


        if (cpf.length !== 14) {
            alert("CPF inválido. Deve ter o formato 123.456.789-00.");
            return;
        }

        if (!dataNascimento || !isDataValida(dataNascimento)) {
             alert("Data de Nascimento inválida! (RN05)");
            return;
        }


        const cpfExiste = clientes.some(cliente => cliente.cpf === cpf && cliente.id !== clienteEmEdicaoId);
        if (cpfExiste) {
            alert("Este CPF já está cadastrado no sistema! (RN03)");
            return;
        }

        if (clienteEmEdicaoId) {

            const index = clientes.findIndex(c => c.id === clienteEmEdicaoId);
            if (index !== -1) {
                clientes[index] = { ...clientes[index], nome, cpf, dataNascimento, endereco };
            }
        } else {

            const novoCliente = {
                id: Date.now(),
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


    tabelaClientesBody.addEventListener('click', (e) => {
        const target = e.target;
        const clienteId = parseInt(target.dataset.id);

        if (target.classList.contains('btn-edit')) {

            prepararEdicaoCliente(clienteId);
        } else if (target.classList.contains('btn-delete')) {

            excluirCliente(clienteId);
        } else if (target.classList.contains('btn-contacts')) {

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
            window.scrollTo(0, 0); 
        }
    };

    const excluirCliente = (id) => {
        if (confirm("Tem certeza que deseja excluir este cliente? Todos os seus contatos também serão removidos. (RN07)")) {

            clientes = clientes.filter(c => c.id !== id);
            

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
        renderizarClientes();
    });

    formContato.addEventListener('submit', (e) => {
        e.preventDefault();

        const tipo = tipoInput.value;
        const valor = valorInput.value.trim();
        const observacao = observacaoInput.value.trim();


        if (!tipo || !valor) {
            alert("Tipo e Valor do Contato são obrigatórios! (RN02)");
            return;
        }

        if (contatoEmEdicaoId) {

            const index = contatos.findIndex(c => c.id === contatoEmEdicaoId);
            if (index !== -1) {
                contatos[index] = { ...contatos[index], tipo, valor, observacao };
            }
        } else {

            const novoContato = {
                id: Date.now(),
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


    tabelaContatosBody.addEventListener('click', (e) => {
        const target = e.target;
        const contatoId = parseInt(target.dataset.id);

        if (target.classList.contains('btn-edit')) {

            prepararEdicaoContato(contatoId);
        } else if (target.classList.contains('btn-delete')) {

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



    const getContatosCliente = (clienteId) => {
        return contatos.filter(c => c.clienteId === clienteId);
    };

    const formatarData = (dataString) => {

        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const isDataValida = (dataString) => {
        const data = new Date(dataString);

        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        

        const [ano, mes, dia] = dataString.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);


        if (dataObj.getFullYear() !== ano || dataObj.getMonth() !== mes - 1 || dataObj.getDate() !== dia) {
            return false;
        }

        return dataObj instanceof Date && !isNaN(dataObj) && dataObj <= hoje;
    };
    

    renderizarClientes();
});