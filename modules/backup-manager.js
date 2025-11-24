// ============================================
// Backup Manager Module
// Encrypted backup and restore system
// ============================================

class BackupManager {
    constructor() {
        this.backupVersion = '1.0.0';
    }

    /**
     * Create encrypted backup of all data
     * @param {string} password - Backup password
     * @returns {Promise<Object>} Backup data
     */
    async createBackup(password) {
        if (!password || password.length < 8) {
            throw new Error('Senha deve ter pelo menos 8 caracteres');
        }

        try {
            // Collect all data
            const data = {
                version: this.backupVersion,
                timestamp: Date.now(),
                vault: await this.exportVaultData(),
                messenger: await this.exportMessengerData(),
                settings: this.exportSettings()
            };

            // Convert to JSON
            const jsonData = JSON.stringify(data);

            // Compress (simple base64 for now, could use pako.js for real compression)
            const compressed = btoa(jsonData);

            // Generate salt for key derivation
            const salt = crypto.getRandomValues(new Uint8Array(16));

            // Derive backup key from password
            const backupKey = await e2eeCrypto.deriveKeyFromPassword(password, salt);

            // Encrypt backup
            const encrypted = await e2eeCrypto.encryptMessage(compressed, backupKey);

            return {
                version: this.backupVersion,
                timestamp: Date.now(),
                salt: Array.from(salt),
                data: encrypted
            };
        } catch (error) {
            console.error('Backup creation error:', error);
            throw new Error('Erro ao criar backup: ' + error.message);
        }
    }

    /**
     * Restore from encrypted backup
     * @param {Object} backupData - Backup data
     * @param {string} password - Backup password
     * @returns {Promise<Object>} Restore result
     */
    async restoreBackup(backupData, password) {
        if (!password) {
            throw new Error('Senha é obrigatória');
        }

        try {
            // Derive key from password
            const salt = new Uint8Array(backupData.salt);
            const backupKey = await e2eeCrypto.deriveKeyFromPassword(password, salt);

            // Decrypt backup
            const decrypted = await e2eeCrypto.decryptMessage(backupData.data, backupKey);

            // Decompress
            const decompressed = atob(decrypted);

            // Parse JSON
            const data = JSON.parse(decompressed);

            // Validate version
            if (data.version !== this.backupVersion) {
                console.warn(`Backup version mismatch: ${data.version} vs ${this.backupVersion}`);
            }

            // Restore data
            const results = {
                vault: await this.restoreVaultData(data.vault),
                messenger: await this.restoreMessengerData(data.messenger),
                settings: this.restoreSettings(data.settings)
            };

            return {
                success: true,
                version: data.version,
                timestamp: data.timestamp,
                results
            };
        } catch (error) {
            console.error('Backup restore error:', error);
            throw new Error('Erro ao restaurar backup: ' + error.message);
        }
    }

    /**
     * Export vault data
     * @returns {Promise<Object>} Vault data
     */
    async exportVaultData() {
        if (typeof ZKVault === 'undefined') return null;

        const vaultMetadata = localStorage.getItem('zk_vault_metadata');
        const vaultData = localStorage.getItem('zk_vault_data');

        return {
            metadata: vaultMetadata,
            data: vaultData
        };
    }

    /**
     * Export messenger data
     * @returns {Promise<Object>} Messenger data
     */
    async exportMessengerData() {
        if (typeof E2EEMessenger === 'undefined') return null;

        const userData = localStorage.getItem('e2ee_user');
        const contacts = localStorage.getItem('e2ee_contacts');
        const conversations = localStorage.getItem('e2ee_conversations');

        return {
            user: userData,
            contacts,
            conversations
        };
    }

    /**
     * Export settings
     * @returns {Object} Settings data
     */
    exportSettings() {
        const theme = localStorage.getItem('theme');
        return { theme };
    }

    /**
     * Restore vault data
     * @param {Object} vaultData - Vault data to restore
     * @returns {Promise<boolean>} Success
     */
    async restoreVaultData(vaultData) {
        if (!vaultData) return false;

        if (vaultData.metadata) {
            localStorage.setItem('zk_vault_metadata', vaultData.metadata);
        }
        if (vaultData.data) {
            localStorage.setItem('zk_vault_data', vaultData.data);
        }

        return true;
    }

    /**
     * Restore messenger data
     * @param {Object} messengerData - Messenger data to restore
     * @returns {Promise<boolean>} Success
     */
    async restoreMessengerData(messengerData) {
        if (!messengerData) return false;

        if (messengerData.user) {
            localStorage.setItem('e2ee_user', messengerData.user);
        }
        if (messengerData.contacts) {
            localStorage.setItem('e2ee_contacts', messengerData.contacts);
        }
        if (messengerData.conversations) {
            localStorage.setItem('e2ee_conversations', messengerData.conversations);
        }

        return true;
    }

    /**
     * Restore settings
     * @param {Object} settings - Settings to restore
     * @returns {boolean} Success
     */
    restoreSettings(settings) {
        if (!settings) return false;

        if (settings.theme) {
            localStorage.setItem('theme', settings.theme);
        }

        return true;
    }

    /**
     * Export backup to file
     * @param {Object} backupData - Backup data
     * @param {string} filename - Optional filename
     */
    exportToFile(backupData, filename = null) {
        const defaultFilename = `securehub-backup-${new Date().toISOString().split('T')[0]}.json`;
        const finalFilename = filename || defaultFilename;

        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import backup from file
     * @param {File} file - Backup file
     * @returns {Promise<Object>} Backup data
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    resolve(backupData);
                } catch (error) {
                    reject(new Error('Arquivo de backup inválido'));
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Get backup info without decrypting
     * @param {Object} backupData - Backup data
     * @returns {Object} Backup info
     */
    getBackupInfo(backupData) {
        return {
            version: backupData.version,
            timestamp: backupData.timestamp,
            date: new Date(backupData.timestamp).toLocaleString(),
            size: JSON.stringify(backupData).length
        };
    }
}

// Export singleton instance
const backupManager = new BackupManager();
