// Espera o documento HTML ser completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Contador de Caracteres ---
    const textarea = document.getElementById('descricao_ocorrencia');
    const charCounter = document.getElementById('char_counter');
    const maxLength = textarea.getAttribute('maxlength');
    charCounter.textContent = `${textarea.value.length}/${maxLength}`;
    textarea.addEventListener('input', function() {
        const currentLength = textarea.value.length;
        charCounter.textContent = `${currentLength}/${maxLength}`;
        if (currentLength > maxLength * 0.9) {
            charCounter.style.color = 'red';
        } else {
            charCounter.style.color = '#666';
        }
    });

    // --- 2. Mostrar/Esconder Campos de Identificação ---
    const radioAnonimo = document.getElementById('denuncia_anonima');
    const radioIdentificado = document.getElementById('denuncia_identificada');
    const camposIdentificacao = document.getElementById('identificacao_campos');
    const emailInput = document.getElementById('email'); 
    function toggleIdentificacaoFields() {
        if (radioIdentificado.checked) {
            camposIdentificacao.classList.remove('hidden');
            emailInput.style.borderColor = '#ccc'; 
        } else {
            camposIdentificacao.classList.add('hidden');
            document.getElementById('nome_completo').value = '';
            document.getElementById('telefone').value = '';
            emailInput.value = '';
            emailInput.style.borderColor = '#ccc';
        }
    }
    radioAnonimo.addEventListener('change', toggleIdentificacaoFields);
    radioIdentificado.addEventListener('change', toggleIdentificacaoFields);
    toggleIdentificacaoFields();

    // --- 3. Exibir Nomes dos Arquivos Selecionados ---
    const fileInput = document.getElementById('file_input');
    const fileUploadText = document.getElementById('file-upload-text');
    const fileDisplay = document.getElementById('file-names-display');
    const MAX_FILES = 5;
    const MAX_FILE_SIZE_MB = 10;
    const MAX_TOTAL_SIZE_MB = 50;

    fileInput.addEventListener('change', function() {
        fileDisplay.innerHTML = '';
        let totalSize = 0;
        let filesToUpload = [];
        let fileErrors = [];
        if (this.files.length > 0) {
            if (this.files.length > MAX_FILES) {
                fileErrors.push(`Você pode selecionar no máximo ${MAX_FILES} arquivos.`);
                this.value = ''; 
            } else {
                for (const file of this.files) {
                    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                        fileErrors.push(`O arquivo "${file.name}" excede o tamanho máximo de ${MAX_FILE_SIZE_MB}MB.`);
                    } else {
                        totalSize += file.size;
                        filesToUpload.push(file);
                    }
                }
                if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
                    fileErrors.push(`O tamanho total dos arquivos excede ${MAX_TOTAL_SIZE_MB}MB.`);
                    this.value = '';
                    filesToUpload = [];
                }
            }
            if (fileErrors.length > 0) {
                alert('Erros nos arquivos:\n' + fileErrors.join('\n'));
                fileUploadText.style.display = 'block';
                fileDisplay.innerHTML = ''; 
            } else {
                fileUploadText.style.display = 'none';
                for (const file of filesToUpload) {
                    const li = document.createElement('li');
                    li.textContent = file.name + ` (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                    fileDisplay.appendChild(li);
                }
            }
        } else {
            fileUploadText.style.display = 'block';
        }
    });


    const form = document.getElementById('report_form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); 

        const tipoCrime = document.getElementById('tipo_crime');
        const descricao = document.getElementById('descricao_ocorrencia');
        const local = document.getElementById('local_ocorrencia');
        const email = document.getElementById('email');
        
        let isValid = true;
        let errorMessages = [];
        [tipoCrime, descricao, local, email].forEach(field => field.style.borderColor = '#ccc');


        if (tipoCrime.value === "") {
            isValid = false;
            errorMessages.push('O campo "Tipo de Crime" é obrigatório.');
            tipoCrime.style.borderColor = 'red';
        }
        if (descricao.value.trim().length < 10) {
            isValid = false;
            errorMessages.push('O campo "Descrição do Ocorrido" deve ter pelo menos 10 caracteres.');
            descricao.style.borderColor = 'red';
        }
        if (local.value.trim().length === 0) {
            isValid = false;
            errorMessages.push('O campo "Local do Ocorrido" é obrigatório.');
            local.style.borderColor = 'red';
        }
        if (radioIdentificado.checked) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
            if (email.value.trim().length === 0) {
                isValid = false;
                errorMessages.push('O campo "Email" é obrigatório quando você se identifica.');
                email.style.borderColor = 'red';
            } else if (!emailRegex.test(email.value)) {
                isValid = false;
                errorMessages.push('O formato do "Email" é inválido.');
                email.style.borderColor = 'red';
            }
        }
        if (!isValid) {
            alert('Por favor, corrija os seguintes erros:\n\n' + errorMessages.join('\n'));
            return;
        }


        const formData = new FormData();

        formData.append('tipo_relato', radioIdentificado.checked ? 'identificado' : 'anonimo');
        formData.append('id_tipo_fk', tipoCrime.value);
        formData.append('descricao_ocorrencia', descricao.value.trim());
        formData.append('local_ocorrencia', local.value.trim());
        
        const dataHoraValor = document.getElementById('data_hora').value;
        if (dataHoraValor) {
            formData.append('data_hora_ocorrencia', dataHoraValor);
        }

        if (radioIdentificado.checked) {
            formData.append('nome_completo', document.getElementById('nome_completo').value.trim());
            formData.append('email', email.value.trim());
            formData.append('telefone', document.getElementById('telefone').value.trim());
        }


        if (fileInput.files.length > 0) {
            formData.append('evidencia', fileInput.files[0]); 
        }
        try {
            const response = await fetch('http://localhost:3000/api/denuncias', {
                method: 'POST',

                body: formData 
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}\n\nProtocolo: ${data.protocolo}`);
                form.reset();
                charCounter.textContent = `0/${maxLength}`;
                fileDisplay.innerHTML = '';
                fileInput.value = '';
                fileUploadText.style.display = 'block';
                toggleIdentificacaoFields();
            } else {
                alert(`❌ Erro: ${data.message || 'Ocorreu um erro ao enviar sua denúncia.'}`);
            }
        } catch (error) {
            console.error('Erro ao enviar denúncia:', error);
            alert('❌ Ocorreu um erro de rede ao enviar sua denúncia. Tente novamente mais tarde.');
        }
    });
});