// ============================================
// Zero-Knowledge Vault Module
// Secure data storage with ZK authentication
// ============================================

const ZKVault = {
    isUnlocked: false,
    masterKey: null,
    vaultData: {
        passwords: [],
        notes: [],
        documents: []
    },
    salt: null,
    commitment: null,

    /**
     * Initialize the ZK Vault interface
     */
    init() {
        this.loadVaultMetadata();

        return `
            <div class="zk-vault">
                <div class="vault-header">
                    <h2>🔐 Zero-Knowledge Vault</h2>
                    <p class="vault-subtitle">Seus dados, suas chaves, zero conhecimento</p>
                </div>

                ${this.isUnlocked ? this.renderUnlockedVault() : this.renderLockedVault()}
            </div>
        `;
    },

    /**
     * Render locked vault (authentication screen)
     */
    renderLockedVault() {
        const hasVault = this.commitment !== null;

        if (!hasVault) {
            return `
                <div class="vault-setup">
                    <div class="setup-card">
                        <div class="setup-icon">🔒</div>
                        <h3>Criar Vault</h3>
                        <p>Crie um vault seguro com autenticação zero-knowledge</p>
                        
                        <div class="form-group">
                            <label>Senha Mestra</label>
                            <input type="password" id="masterPassword" placeholder="Digite uma senha forte" class="input-field">
                        </div>
                        
                        <div class="form-group">
                            <label>Confirmar Senha</label>
                            <input type="password" id="confirmPassword" placeholder="Confirme a senha" class="input-field">
                        </div>

                        <div class="info-box">
                            <strong>⚠️ Importante:</strong>
                            <ul>
                                <li>Esta senha nunca é armazenada</li>
                                <li>Usamos provas zero-knowledge para autenticação</li>
                                <li>Se esquecer a senha, não há recuperação</li>
                            </ul>
                        </div>

                        <button onclick="ZKVault.createVault()" class="btn-primary btn-large">
                            🔐 Criar Vault
                        </button>
                    </div>

                    <div class="demo-section">
                        <h3>🎭 Demonstrações Zero-Knowledge</h3>
                        <div class="demo-cards">
                            <div class="demo-card">
                                <div class="demo-icon">🎂</div>
                                <h4>Verificação de Idade</h4>
                                <p>Prove que tem idade mínima sem revelar sua data de nascimento</p>
                                <button onclick="ZKVault.showAgeDemo()" class="btn-secondary">
                                    Testar
                                </button>
                            </div>
                            
                            <div class="demo-card">
                                <div class="demo-icon">✅</div>
                                <h4>Prova de Atributo</h4>
                                <p>Prove propriedades de dados sem revelar os valores</p>
                                <button onclick="ZKVault.showAttributeDemo()" class="btn-secondary">
                                    Testar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="vault-unlock">
                    <div class="unlock-card">
                        <div class="unlock-icon">🔒</div>
                        <h3>Desbloquear Vault</h3>
                        <p>Autenticação Zero-Knowledge</p>
                        
                        <div class="form-group">
                            <label>Senha Mestra</label>
                            <input type="password" id="unlockPassword" placeholder="Digite sua senha" class="input-field" onkeypress="if(event.key==='Enter') ZKVault.unlockVault()">
                        </div>

                        <div class="zk-info">
                            <div class="zk-badge">🎭 ZK Proof</div>
                            <p>Provando conhecimento sem revelar a senha...</p>
                        </div>

                        <button onclick="ZKVault.unlockVault()" class="btn-primary btn-large">
                            🔓 Desbloquear
                        </button>

                        <button onclick="ZKVault.resetVault()" class="btn-danger btn-sm">
                            ⚠️ Resetar Vault
                        </button>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Render unlocked vault (data management)
     */
    renderUnlockedVault() {
        return `
            <div class="vault-unlocked">
                <div class="vault-status">
                    <span class="status-badge status-unlocked">🔓 Desbloqueado</span>
                    <button onclick="ZKVault.lockVault()" class="btn-secondary btn-sm">
                        🔒 Bloquear
                    </button>
                </div>

                <div class="vault-tabs">
                    <button class="tab-btn active" onclick="ZKVault.switchTab('passwords')">
                        🔑 Senhas
                    </button>
                    <button class="tab-btn" onclick="ZKVault.switchTab('notes')">
                        📝 Notas
                    </button>
                    <button class="tab-btn" onclick="ZKVault.switchTab('documents')">
                        📄 Documentos
                    </button>
                </div>

                <div id="vaultContent" class="vault-content">
                    ${this.renderPasswordsTab()}
                </div>
            </div>
        `;
    },

    /**
     * Create new vault
     */
    async createVault() {
        const password = document.getElementById('masterPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!password || password.length < 8) {
            alert('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        if (password !== confirm) {
            alert('As senhas não coincidem');
            return;
        }

        try {
            // Generate salt
            this.salt = window.crypto.getRandomValues(new Uint8Array(16));

            // Create ZK proof commitment
            const proof = await zeroKnowledge.createVaultAccessProof(password, this.salt);
            this.commitment = proof.commitment;

            // Derive encryption key
            this.masterKey = await e2eeCrypto.deriveKeyFromPassword(password, this.salt);

            // Save metadata (NOT the password!)
            this.saveVaultMetadata();

            this.isUnlocked = true;
            this.showNotification('✅ Vault criado com sucesso!', 'success');

            // Refresh UI
            document.getElementById('modalBody').innerHTML = this.init();
        } catch (error) {
            console.error('Error creating vault:', error);
            alert('Erro ao criar vault: ' + error.message);
        }
    },

    /**
     * Unlock vault with ZK authentication
     */
    async unlockVault() {
        const password = document.getElementById('unlockPassword').value;

        if (!password) {
            alert('Digite a senha');
            return;
        }

        // Check rate limit
        const rateCheck = securityManager.checkRateLimit('vault-unlock');
        if (!rateCheck.allowed) {
            alert(`⚠️ ${rateCheck.message}`);
            return;
        }

        try {
            // Create ZK proof
            const proof = await zeroKnowledge.createVaultAccessProof(password, this.salt);

            // Verify proof
            const isValid = zeroKnowledge.verifyVaultAccessProof(proof, this.commitment);

            if (!isValid) {
                alert(`❌ Senha incorreta (${rateCheck.attemptsLeft} tentativas restantes)`);
                return;
            }

            // Success - reset rate limit
            securityManager.resetRateLimit('vault-unlock');

            // Derive encryption key
            this.masterKey = await e2eeCrypto.deriveKeyFromPassword(password, this.salt);

            // Load encrypted data
            await this.loadVaultData();

            this.isUnlocked = true;

            // Start session timeout
            this.startSessionTimeout();

            this.showNotification('✅ Vault desbloqueado!', 'success');

            // Refresh UI
            document.getElementById('modalBody').innerHTML = this.init();
        } catch (error) {
            console.error('Error unlocking vault:', error);
            alert('Erro ao desbloquear: ' + error.message);
        }
    },

    /**
     * Lock vault
     */
    lockVault() {
        // Stop session timeout
        this.stopSessionTimeout();

        this.isUnlocked = false;
        this.masterKey = null;
        this.vaultData = { passwords: [], notes: [], documents: [] };

        this.showNotification('🔒 Vault bloqueado', 'info');
        document.getElementById('modalBody').innerHTML = this.init();
    },

    /**
     * Start session timeout monitoring
     */
    startSessionTimeout() {
        securityManager.startSession(
            // On timeout
            () => {
                this.lockVault();
                alert('⏰ Sessão expirada por inatividade. O vault foi bloqueado.');
            },
            // On warning (1 minute before timeout)
            (secondsLeft) => {
                this.showNotification(
                    `⏰ Sessão expira em ${secondsLeft} segundos. Mova o mouse para estender.`,
                    'warning'
                );
            }
        );
    },

    /**
     * Stop session timeout monitoring
     */
    stopSessionTimeout() {
        securityManager.stopSession();
    },

    /**
     * Reset vault (delete all data)
     */
    resetVault() {
        if (!confirm('⚠️ ATENÇÃO: Isso irá deletar TODOS os dados do vault. Continuar?')) {
            return;
        }

        localStorage.removeItem('zk_vault_metadata');
        localStorage.removeItem('zk_vault_data');

        this.isUnlocked = false;
        this.masterKey = null;
        this.salt = null;
        this.commitment = null;
        this.vaultData = { passwords: [], notes: [], documents: [] };

        this.showNotification('⚠️ Vault resetado', 'warning');
        document.getElementById('modalBody').innerHTML = this.init();
    },

    /**
     * Render passwords tab
     */
    renderPasswordsTab() {
        return `
            <div class="tab-content">
                <div class="content-header">
                    <h3>🔑 Senhas Armazenadas</h3>
                    <button onclick="ZKVault.addPassword()" class="btn-primary">
                        ➕ Adicionar Senha
                    </button>
                </div>
                
                <div class="items-grid">
                    ${this.vaultData.passwords.length === 0
                ? '<p class="empty-state">Nenhuma senha armazenada</p>'
                : this.vaultData.passwords.map((item, i) => `
                            <div class="vault-item">
                                <div class="item-icon">🔑</div>
                                <div class="item-content">
                                    <h4>${item.title}</h4>
                                    <p class="item-detail">Usuário: ${item.username}</p>
                                    <p class="item-detail encrypted-badge">🔒 Criptografado</p>
                                </div>
                                <div class="item-actions">
                                    <button onclick="ZKVault.viewPassword(${i})" class="btn-icon">👁️</button>
                                    <button onclick="ZKVault.deleteItem('passwords', ${i})" class="btn-icon">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render notes tab
     */
    renderNotesTab() {
        return `
            <div class="tab-content">
                <div class="content-header">
                    <h3>📝 Notas Seguras</h3>
                    <button onclick="ZKVault.addNote()" class="btn-primary">
                        ➕ Adicionar Nota
                    </button>
                </div>
                
                <div class="items-grid">
                    ${this.vaultData.notes.length === 0
                ? '<p class="empty-state">Nenhuma nota armazenada</p>'
                : this.vaultData.notes.map((item, i) => `
                            <div class="vault-item">
                                <div class="item-icon">📝</div>
                                <div class="item-content">
                                    <h4>${item.title}</h4>
                                    <p class="item-detail">${new Date(item.timestamp).toLocaleDateString()}</p>
                                    <p class="item-detail encrypted-badge">🔒 Criptografado</p>
                                </div>
                                <div class="item-actions">
                                    <button onclick="ZKVault.viewNote(${i})" class="btn-icon">👁️</button>
                                    <button onclick="ZKVault.deleteItem('notes', ${i})" class="btn-icon">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Switch between tabs
     */
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Render content
        const content = document.getElementById('vaultContent');
        if (tab === 'passwords') {
            content.innerHTML = this.renderPasswordsTab();
        } else if (tab === 'notes') {
            content.innerHTML = this.renderNotesTab();
        } else if (tab === 'documents') {
            content.innerHTML = '<p class="empty-state">Em breve...</p>';
        }
    },

    /**
     * Add password
     */
    async addPassword() {
        const title = prompt('Título (ex: Gmail, Facebook):');
        if (!title) return;

        const username = prompt('Usuário/Email:');
        if (!username) return;

        const password = prompt('Senha:');
        if (!password) return;

        try {
            // Encrypt password
            const encryptedPassword = await e2eeCrypto.encryptMessage(password, this.masterKey);

            this.vaultData.passwords.push({
                title,
                username,
                password: encryptedPassword,
                timestamp: Date.now()
            });

            await this.saveVaultData();
            this.switchTab('passwords');
            this.showNotification('✅ Senha adicionada!', 'success');
        } catch (error) {
            alert('Erro ao adicionar senha: ' + error.message);
        }
    },

    /**
     * View password
     */
    async viewPassword(index) {
        try {
            const item = this.vaultData.passwords[index];
            const decrypted = await e2eeCrypto.decryptMessage(item.password, this.masterKey);

            alert(`🔑 ${item.title}\n\nUsuário: ${item.username}\nSenha: ${decrypted}`);
        } catch (error) {
            alert('Erro ao descriptografar: ' + error.message);
        }
    },

    /**
     * Add note
     */
    async addNote() {
        const title = prompt('Título da nota:');
        if (!title) return;

        const content = prompt('Conteúdo:');
        if (!content) return;

        try {
            const encryptedContent = await e2eeCrypto.encryptMessage(content, this.masterKey);

            this.vaultData.notes.push({
                title,
                content: encryptedContent,
                timestamp: Date.now()
            });

            await this.saveVaultData();
            this.switchTab('notes');
            this.showNotification('✅ Nota adicionada!', 'success');
        } catch (error) {
            alert('Erro ao adicionar nota: ' + error.message);
        }
    },

    /**
     * View note
     */
    async viewNote(index) {
        try {
            const item = this.vaultData.notes[index];
            const decrypted = await e2eeCrypto.decryptMessage(item.content, this.masterKey);

            alert(`📝 ${item.title}\n\n${decrypted}`);
        } catch (error) {
            alert('Erro ao descriptografar: ' + error.message);
        }
    },

    /**
     * Delete item
     */
    async deleteItem(category, index) {
        if (!confirm('Deletar este item?')) return;

        this.vaultData[category].splice(index, 1);
        await this.saveVaultData();

        this.switchTab(category);
        this.showNotification('🗑️ Item deletado', 'info');
    },

    /**
     * Show age verification demo
     */
    async showAgeDemo() {
        const birthYear = prompt('Digite seu ano de nascimento (apenas para demonstração):');
        if (!birthYear) return;

        const birthdate = new Date(parseInt(birthYear), 0, 1);
        const minAge = 18;

        try {
            const proof = await zeroKnowledge.createAgeProof(birthdate, minAge);

            alert(`🎭 Prova Zero-Knowledge de Idade\n\n` +
                `✅ Prova gerada com sucesso!\n\n` +
                `Commitment: ${proof.commitment.substring(0, 32)}...\n` +
                `Range Proof: ${proof.rangeProof.substring(0, 32)}...\n\n` +
                `Resultado: ${proof.meetsRequirement ? '✅ Idade >= 18' : '❌ Idade < 18'}\n\n` +
                `Nota: Sua data de nascimento NÃO foi revelada!`);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    /**
     * Show attribute proof demo
     */
    async showAttributeDemo() {
        const value = prompt('Digite um valor numérico:');
        if (!value) return;

        const numValue = parseFloat(value);
        const predicate = (v) => v > 100;

        try {
            const proof = await zeroKnowledge.createAttributeProof('value', numValue, predicate);

            alert(`🎭 Prova Zero-Knowledge de Atributo\n\n` +
                `✅ Prova gerada com sucesso!\n\n` +
                `Atributo: ${proof.attribute}\n` +
                `Commitment: ${proof.commitment.substring(0, 32)}...\n` +
                `Proof: ${proof.proof.substring(0, 32)}...\n\n` +
                `Predicado (valor > 100): ${proof.predicateResult ? '✅ Verdadeiro' : '❌ Falso'}\n\n` +
                `Nota: O valor exato NÃO foi revelado!`);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    /**
     * Save vault metadata (salt, commitment)
     */
    saveVaultMetadata() {
        const metadata = {
            salt: Array.from(this.salt),
            commitment: this.commitment
        };
        localStorage.setItem('zk_vault_metadata', JSON.stringify(metadata));
    },

    /**
     * Load vault metadata
     */
    loadVaultMetadata() {
        const data = localStorage.getItem('zk_vault_metadata');
        if (data) {
            const metadata = JSON.parse(data);
            this.salt = new Uint8Array(metadata.salt);
            this.commitment = metadata.commitment;
        }
    },

    /**
     * Save encrypted vault data
     */
    async saveVaultData() {
        const encrypted = await e2eeCrypto.encryptMessage(
            JSON.stringify(this.vaultData),
            this.masterKey
        );
        localStorage.setItem('zk_vault_data', JSON.stringify(encrypted));
    },

    /**
     * Load and decrypt vault data
     */
    async loadVaultData() {
        const data = localStorage.getItem('zk_vault_data');
        if (data) {
            const encrypted = JSON.parse(data);
            const decrypted = await e2eeCrypto.decryptMessage(encrypted, this.masterKey);
            this.vaultData = JSON.parse(decrypted);
        }
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
