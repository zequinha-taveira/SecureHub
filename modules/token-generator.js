// ============================================
// TOKEN GENERATOR MODULE
// ============================================

function loadTokenGenerator() {
    modalTitle.textContent = '🎫 Gerador de Tokens';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Tipo de Token</label>
            <select id="tokenType" class="form-select" onchange="updateTokenOptions()">
                <option value="random">Token Aleatório</option>
                <option value="uuid">UUID v4</option>
                <option value="apikey">API Key</option>
                <option value="jwt">JWT (Simulado)</option>
                <option value="hex">Hexadecimal</option>
            </select>
        </div>
        
        <div id="tokenOptions">
            <div class="form-group">
                <label class="form-label">Comprimento</label>
                <input type="range" id="tokenLength" min="16" max="128" value="32" class="form-input">
                <span id="tokenLengthValue">32</span> caracteres
            </div>
        </div>
        
        <button class="btn" onclick="generateToken()">Gerar Token</button>
        
        <div id="tokenResult" style="display: none; margin-top: 1.5rem;">
            <div class="form-group">
                <label class="form-label">Token Gerado</label>
                <div class="result-box" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                    <span id="generatedToken" style="flex: 1; word-break: break-all; font-family: 'Courier New', monospace;"></span>
                    <button class="btn btn-secondary" onclick="copyToken()">Copiar</button>
                </div>
            </div>
            
            <div id="tokenInfo" style="margin-top: 1rem;"></div>
        </div>
        
        <div id="tokenHistory" style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;">Tokens Recentes</h3>
            <div id="tokenHistoryList"></div>
        </div>
        
        <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 0.5rem;">🎫 Tipos de Tokens</h4>
            <ul style="font-size: 0.875rem; color: var(--text-secondary); padding-left: 1.5rem; line-height: 1.8;">
                <li><strong>Token Aleatório:</strong> String aleatória para uso geral</li>
                <li><strong>UUID v4:</strong> Identificador único universal (RFC 4122)</li>
                <li><strong>API Key:</strong> Chave para autenticação de APIs</li>
                <li><strong>JWT:</strong> JSON Web Token simulado (apenas estrutura)</li>
                <li><strong>Hexadecimal:</strong> Token em formato hexadecimal</li>
            </ul>
        </div>
    `;

    const lengthSlider = document.getElementById('tokenLength');
    const lengthValue = document.getElementById('tokenLengthValue');

    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
    });

    displayTokenHistory();
}

function updateTokenOptions() {
    const tokenType = document.getElementById('tokenType').value;
    const tokenOptions = document.getElementById('tokenOptions');

    if (tokenType === 'uuid' || tokenType === 'jwt') {
        tokenOptions.style.display = 'none';
    } else {
        tokenOptions.style.display = 'block';
    }
}

function generateToken() {
    const tokenType = document.getElementById('tokenType').value;
    let token = '';
    let info = '';

    switch (tokenType) {
        case 'random':
            const length = parseInt(document.getElementById('tokenLength').value);
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            token = generateRandomString(length, charset);
            info = `Token aleatório de ${length} caracteres`;
            break;

        case 'uuid':
            token = generateUUID();
            info = 'UUID v4 (RFC 4122)';
            break;

        case 'apikey':
            const keyLength = parseInt(document.getElementById('tokenLength').value);
            const prefix = 'sk_live_';
            const keyChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            token = prefix + generateRandomString(keyLength - prefix.length, keyChars);
            info = `API Key com prefixo (${keyLength} caracteres)`;
            break;

        case 'jwt':
            token = generateSimulatedJWT();
            info = 'JWT simulado (apenas estrutura, não assinado)';
            break;

        case 'hex':
            const hexLength = parseInt(document.getElementById('tokenLength').value);
            const hexChars = '0123456789abcdef';
            token = generateRandomString(hexLength, hexChars);
            info = `Token hexadecimal de ${hexLength} caracteres`;
            break;
    }

    document.getElementById('tokenResult').style.display = 'block';
    document.getElementById('generatedToken').textContent = token;
    document.getElementById('tokenInfo').innerHTML = `
        <div class="alert alert-info">
            <strong>ℹ️ ${info}</strong>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                Comprimento: ${token.length} caracteres
            </p>
        </div>
    `;

    saveTokenToHistory(token, tokenType, info);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateSimulatedJWT() {
    const header = btoa(JSON.stringify({
        alg: 'HS256',
        typ: 'JWT'
    })).replace(/=/g, '');

    const payload = btoa(JSON.stringify({
        sub: '1234567890',
        name: 'User',
        iat: Math.floor(Date.now() / 1000)
    })).replace(/=/g, '');

    const signature = generateRandomString(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_');

    return `${header}.${payload}.${signature}`;
}

function copyToken() {
    const token = document.getElementById('generatedToken').textContent;
    copyToClipboard(token);
}

function saveTokenToHistory(token, type, info) {
    let history = JSON.parse(localStorage.getItem('tokenHistory') || '[]');
    history.unshift({
        token: token,
        type: type,
        info: info,
        timestamp: new Date().toLocaleString('pt-BR')
    });

    history = history.slice(0, 10);
    localStorage.setItem('tokenHistory', JSON.stringify(history));

    displayTokenHistory();
}

function displayTokenHistory() {
    const history = JSON.parse(localStorage.getItem('tokenHistory') || '[]');
    const historyList = document.getElementById('tokenHistoryList');

    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-secondary);">Nenhum token gerado ainda</p>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="result-box" style="margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-family: 'Courier New', monospace; font-size: 0.875rem; margin-bottom: 0.25rem; word-break: break-all;">
                        ${item.token}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        ${item.info} • ${item.timestamp}
                    </div>
                </div>
                <button class="btn btn-secondary" style="padding: 0.5rem 1rem; white-space: nowrap;" onclick="copyToClipboard('${item.token}')">
                    Copiar
                </button>
            </div>
        </div>
    `).join('');
}
