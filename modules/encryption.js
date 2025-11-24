// ============================================
// ENCRYPTION MODULE
// ============================================

function loadEncryption() {
    modalTitle.textContent = '🔒 Criptografia de Texto';
    modalBody.innerHTML = `
        <div style="display: grid; gap: 2rem;">
            <!-- Encryption Section -->
            <div>
                <h3 style="margin-bottom: 1rem;">Criptografar</h3>
                
                <div class="form-group">
                    <label class="form-label">Texto para criptografar</label>
                    <textarea id="encryptInput" class="form-textarea" placeholder="Digite o texto que deseja proteger..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Senha de criptografia</label>
                    <input type="password" id="encryptPassword" class="form-input" placeholder="Digite uma senha forte">
                    <div class="checkbox-group" style="margin-top: 0.5rem;">
                        <input type="checkbox" id="showEncryptPassword" onchange="toggleEncryptPassword()">
                        <label for="showEncryptPassword">Mostrar senha</label>
                    </div>
                </div>
                
                <button class="btn" onclick="performEncryption()">Criptografar</button>
                
                <div id="encryptResult" style="display: none; margin-top: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Texto Criptografado</label>
                        <div class="result-box" style="max-height: 200px; overflow-y: auto;">
                            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                                <span id="encryptedText" style="flex: 1; word-break: break-all; font-size: 0.875rem;"></span>
                                <button class="btn btn-secondary" onclick="copyEncrypted()">Copiar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid var(--glass-border);">
            
            <!-- Decryption Section -->
            <div>
                <h3 style="margin-bottom: 1rem;">Descriptografar</h3>
                
                <div class="form-group">
                    <label class="form-label">Texto criptografado</label>
                    <textarea id="decryptInput" class="form-textarea" placeholder="Cole o texto criptografado aqui..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Senha de descriptografia</label>
                    <input type="password" id="decryptPassword" class="form-input" placeholder="Digite a senha usada na criptografia">
                    <div class="checkbox-group" style="margin-top: 0.5rem;">
                        <input type="checkbox" id="showDecryptPassword" onchange="toggleDecryptPassword()">
                        <label for="showDecryptPassword">Mostrar senha</label>
                    </div>
                </div>
                
                <button class="btn" onclick="performDecryption()">Descriptografar</button>
                
                <div id="decryptResult" style="display: none; margin-top: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Texto Descriptografado</label>
                        <div class="result-box">
                            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                                <span id="decryptedText" style="flex: 1; word-break: break-word;"></span>
                                <button class="btn btn-secondary" onclick="copyDecrypted()">Copiar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid var(--glass-border);">
            
            <!-- Base64 Section -->
            <div>
                <h3 style="margin-bottom: 1rem;">Codificação Base64</h3>
                
                <div class="form-group">
                    <label class="form-label">Texto</label>
                    <textarea id="base64Input" class="form-textarea" placeholder="Digite o texto..."></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button class="btn" onclick="encodeBase64()">Codificar</button>
                    <button class="btn btn-secondary" onclick="decodeBase64()">Decodificar</button>
                </div>
                
                <div id="base64Result" style="display: none; margin-top: 1rem;">
                    <div class="result-box">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                            <span id="base64Output" style="flex: 1; word-break: break-all; font-size: 0.875rem;"></span>
                            <button class="btn btn-secondary" onclick="copyBase64()">Copiar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 0.5rem;">🔐 Sobre a Criptografia</h4>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                Esta ferramenta usa AES-256-GCM, um dos algoritmos de criptografia mais seguros disponíveis. 
                Seus dados são processados localmente no navegador e nunca são enviados para servidores externos.
            </p>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                <strong>Importante:</strong> Guarde sua senha em um local seguro. Sem ela, não será possível recuperar os dados criptografados.
            </p>
        </div>
    `;
}

function toggleEncryptPassword() {
    const input = document.getElementById('encryptPassword');
    const checkbox = document.getElementById('showEncryptPassword');
    input.type = checkbox.checked ? 'text' : 'password';
}

function toggleDecryptPassword() {
    const input = document.getElementById('decryptPassword');
    const checkbox = document.getElementById('showDecryptPassword');
    input.type = checkbox.checked ? 'text' : 'password';
}

async function performEncryption() {
    const text = document.getElementById('encryptInput').value;
    const password = document.getElementById('encryptPassword').value;

    if (!text) {
        showNotification('Digite um texto para criptografar', 'warning');
        return;
    }

    if (!password) {
        showNotification('Digite uma senha', 'warning');
        return;
    }

    if (password.length < 8) {
        showNotification('Use uma senha com pelo menos 8 caracteres', 'warning');
        return;
    }

    try {
        const encrypted = await encryptText(text, password);
        document.getElementById('encryptResult').style.display = 'block';
        document.getElementById('encryptedText').textContent = encrypted;
        showNotification('Texto criptografado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao criptografar: ' + error.message, 'error');
    }
}

async function performDecryption() {
    const text = document.getElementById('decryptInput').value;
    const password = document.getElementById('decryptPassword').value;

    if (!text) {
        showNotification('Cole o texto criptografado', 'warning');
        return;
    }

    if (!password) {
        showNotification('Digite a senha', 'warning');
        return;
    }

    try {
        const decrypted = await decryptText(text, password);
        document.getElementById('decryptResult').style.display = 'block';
        document.getElementById('decryptedText').textContent = decrypted;
        showNotification('Texto descriptografado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao descriptografar. Verifique a senha e o texto.', 'error');
    }
}

function copyEncrypted() {
    const text = document.getElementById('encryptedText').textContent;
    copyToClipboard(text);
}

function copyDecrypted() {
    const text = document.getElementById('decryptedText').textContent;
    copyToClipboard(text);
}

function encodeBase64() {
    const text = document.getElementById('base64Input').value;

    if (!text) {
        showNotification('Digite um texto para codificar', 'warning');
        return;
    }

    try {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        document.getElementById('base64Result').style.display = 'block';
        document.getElementById('base64Output').textContent = encoded;
        showNotification('Texto codificado em Base64!', 'success');
    } catch (error) {
        showNotification('Erro ao codificar', 'error');
    }
}

function decodeBase64() {
    const text = document.getElementById('base64Input').value;

    if (!text) {
        showNotification('Digite um texto para decodificar', 'warning');
        return;
    }

    try {
        const decoded = decodeURIComponent(escape(atob(text)));
        document.getElementById('base64Result').style.display = 'block';
        document.getElementById('base64Output').textContent = decoded;
        showNotification('Texto decodificado!', 'success');
    } catch (error) {
        showNotification('Erro ao decodificar. Verifique se o texto está em Base64 válido.', 'error');
    }
}

function copyBase64() {
    const text = document.getElementById('base64Output').textContent;
    copyToClipboard(text);
}
