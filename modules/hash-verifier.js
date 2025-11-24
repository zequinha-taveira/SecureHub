// ============================================
// HASH VERIFIER MODULE
// ============================================

function loadHashVerifier() {
    modalTitle.textContent = '🔢 Verificador de Hash';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Texto para gerar hash</label>
            <textarea id="hashInput" class="form-textarea" placeholder="Digite o texto aqui..."></textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Algoritmo</label>
            <select id="hashAlgorithm" class="form-select">
                <option value="sha256">SHA-256</option>
                <option value="sha512">SHA-512</option>
                <option value="sha1">SHA-1</option>
            </select>
        </div>
        
        <button class="btn" onclick="generateHash()">Gerar Hash</button>
        
        <div id="hashResult" style="display: none; margin-top: 1.5rem;">
            <div class="form-group">
                <label class="form-label">Hash Gerado</label>
                <div class="result-box" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                    <span id="generatedHash" style="flex: 1; word-break: break-all;"></span>
                    <button class="btn btn-secondary" onclick="copyHash()">Copiar</button>
                </div>
            </div>
        </div>
        
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--glass-border);">
        
        <h3 style="margin-bottom: 1rem;">Verificar Integridade</h3>
        
        <div class="form-group">
            <label class="form-label">Hash Esperado</label>
            <input type="text" id="expectedHash" class="form-input" placeholder="Cole o hash para comparar">
        </div>
        
        <div class="form-group">
            <label class="form-label">Hash Atual</label>
            <input type="text" id="actualHash" class="form-input" placeholder="Cole o hash gerado">
        </div>
        
        <button class="btn" onclick="verifyHash()">Verificar</button>
        
        <div id="verifyResult" style="display: none; margin-top: 1rem;"></div>
        
        <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 0.5rem;">ℹ️ Sobre Hashes</h4>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                Hashes criptográficos são usados para verificar a integridade de arquivos e dados. 
                Mesmo uma pequena alteração no conteúdo original resultará em um hash completamente diferente.
            </p>
            <ul style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem; padding-left: 1.5rem;">
                <li><strong>SHA-256:</strong> Recomendado para uso geral (256 bits)</li>
                <li><strong>SHA-512:</strong> Máxima segurança (512 bits)</li>
                <li><strong>SHA-1:</strong> Legado, não recomendado para segurança crítica</li>
            </ul>
        </div>
    `;
}

async function generateHash() {
    const input = document.getElementById('hashInput').value;
    const algorithm = document.getElementById('hashAlgorithm').value;

    if (!input) {
        showNotification('Digite um texto para gerar o hash', 'warning');
        return;
    }

    let hash;
    try {
        switch (algorithm) {
            case 'sha256':
                hash = await sha256(input);
                break;
            case 'sha512':
                hash = await sha512(input);
                break;
            case 'sha1':
                hash = await sha1(input);
                break;
            default:
                hash = await sha256(input);
        }

        document.getElementById('hashResult').style.display = 'block';
        document.getElementById('generatedHash').textContent = hash;

        // Auto-fill actual hash for verification
        document.getElementById('actualHash').value = hash;

        showNotification('Hash gerado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao gerar hash', 'error');
    }
}

function copyHash() {
    const hash = document.getElementById('generatedHash').textContent;
    copyToClipboard(hash);
}

function verifyHash() {
    const expected = document.getElementById('expectedHash').value.trim().toLowerCase();
    const actual = document.getElementById('actualHash').value.trim().toLowerCase();

    if (!expected || !actual) {
        showNotification('Preencha ambos os campos de hash', 'warning');
        return;
    }

    const verifyResult = document.getElementById('verifyResult');
    verifyResult.style.display = 'block';

    if (expected === actual) {
        verifyResult.innerHTML = `
            <div class="alert alert-success">
                <strong>✅ Hashes Correspondem!</strong>
                <p style="margin-top: 0.5rem;">Os hashes são idênticos. A integridade dos dados foi verificada com sucesso.</p>
            </div>
        `;
    } else {
        verifyResult.innerHTML = `
            <div class="alert alert-error">
                <strong>❌ Hashes Não Correspondem!</strong>
                <p style="margin-top: 0.5rem;">Os hashes são diferentes. Os dados podem ter sido modificados ou corrompidos.</p>
            </div>
        `;
    }
}

// SHA-1 implementation using Web Crypto API
async function sha1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
