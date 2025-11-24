// ============================================
// PASSWORD GENERATOR MODULE
// ============================================

function loadPasswordGenerator() {
    modalTitle.textContent = '🔐 Gerador de Senhas';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Comprimento da Senha</label>
            <input type="range" id="passwordLength" min="8" max="64" value="16" class="form-input">
            <span id="lengthValue">16</span> caracteres
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeUppercase" checked>
                <label for="includeUppercase">Incluir Maiúsculas (A-Z)</label>
            </div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeLowercase" checked>
                <label for="includeLowercase">Incluir Minúsculas (a-z)</label>
            </div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeNumbers" checked>
                <label for="includeNumbers">Incluir Números (0-9)</label>
            </div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeSymbols" checked>
                <label for="includeSymbols">Incluir Símbolos (!@#$%...)</label>
            </div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="avoidAmbiguous">
                <label for="avoidAmbiguous">Evitar Caracteres Ambíguos (0, O, l, I)</label>
            </div>
        </div>
        
        <button class="btn" onclick="generatePassword()">Gerar Senha</button>
        
        <div id="passwordResult" style="display: none;">
            <div class="result-box" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                <span id="generatedPassword" style="flex: 1; font-size: 1.25rem; font-weight: 600;"></span>
                <button class="btn btn-secondary" onclick="copyPassword()">Copiar</button>
            </div>
            
            <div style="margin-top: 1rem;">
                <strong>Entropia:</strong> <span id="entropyValue"></span> bits
                <div style="margin-top: 0.5rem;">
                    <div style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="entropyBar" style="height: 100%; background: var(--accent-gradient); transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 1rem;">
                <strong>Força:</strong> <span id="strengthText"></span>
            </div>
        </div>
        
        <div id="passwordHistory" style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;">Histórico</h3>
            <div id="historyList"></div>
        </div>
    `;

    // Initialize event listeners
    const lengthSlider = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');

    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
    });

    // Load history
    displayPasswordHistory();
}

function generatePassword() {
    const length = parseInt(document.getElementById('passwordLength').value);
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;
    const avoidAmbiguous = document.getElementById('avoidAmbiguous').checked;

    // Build character set
    let charset = '';
    let lowercase = 'abcdefghijklmnopqrstuvwxyz';
    let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (avoidAmbiguous) {
        lowercase = lowercase.replace(/[lo]/g, '');
        uppercase = uppercase.replace(/[IO]/g, '');
        numbers = numbers.replace(/[01]/g, '');
    }

    if (includeLowercase) charset += lowercase;
    if (includeUppercase) charset += uppercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (charset.length === 0) {
        showNotification('Selecione pelo menos um tipo de caractere', 'warning');
        return;
    }

    // Generate password
    const password = generateRandomString(length, charset);

    // Calculate entropy
    const entropy = calculateEntropy(password);
    const entropyPercentage = Math.min((entropy / 128) * 100, 100);

    // Determine strength
    let strength = '';
    let strengthColor = '';
    if (entropy < 28) {
        strength = 'Muito Fraca';
        strengthColor = 'var(--error)';
    } else if (entropy < 36) {
        strength = 'Fraca';
        strengthColor = 'var(--warning)';
    } else if (entropy < 60) {
        strength = 'Média';
        strengthColor = 'var(--info)';
    } else if (entropy < 128) {
        strength = 'Forte';
        strengthColor = 'var(--success)';
    } else {
        strength = 'Muito Forte';
        strengthColor = 'var(--success)';
    }

    // Display result
    document.getElementById('passwordResult').style.display = 'block';
    document.getElementById('generatedPassword').textContent = password;
    document.getElementById('entropyValue').textContent = entropy.toFixed(2);
    document.getElementById('entropyBar').style.width = entropyPercentage + '%';
    document.getElementById('strengthText').textContent = strength;
    document.getElementById('strengthText').style.color = strengthColor;

    // Save to history
    savePasswordToHistory(password, entropy, strength);
}

function copyPassword() {
    const password = document.getElementById('generatedPassword').textContent;
    copyToClipboard(password);
}

function savePasswordToHistory(password, entropy, strength) {
    let history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
    history.unshift({
        password: password,
        entropy: entropy.toFixed(2),
        strength: strength,
        timestamp: new Date().toLocaleString('pt-BR')
    });

    // Keep only last 10
    history = history.slice(0, 10);
    localStorage.setItem('passwordHistory', JSON.stringify(history));

    displayPasswordHistory();
}

function displayPasswordHistory() {
    const history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-secondary);">Nenhuma senha gerada ainda</p>';
        return;
    }

    historyList.innerHTML = history.map((item, index) => `
        <div class="result-box" style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; overflow: hidden;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.password}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${item.strength} • ${item.entropy} bits • ${item.timestamp}
                </div>
            </div>
            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="copyToClipboard('${item.password}')">
                Copiar
            </button>
        </div>
    `).join('');
}
