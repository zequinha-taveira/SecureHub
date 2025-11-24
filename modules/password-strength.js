// ============================================
// PASSWORD STRENGTH CHECKER MODULE
// ============================================

function loadPasswordStrength() {
    modalTitle.textContent = '💪 Verificador de Força de Senha';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Digite sua senha</label>
            <input type="password" id="passwordInput" class="form-input" placeholder="Digite a senha para analisar">
            <div class="checkbox-group" style="margin-top: 0.5rem;">
                <input type="checkbox" id="showPassword" onchange="togglePasswordVisibility()">
                <label for="showPassword">Mostrar senha</label>
            </div>
        </div>
        
        <div id="strengthResult" style="display: none;">
            <div class="alert" id="strengthAlert">
                <h3 id="strengthTitle"></h3>
                <div style="margin-top: 1rem;">
                    <div style="background: var(--bg-tertiary); height: 12px; border-radius: 6px; overflow: hidden;">
                        <div id="strengthBar" style="height: 100%; transition: width 0.3s, background 0.3s;"></div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Análise Detalhada</h3>
                <div id="analysisDetails"></div>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Sugestões de Melhoria</h3>
                <div id="suggestions"></div>
            </div>
        </div>
    `;

    const passwordInput = document.getElementById('passwordInput');
    passwordInput.addEventListener('input', analyzePasswordStrength);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const showPassword = document.getElementById('showPassword');
    passwordInput.type = showPassword.checked ? 'text' : 'password';
}

function analyzePasswordStrength() {
    const password = document.getElementById('passwordInput').value;

    if (password.length === 0) {
        document.getElementById('strengthResult').style.display = 'none';
        return;
    }

    document.getElementById('strengthResult').style.display = 'block';

    // Analysis criteria
    const analysis = {
        length: password.length,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumbers: /[0-9]/.test(password),
        hasSymbols: /[^a-zA-Z0-9]/.test(password),
        hasRepeating: /(.)\1{2,}/.test(password),
        hasSequential: hasSequentialChars(password),
        isCommon: isCommonPassword(password)
    };

    // Calculate score
    let score = 0;
    let maxScore = 100;

    // Length score (0-30 points)
    if (analysis.length >= 16) score += 30;
    else if (analysis.length >= 12) score += 25;
    else if (analysis.length >= 8) score += 15;
    else score += analysis.length;

    // Character variety (0-40 points)
    if (analysis.hasLowercase) score += 10;
    if (analysis.hasUppercase) score += 10;
    if (analysis.hasNumbers) score += 10;
    if (analysis.hasSymbols) score += 10;

    // Penalties
    if (analysis.hasRepeating) score -= 10;
    if (analysis.hasSequential) score -= 10;
    if (analysis.isCommon) score -= 30;

    // Entropy bonus (0-30 points)
    const entropy = calculateEntropy(password);
    if (entropy >= 80) score += 30;
    else if (entropy >= 60) score += 20;
    else if (entropy >= 40) score += 10;

    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strengthLevel, strengthColor, strengthText;
    if (score < 20) {
        strengthLevel = 'Muito Fraca';
        strengthColor = 'var(--error)';
        strengthText = 'Esta senha é extremamente vulnerável e pode ser quebrada rapidamente.';
    } else if (score < 40) {
        strengthLevel = 'Fraca';
        strengthColor = '#ff6b6b';
        strengthText = 'Esta senha oferece proteção mínima e deve ser melhorada.';
    } else if (score < 60) {
        strengthLevel = 'Média';
        strengthColor = 'var(--warning)';
        strengthText = 'Esta senha oferece proteção razoável, mas pode ser melhorada.';
    } else if (score < 80) {
        strengthLevel = 'Forte';
        strengthColor = 'var(--info)';
        strengthText = 'Esta é uma senha forte que oferece boa proteção.';
    } else {
        strengthLevel = 'Muito Forte';
        strengthColor = 'var(--success)';
        strengthText = 'Excelente! Esta senha oferece proteção máxima.';
    }

    // Update UI
    const strengthAlert = document.getElementById('strengthAlert');
    strengthAlert.style.borderColor = strengthColor;

    document.getElementById('strengthTitle').innerHTML = `
        Força: <span style="color: ${strengthColor}">${strengthLevel}</span> (${score}/100)
    `;
    document.getElementById('strengthTitle').style.color = 'var(--text-primary)';

    const strengthBar = document.getElementById('strengthBar');
    strengthBar.style.width = score + '%';
    strengthBar.style.background = strengthColor;

    // Analysis details
    const details = `
        <div class="result-box">
            <p style="margin-bottom: 1rem;">${strengthText}</p>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.5rem;">
                    ${analysis.length >= 12 ? '✅' : '❌'} Comprimento: ${analysis.length} caracteres
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${analysis.hasLowercase ? '✅' : '❌'} Contém letras minúsculas
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${analysis.hasUppercase ? '✅' : '❌'} Contém letras maiúsculas
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${analysis.hasNumbers ? '✅' : '❌'} Contém números
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${analysis.hasSymbols ? '✅' : '❌'} Contém símbolos especiais
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!analysis.hasRepeating ? '✅' : '❌'} Sem caracteres repetidos consecutivos
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!analysis.hasSequential ? '✅' : '❌'} Sem sequências óbvias
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!analysis.isCommon ? '✅' : '⚠️'} ${analysis.isCommon ? 'ATENÇÃO: Senha comum!' : 'Não é uma senha comum'}
                </li>
            </ul>
            <p style="margin-top: 1rem;">
                <strong>Entropia:</strong> ${entropy.toFixed(2)} bits
            </p>
        </div>
    `;
    document.getElementById('analysisDetails').innerHTML = details;

    // Suggestions
    const suggestions = [];
    if (analysis.length < 12) suggestions.push('Aumente o comprimento para pelo menos 12 caracteres');
    if (!analysis.hasLowercase) suggestions.push('Adicione letras minúsculas');
    if (!analysis.hasUppercase) suggestions.push('Adicione letras maiúsculas');
    if (!analysis.hasNumbers) suggestions.push('Adicione números');
    if (!analysis.hasSymbols) suggestions.push('Adicione símbolos especiais (!@#$%...)');
    if (analysis.hasRepeating) suggestions.push('Evite caracteres repetidos consecutivos');
    if (analysis.hasSequential) suggestions.push('Evite sequências óbvias (abc, 123, etc.)');
    if (analysis.isCommon) suggestions.push('Esta senha é muito comum. Use uma senha única e aleatória');

    if (suggestions.length === 0) {
        document.getElementById('suggestions').innerHTML = '<div class="alert alert-success">Sua senha está excelente! Nenhuma sugestão de melhoria.</div>';
    } else {
        document.getElementById('suggestions').innerHTML = `
            <ul style="list-style: none; padding: 0;">
                ${suggestions.map(s => `<li style="margin-bottom: 0.5rem;">💡 ${s}</li>`).join('')}
            </ul>
        `;
    }
}

function hasSequentialChars(password) {
    const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
    const lower = password.toLowerCase();
    return sequences.some(seq => lower.includes(seq));
}

function isCommonPassword(password) {
    const commonPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
        'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
        'bailey', 'passw0rd', 'shadow', '123123', '654321',
        'superman', 'qazwsx', 'michael', 'football', 'senha',
        'admin', 'root', 'toor', 'pass', 'test'
    ];
    return commonPasswords.includes(password.toLowerCase());
}
