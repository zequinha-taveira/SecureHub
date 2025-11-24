// ============================================
// URL SCANNER MODULE
// ============================================

function loadUrlScanner() {
    modalTitle.textContent = '🔍 Scanner de URLs';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Digite a URL para analisar</label>
            <input type="text" id="urlInput" class="form-input" placeholder="https://exemplo.com">
        </div>
        
        <button class="btn" onclick="scanUrl()">Analisar URL</button>
        
        <div id="urlResult" style="display: none; margin-top: 1.5rem;">
            <div class="alert" id="urlAlert">
                <h3 id="urlStatus"></h3>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Análise Detalhada</h3>
                <div id="urlAnalysis"></div>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Verificações de Segurança</h3>
                <div id="securityChecks"></div>
            </div>
        </div>
    `;
}

function scanUrl() {
    const urlInput = document.getElementById('urlInput').value.trim();

    if (!urlInput) {
        showNotification('Digite uma URL para analisar', 'warning');
        return;
    }

    let url;
    try {
        url = new URL(urlInput);
    } catch (e) {
        showNotification('URL inválida', 'error');
        return;
    }

    document.getElementById('urlResult').style.display = 'block';

    // Security checks
    const checks = {
        hasHttps: url.protocol === 'https:',
        hasValidDomain: isValidDomain(url.hostname),
        hasSuspiciousChars: /[<>\"']/.test(urlInput),
        hasIpAddress: /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname),
        hasSubdomains: url.hostname.split('.').length > 2,
        hasLongUrl: urlInput.length > 100,
        hasSuspiciousKeywords: checkSuspiciousKeywords(urlInput),
        hasPhishingPatterns: checkPhishingPatterns(url)
    };

    // Calculate risk score
    let riskScore = 0;
    if (!checks.hasHttps) riskScore += 30;
    if (checks.hasSuspiciousChars) riskScore += 20;
    if (checks.hasIpAddress) riskScore += 25;
    if (checks.hasLongUrl) riskScore += 10;
    if (checks.hasSuspiciousKeywords) riskScore += 35;
    if (checks.hasPhishingPatterns) riskScore += 40;

    // Determine safety level
    let safetyLevel, safetyColor, safetyText;
    if (riskScore >= 60) {
        safetyLevel = 'Alto Risco';
        safetyColor = 'var(--error)';
        safetyText = '⚠️ Esta URL apresenta múltiplos indicadores de risco. NÃO acesse este link!';
    } else if (riskScore >= 30) {
        safetyLevel = 'Risco Médio';
        safetyColor = 'var(--warning)';
        safetyText = '⚠️ Esta URL apresenta alguns indicadores de risco. Tenha cuidado ao acessar.';
    } else if (riskScore >= 10) {
        safetyLevel = 'Baixo Risco';
        safetyColor = 'var(--info)';
        safetyText = 'ℹ️ Esta URL parece relativamente segura, mas sempre tenha cuidado.';
    } else {
        safetyLevel = 'Segura';
        safetyColor = 'var(--success)';
        safetyText = '✅ Esta URL parece segura com base nas verificações realizadas.';
    }

    // Update UI
    const urlAlert = document.getElementById('urlAlert');
    urlAlert.className = 'alert';
    urlAlert.style.borderColor = safetyColor;

    document.getElementById('urlStatus').innerHTML = `
        Status: <span style="color: ${safetyColor}">${safetyLevel}</span>
        <p style="margin-top: 0.5rem; font-size: 0.95rem; font-weight: normal;">${safetyText}</p>
    `;

    // Analysis details
    const analysis = `
        <div class="result-box">
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.5rem;"><strong>Protocolo:</strong> ${url.protocol}</li>
                <li style="margin-bottom: 0.5rem;"><strong>Domínio:</strong> ${url.hostname}</li>
                <li style="margin-bottom: 0.5rem;"><strong>Caminho:</strong> ${url.pathname || '/'}</li>
                ${url.search ? `<li style="margin-bottom: 0.5rem;"><strong>Parâmetros:</strong> ${url.search}</li>` : ''}
                ${url.hash ? `<li style="margin-bottom: 0.5rem;"><strong>Hash:</strong> ${url.hash}</li>` : ''}
                <li style="margin-bottom: 0.5rem;"><strong>Comprimento:</strong> ${urlInput.length} caracteres</li>
            </ul>
        </div>
    `;
    document.getElementById('urlAnalysis').innerHTML = analysis;

    // Security checks display
    const securityChecks = `
        <div class="result-box">
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.5rem;">
                    ${checks.hasHttps ? '✅' : '❌'} Usa HTTPS (conexão segura)
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${checks.hasValidDomain ? '✅' : '⚠️'} Domínio válido
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!checks.hasSuspiciousChars ? '✅' : '⚠️'} ${checks.hasSuspiciousChars ? 'Contém caracteres suspeitos' : 'Sem caracteres suspeitos'}
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!checks.hasIpAddress ? '✅' : '⚠️'} ${checks.hasIpAddress ? 'Usa endereço IP (suspeito)' : 'Não usa endereço IP direto'}
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!checks.hasLongUrl ? '✅' : '⚠️'} ${checks.hasLongUrl ? 'URL muito longa' : 'Comprimento normal'}
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!checks.hasSuspiciousKeywords ? '✅' : '⚠️'} ${checks.hasSuspiciousKeywords ? 'Contém palavras-chave suspeitas' : 'Sem palavras-chave suspeitas'}
                </li>
                <li style="margin-bottom: 0.5rem;">
                    ${!checks.hasPhishingPatterns ? '✅' : '⚠️'} ${checks.hasPhishingPatterns ? 'Padrões de phishing detectados' : 'Sem padrões de phishing'}
                </li>
            </ul>
            
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    <strong>Nota:</strong> Esta análise é baseada em padrões comuns e não substitui ferramentas profissionais de segurança. 
                    Sempre verifique a autenticidade de links antes de clicar, especialmente em emails ou mensagens.
                </p>
            </div>
        </div>
    `;
    document.getElementById('securityChecks').innerHTML = securityChecks;
}

function isValidDomain(hostname) {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(hostname);
}

function checkSuspiciousKeywords(url) {
    const suspiciousKeywords = [
        'login', 'signin', 'account', 'verify', 'secure', 'update',
        'confirm', 'banking', 'paypal', 'amazon', 'apple', 'microsoft',
        'google', 'facebook', 'netflix', 'suspended', 'locked',
        'urgent', 'click', 'prize', 'winner', 'free'
    ];

    const lowerUrl = url.toLowerCase();
    return suspiciousKeywords.some(keyword => {
        // Check if keyword appears in suspicious contexts
        return lowerUrl.includes(keyword) && (
            lowerUrl.includes('verify-' + keyword) ||
            lowerUrl.includes(keyword + '-verify') ||
            lowerUrl.includes('secure-' + keyword) ||
            lowerUrl.includes(keyword + '-secure') ||
            lowerUrl.includes(keyword + '-update')
        );
    });
}

function checkPhishingPatterns(url) {
    const hostname = url.hostname.toLowerCase();

    // Check for homograph attacks (similar looking characters)
    if (/[а-яА-Я]/.test(hostname)) return true; // Cyrillic characters

    // Check for excessive subdomains
    if (hostname.split('.').length > 4) return true;

    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) return true;

    // Check for brand impersonation
    const brands = ['paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook', 'netflix'];
    const hasBrandInSubdomain = brands.some(brand => {
        const parts = hostname.split('.');
        return parts.length > 2 && parts.slice(0, -2).some(part => part.includes(brand));
    });

    return hasBrandInSubdomain;
}
