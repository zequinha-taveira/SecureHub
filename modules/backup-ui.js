// ============================================
// Backup UI Module
// User interface for backup/restore
// ============================================

const BackupUI = {
    /**
     * Initialize backup interface
     */
    init() {
        return `
            <div class="backup-container">
                <div class="backup-header">
                    <h2>☁️ Sistema de Backup</h2>
                    <p class="backup-subtitle">Faça backup criptografado de todos os seus dados</p>
                </div>

                <div class="backup-sections">
                    <!-- Create Backup Section -->
                    <div class="backup-section">
                        <div class="section-icon">💾</div>
                        <h3>Criar Backup</h3>
                        <p>Exportar todos os dados criptografados</p>

                        <div class="form-group">
                            <label>Senha do Backup</label>
                            <input type="password" id="backupPassword" placeholder="Digite uma senha forte" class="input-field">
                            <small>Esta senha será necessária para restaurar o backup</small>
                        </div>

                        <div class="form-group">
                            <label>Confirmar Senha</label>
                            <input type="password" id="backupPasswordConfirm" placeholder="Confirme a senha" class="input-field">
                        </div>

                        <button onclick="BackupUI.createBackup()" class="btn-primary btn-large">
                            📦 Criar e Baixar Backup
                        </button>

                        <div id="backupProgress" class="progress-container" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="backupProgressFill"></div>
                            </div>
                            <p class="progress-text" id="backupProgressText">Criando backup...</p>
                        </div>
                    </div>

                    <!-- Restore Backup Section -->
                    <div class="backup-section">
                        <div class="section-icon">📥</div>
                        <h3>Restaurar Backup</h3>
                        <p>Importar dados de um backup anterior</p>

                        <div class="form-group">
                            <label>Arquivo de Backup</label>
                            <input type="file" id="backupFile" accept=".json" class="file-input">
                        </div>

                        <div class="form-group">
                            <label>Senha do Backup</label>
                            <input type="password" id="restorePassword" placeholder="Digite a senha do backup" class="input-field">
                        </div>

                        <div id="backupInfo" class="info-box" style="display: none;"></div>

                        <button onclick="BackupUI.restoreBackup()" class="btn-primary btn-large">
                            🔄 Restaurar Backup
                        </button>

                        <div id="restoreProgress" class="progress-container" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="restoreProgressFill"></div>
                            </div>
                            <p class="progress-text" id="restoreProgressText">Restaurando backup...</p>
                        </div>
                    </div>

                    <!-- Storage Info Section -->
                    <div class="backup-section">
                        <div class="section-icon">📊</div>
                        <h3>Informações de Armazenamento</h3>
                        <div id="storageInfo" class="storage-info">
                            <p>Carregando...</p>
                        </div>
                        <button onclick="BackupUI.refreshStorageInfo()" class="btn-secondary">
                            🔄 Atualizar
                        </button>
                    </div>
                </div>

                <div class="backup-warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Guarde sua senha de backup em local seguro</li>
                        <li>Sem a senha, não é possível recuperar os dados</li>
                        <li>Faça backups regularmente</li>
                        <li>Armazene backups em múltiplos locais seguros</li>
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Create and download backup
     */
    async createBackup() {
        const password = document.getElementById('backupPassword').value;
        const confirm = document.getElementById('backupPasswordConfirm').value;

        if (!password || password.length < 8) {
            alert('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        if (password !== confirm) {
            alert('As senhas não coincidem');
            return;
        }

        try {
            // Show progress
            const progressContainer = document.getElementById('backupProgress');
            const progressFill = document.getElementById('backupProgressFill');
            const progressText = document.getElementById('backupProgressText');

            progressContainer.style.display = 'block';
            progressFill.style.width = '30%';
            progressText.textContent = 'Coletando dados...';

            // Create backup
            const backupData = await backupManager.createBackup(password);

            progressFill.style.width = '70%';
            progressText.textContent = 'Criptografando...';

            // Small delay for UI
            await new Promise(resolve => setTimeout(resolve, 500));

            // Export to file
            backupManager.exportToFile(backupData);

            progressFill.style.width = '100%';
            progressText.textContent = 'Backup concluído!';

            // Hide progress after delay
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
            }, 2000);

            // Clear passwords
            document.getElementById('backupPassword').value = '';
            document.getElementById('backupPasswordConfirm').value = '';

            alert('✅ Backup criado e baixado com sucesso!');
        } catch (error) {
            console.error('Backup error:', error);
            alert('Erro ao criar backup: ' + error.message);
            document.getElementById('backupProgress').style.display = 'none';
        }
    },

    /**
     * Restore from backup
     */
    async restoreBackup() {
        const fileInput = document.getElementById('backupFile');
        const password = document.getElementById('restorePassword').value;

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Selecione um arquivo de backup');
            return;
        }

        if (!password) {
            alert('Digite a senha do backup');
            return;
        }

        if (!confirm('⚠️ ATENÇÃO: Restaurar um backup irá SUBSTITUIR todos os dados atuais. Continuar?')) {
            return;
        }

        try {
            // Show progress
            const progressContainer = document.getElementById('restoreProgress');
            const progressFill = document.getElementById('restoreProgressFill');
            const progressText = document.getElementById('restoreProgressText');

            progressContainer.style.display = 'block';
            progressFill.style.width = '20%';
            progressText.textContent = 'Lendo arquivo...';

            // Import file
            const backupData = await backupManager.importFromFile(fileInput.files[0]);

            progressFill.style.width = '50%';
            progressText.textContent = 'Descriptografando...';

            // Restore backup
            const result = await backupManager.restoreBackup(backupData, password);

            progressFill.style.width = '100%';
            progressText.textContent = 'Restauração concluída!';

            // Hide progress after delay
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
            }, 2000);

            // Clear password
            document.getElementById('restorePassword').value = '';
            fileInput.value = '';

            alert(`✅ Backup restaurado com sucesso!\n\nVersão: ${result.version}\nData: ${new Date(result.timestamp).toLocaleString()}`);

            // Reload page to reflect changes
            if (confirm('Recarregar a página para aplicar as mudanças?')) {
                location.reload();
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert('Erro ao restaurar backup: ' + error.message);
            document.getElementById('restoreProgress').style.display = 'none';
        }
    },

    /**
     * Show backup file info
     */
    async showBackupInfo() {
        const fileInput = document.getElementById('backupFile');
        const infoDiv = document.getElementById('backupInfo');

        if (!fileInput.files || fileInput.files.length === 0) {
            infoDiv.style.display = 'none';
            return;
        }

        try {
            const backupData = await backupManager.importFromFile(fileInput.files[0]);
            const info = backupManager.getBackupInfo(backupData);

            infoDiv.innerHTML = `
                <strong>📋 Informações do Backup:</strong><br>
                Versão: ${info.version}<br>
                Data: ${info.date}<br>
                Tamanho: ${fileManager.formatFileSize(info.size)}
            `;
            infoDiv.style.display = 'block';
        } catch (error) {
            infoDiv.innerHTML = '<strong>❌ Arquivo de backup inválido</strong>';
            infoDiv.style.display = 'block';
        }
    },

    /**
     * Refresh storage information
     */
    async refreshStorageInfo() {
        const infoDiv = document.getElementById('storageInfo');
        infoDiv.innerHTML = '<p>Carregando...</p>';

        try {
            const storageInfo = await indexedDBStorage.getStorageInfo();

            if (storageInfo) {
                infoDiv.innerHTML = `
                    <div class="storage-stat">
                        <span class="stat-label">Uso:</span>
                        <span class="stat-value">${fileManager.formatFileSize(storageInfo.usage)}</span>
                    </div>
                    <div class="storage-stat">
                        <span class="stat-label">Quota:</span>
                        <span class="stat-value">${fileManager.formatFileSize(storageInfo.quota)}</span>
                    </div>
                    <div class="storage-stat">
                        <span class="stat-label">Disponível:</span>
                        <span class="stat-value">${fileManager.formatFileSize(storageInfo.available)}</span>
                    </div>
                    <div class="storage-stat">
                        <span class="stat-label">Percentual:</span>
                        <span class="stat-value">${storageInfo.usagePercent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${storageInfo.usagePercent}%"></div>
                    </div>
                `;
            } else {
                infoDiv.innerHTML = '<p>Informações de armazenamento não disponíveis</p>';
            }
        } catch (error) {
            infoDiv.innerHTML = '<p>Erro ao carregar informações</p>';
        }
    }
};

// Auto-refresh storage info when backup file changes
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('backupFile');
    if (fileInput) {
        fileInput.addEventListener('change', () => BackupUI.showBackupInfo());
    }
});
