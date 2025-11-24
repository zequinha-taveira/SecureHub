// ============================================
// BREACH CHECKER MODULE
// ============================================

function loadBreachChecker() {
    modalTitle.textContent = '🚨 Verificador de Vazamentos';
    modalBody.innerHTML = `
        <div class="alert alert-info">
            <strong>ℹ️ Privacidade Garantida</strong>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                Esta ferramenta verifica padrões comuns de vazamentos conhecidos localmente. 
                Seus dados nunca são enviados para servidores externos.
            </p>
        </div>
        
        <div class="form-group">
            <label class="form-label">Email para verificar</label>
            <input type="email" id="breachEmail" class="form-input" placeholder="seu@email.com">
        </div>
        
        <button class="btn" onclick="checkBreach()">Verificar</button>
        
        <div id="breachResult" style="display: none; margin-top: 1.5rem;">
            <div id="breachStatus"></div>
            
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Recomendações de Segurança</h3>
                <div id="breachRecommendations"></div>
            </div>
        </div>
        
        <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 0.5rem;">🛡️ Proteção contra Vazamentos</h4>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
                Vazamentos de dados são comuns. Proteja-se seguindo estas práticas:
            </p>
            <ul style="font-size: 0.875rem; color: var(--text-secondary); padding-left: 1.5rem; line-height: 1.8;">
                <li>Use senhas únicas para cada serviço</li>
                <li>Ative autenticação de dois fatores (2FA) sempre que possível</li>
                <li>Use um gerenciador de senhas confiável</li>
                <li>Monitore regularmente suas contas</li>
                <li>Altere senhas periodicamente, especialmente após vazamentos</li>
            </ul>
        </div>
        
        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 0.5rem;">📊 Vazamentos Conhecidos Recentes</h4>
            <div id="knownBreaches"></div>
        </div>
    `;

    displayKnownBreaches();
}

function checkBreach() {
    const email = document.getElementById('breachEmail').value.trim();

    if (!email) {
        showNotification('Digite um email para verificar', 'warning');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Digite um email válido', 'error');
        return;
    }

    document.getElementById('breachResult').style.display = 'block';

    // Simulate breach check (in production, this would use Have I Been Pwned API or similar)
    // For privacy, we're doing a local educational check
    const domain = email.split('@')[1];
    const commonBreachedDomains = ['yahoo.com', 'adobe.com', 'linkedin.com'];

    const isLikelyBreached = commonBreachedDomains.includes(domain.toLowerCase());

    if (isLikelyBreached) {
        document.getElementById('breachStatus').innerHTML = `
            <div class="alert alert-warning">
                <h3>⚠️ Possível Exposição Detectada</h3>
                <p style="margin-top: 0.5rem;">
                    O domínio <strong>${domain}</strong> esteve envolvido em vazamentos de dados conhecidos no passado.
                    Isso não significa necessariamente que sua conta específica foi comprometida, mas é recomendado tomar precauções.
                </p>
            </div>
        `;

        document.getElementById('breachRecommendations').innerHTML = `
            <div class="result-box">
                <h4 style="margin-bottom: 0.5rem; color: var(--warning);">Ações Recomendadas:</h4>
                <ul style="padding-left: 1.5rem; line-height: 1.8;">
                    <li><strong>Altere sua senha imediatamente</strong> - Use uma senha forte e única</li>
                    <li><strong>Ative 2FA</strong> - Adicione uma camada extra de segurança</li>
                    <li><strong>Monitore sua conta</strong> - Fique atento a atividades suspeitas</li>
                    <li><strong>Verifique acessos recentes</strong> - Revise logins não autorizados</li>
                    <li><strong>Considere criar um novo email</strong> - Para contas críticas</li>
                </ul>
                
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <strong>🔗 Recursos Úteis:</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.875rem;">
                        <li>Have I Been Pwned (haveibeenpwned.com) - Verificação completa</li>
                        <li>Firefox Monitor - Monitoramento contínuo</li>
                        <li>Google Password Checkup - Verificação de senhas</li>
                    </ul>
                </div>
            </div>
        `;
    } else {
        document.getElementById('breachStatus').innerHTML = `
            <div class="alert alert-success">
                <h3>✅ Nenhuma Exposição Óbvia Detectada</h3>
                <p style="margin-top: 0.5rem;">
                    Não encontramos indicadores imediatos de vazamento para este domínio em nossa base local.
                    No entanto, isso não garante segurança total.
                </p>
            </div>
        `;

        document.getElementById('breachRecommendations').innerHTML = `
            <div class="result-box">
                <h4 style="margin-bottom: 0.5rem; color: var(--success);">Continue Protegido:</h4>
                <ul style="padding-left: 1.5rem; line-height: 1.8;">
                    <li>Mantenha senhas fortes e únicas para cada serviço</li>
                    <li>Use autenticação de dois fatores sempre que disponível</li>
                    <li>Monitore regularmente suas contas</li>
                    <li>Fique atento a emails de phishing</li>
                    <li>Use um gerenciador de senhas confiável</li>
                </ul>
                
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <strong>💡 Dica:</strong> Verifique periodicamente em 
                    <a href="https://haveibeenpwned.com" target="_blank" style="color: var(--accent-primary);">
                        haveibeenpwned.com
                    </a> 
                    para uma análise completa e atualizada.
                </div>
            </div>
        `;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function displayKnownBreaches() {
    const breaches = [
        { name: 'LinkedIn', year: 2021, records: '700M', severity: 'high' },
        { name: 'Facebook', year: 2021, records: '533M', severity: 'high' },
        { name: 'Yahoo', year: 2013, records: '3B', severity: 'critical' },
        { name: 'Adobe', year: 2013, records: '153M', severity: 'high' },
        { name: 'Dropbox', year: 2012, records: '68M', severity: 'medium' }
    ];

    const breachesHtml = breaches.map(breach => {
        let severityColor;
        switch (breach.severity) {
            case 'critical': severityColor = 'var(--error)'; break;
            case 'high': severityColor = 'var(--warning)'; break;
            default: severityColor = 'var(--info)';
        }

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                <div>
                    <strong>${breach.name}</strong>
                    <span style="color: var(--text-secondary); font-size: 0.875rem; margin-left: 0.5rem;">
                        ${breach.year}
                    </span>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">${breach.records}</div>
                    <div style="font-size: 0.75rem; color: ${severityColor}; text-transform: uppercase;">
                        ${breach.severity}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('knownBreaches').innerHTML = `
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            Alguns dos maiores vazamentos de dados já registrados:
        </div>
        ${breachesHtml}
    `;
}
