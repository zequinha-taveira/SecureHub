// ============================================
// E2EE Messenger Module
// Secure messaging with end-to-end encryption
// ============================================

const E2EEMessenger = {
    currentUser: null,
    contacts: new Map(),
    conversations: new Map(),

    /**
     * Initialize the E2EE Messenger interface
     */
    init() {
        return `
            <div class="e2ee-messenger">
                <div class="messenger-sidebar">
                    <div class="user-profile">
                        <h3>👤 Seu Perfil</h3>
                        <div id="userProfileSection">
                            <div class="profile-setup">
                                <input type="text" id="username" placeholder="Seu nome de usuário" class="input-field">
                                <button onclick="E2EEMessenger.createUser()" class="btn-primary">
                                    🔑 Gerar Chaves
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contacts-section">
                        <h3>📇 Contatos</h3>
                        <div id="contactsList" class="contacts-list">
                            <p class="empty-state">Nenhum contato ainda</p>
                        </div>
                        <button onclick="E2EEMessenger.showAddContact()" class="btn-secondary">
                            ➕ Adicionar Contato
                        </button>
                    </div>
                </div>
                
                <div class="messenger-main">
                    <div id="chatArea" class="chat-area">
                        <div class="welcome-screen">
                            <div class="welcome-icon">💬</div>
                            <h2>E2EE Messenger</h2>
                            <p>Mensagens criptografadas de ponta a ponta</p>
                            <div class="feature-list">
                                <div class="feature-item">
                                    <span class="feature-icon">🔐</span>
                                    <span>Criptografia ECDH + AES-256-GCM</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">🔒</span>
                                    <span>Chaves nunca saem do seu dispositivo</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">✅</span>
                                    <span>Verificação de identidade via fingerprints</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Create user profile and generate key pair
     */
    async createUser() {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Por favor, insira um nome de usuário');
            return;
        }

        try {
            // Generate key pair
            const keyData = await e2eeCrypto.generateKeyPair(username);

            this.currentUser = {
                username,
                publicKey: keyData.publicKey,
                fingerprint: keyData.fingerprint
            };

            // Save to localStorage
            localStorage.setItem('e2ee_user', JSON.stringify(this.currentUser));

            // Update UI
            this.renderUserProfile();
            this.showNotification('✅ Chaves geradas com sucesso!', 'success');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Erro ao gerar chaves: ' + error.message);
        }
    },

    /**
     * Render user profile section
     */
    renderUserProfile() {
        const section = document.getElementById('userProfileSection');
        section.innerHTML = `
            <div class="profile-info">
                <div class="profile-name">
                    <strong>${this.currentUser.username}</strong>
                    <span class="badge">🔐 Ativo</span>
                </div>
                <div class="fingerprint-display">
                    <label>Fingerprint:</label>
                    <code class="fingerprint">${this.formatFingerprint(this.currentUser.fingerprint)}</code>
                    <button onclick="E2EEMessenger.copyFingerprint()" class="btn-icon" title="Copiar">
                        📋
                    </button>
                </div>
                <div class="profile-actions">
                    <button onclick="E2EEMessenger.exportKeys()" class="btn-secondary btn-sm">
                        💾 Exportar Chaves
                    </button>
                    <button onclick="E2EEMessenger.showPublicKey()" class="btn-secondary btn-sm">
                        🔑 Ver Chave Pública
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Show add contact dialog
     */
    showAddContact() {
        if (!this.currentUser) {
            alert('Primeiro crie seu perfil!');
            return;
        }

        const contactName = prompt('Nome do contato:');
        if (!contactName) return;

        const publicKeyJson = prompt('Cole a chave pública do contato (JSON):');
        if (!publicKeyJson) return;

        try {
            const publicKey = JSON.parse(publicKeyJson);
            this.addContact(contactName, publicKey);
        } catch (error) {
            alert('Chave pública inválida: ' + error.message);
        }
    },

    /**
     * Add a contact
     */
    async addContact(name, publicKey) {
        try {
            const fingerprint = await e2eeCrypto.generateFingerprint(publicKey);

            this.contacts.set(name, {
                name,
                publicKey,
                fingerprint
            });

            // Save to localStorage
            const contactsArray = Array.from(this.contacts.entries());
            localStorage.setItem('e2ee_contacts', JSON.stringify(contactsArray));

            // Initialize conversation
            this.conversations.set(name, []);

            this.renderContacts();
            this.showNotification(`✅ Contato "${name}" adicionado!`, 'success');
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Erro ao adicionar contato: ' + error.message);
        }
    },

    /**
     * Render contacts list
     */
    renderContacts() {
        const list = document.getElementById('contactsList');

        if (this.contacts.size === 0) {
            list.innerHTML = '<p class="empty-state">Nenhum contato ainda</p>';
            return;
        }

        list.innerHTML = '';
        for (const [name, contact] of this.contacts) {
            const contactEl = document.createElement('div');
            contactEl.className = 'contact-item';
            contactEl.innerHTML = `
                <div class="contact-info">
                    <div class="contact-avatar">👤</div>
                    <div class="contact-details">
                        <div class="contact-name">${contact.name}</div>
                        <div class="contact-fingerprint">${this.formatFingerprint(contact.fingerprint).substring(0, 16)}...</div>
                    </div>
                </div>
            `;
            contactEl.onclick = () => this.openChat(name);
            list.appendChild(contactEl);
        }
    },

    /**
     * Open chat with a contact
     */
    async openChat(contactName) {
        const contact = this.contacts.get(contactName);
        if (!contact) return;

        const chatArea = document.getElementById('chatArea');
        chatArea.innerHTML = `
            <div class="chat-header">
                <div class="chat-contact-info">
                    <div class="contact-avatar-large">👤</div>
                    <div>
                        <h3>${contact.name}</h3>
                        <div class="fingerprint-small">
                            🔐 ${this.formatFingerprint(contact.fingerprint).substring(0, 16)}...
                        </div>
                    </div>
                </div>
                <button onclick="E2EEMessenger.verifyContact('${contactName}')" class="btn-secondary btn-sm">
                    ✅ Verificar Identidade
                </button>
            </div>
            
            <div id="messagesContainer" class="messages-container">
                ${this.renderMessages(contactName)}
            </div>
            
            <div class="chat-input-area">
                <input type="text" id="messageInput" placeholder="Digite sua mensagem..." class="message-input" onkeypress="if(event.key==='Enter') E2EEMessenger.sendMessage('${contactName}')">
                <button onclick="E2EEMessenger.sendMessage('${contactName}')" class="btn-send">
                    📤 Enviar
                </button>
            </div>
        `;

        // Focus input
        document.getElementById('messageInput').focus();
    },

    /**
     * Send encrypted message
     */
    async sendMessage(contactName) {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) return;

        try {
            const contact = this.contacts.get(contactName);

            // Derive shared secret
            const sharedSecret = await e2eeCrypto.deriveSharedSecret(
                this.currentUser.username,
                contact.publicKey
            );

            // Encrypt message
            const encrypted = await e2eeCrypto.encryptMessage(message, sharedSecret);

            // Store message
            const conversation = this.conversations.get(contactName) || [];
            conversation.push({
                type: 'sent',
                message,
                encrypted,
                timestamp: Date.now()
            });
            this.conversations.set(contactName, conversation);

            // Save to localStorage
            this.saveConversations();

            // Clear input and refresh
            input.value = '';
            this.openChat(contactName);

            this.showNotification('🔒 Mensagem criptografada e enviada!', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
        }
    },

    /**
     * Simulate receiving a message (for demo)
     */
    async receiveMessage(contactName, encryptedData) {
        try {
            const contact = this.contacts.get(contactName);

            // Derive shared secret
            const sharedSecret = await e2eeCrypto.deriveSharedSecret(
                this.currentUser.username,
                contact.publicKey
            );

            // Decrypt message
            const message = await e2eeCrypto.decryptMessage(encryptedData, sharedSecret);

            // Store message
            const conversation = this.conversations.get(contactName) || [];
            conversation.push({
                type: 'received',
                message,
                encrypted: encryptedData,
                timestamp: Date.now()
            });
            this.conversations.set(contactName, conversation);

            // Save and refresh
            this.saveConversations();
            this.openChat(contactName);
        } catch (error) {
            console.error('Error receiving message:', error);
        }
    },

    /**
     * Render messages in conversation
     */
    renderMessages(contactName) {
        const conversation = this.conversations.get(contactName) || [];

        if (conversation.length === 0) {
            return '<div class="empty-chat">🔐 Conversa criptografada. Envie a primeira mensagem!</div>';
        }

        return conversation.map(msg => `
            <div class="message ${msg.type}">
                <div class="message-content">
                    ${msg.message}
                </div>
                <div class="message-meta">
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    <span class="message-encrypted" title="Mensagem criptografada">🔒</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Verify contact identity
     */
    verifyContact(contactName) {
        const contact = this.contacts.get(contactName);
        if (!contact) return;

        alert(`Fingerprint do contato:\n\n${this.formatFingerprint(contact.fingerprint)}\n\nVerifique este código com ${contact.name} através de um canal seguro (pessoalmente, telefone, etc.)`);
    },

    /**
     * Export user keys for backup
     */
    async exportKeys() {
        try {
            const exported = await e2eeCrypto.exportKeyPair(this.currentUser.username);
            const json = JSON.stringify(exported, null, 2);

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `e2ee-keys-${this.currentUser.username}.json`;
            a.click();

            alert('⚠️ IMPORTANTE: Guarde este arquivo em local seguro! Ele contém suas chaves privadas.');
        } catch (error) {
            alert('Erro ao exportar chaves: ' + error.message);
        }
    },

    /**
     * Show public key for sharing
     */
    showPublicKey() {
        const json = JSON.stringify(this.currentUser.publicKey, null, 2);
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔑 Sua Chave Pública</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Compartilhe esta chave com seus contatos:</p>
                    <textarea readonly class="key-display">${json}</textarea>
                    <button onclick="navigator.clipboard.writeText(\`${json.replace(/`/g, '\\`')}\`); alert('Copiado!')" class="btn-primary">
                        📋 Copiar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * Copy fingerprint to clipboard
     */
    copyFingerprint() {
        navigator.clipboard.writeText(this.currentUser.fingerprint);
        this.showNotification('📋 Fingerprint copiado!', 'success');
    },

    /**
     * Format fingerprint for display
     */
    formatFingerprint(fingerprint) {
        return fingerprint.match(/.{1,4}/g).join(' ');
    },

    /**
     * Save conversations to localStorage
     */
    saveConversations() {
        const convArray = Array.from(this.conversations.entries());
        localStorage.setItem('e2ee_conversations', JSON.stringify(convArray));
    },

    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        // Load user
        const userData = localStorage.getItem('e2ee_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }

        // Load contacts
        const contactsData = localStorage.getItem('e2ee_contacts');
        if (contactsData) {
            const contactsArray = JSON.parse(contactsData);
            this.contacts = new Map(contactsArray);
        }

        // Load conversations
        const convData = localStorage.getItem('e2ee_conversations');
        if (convData) {
            const convArray = JSON.parse(convData);
            this.conversations = new Map(convArray);
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

// Load data when module loads
E2EEMessenger.loadFromStorage();
