// ============================================
// IndexedDB Storage Module
// Wrapper for IndexedDB operations
// ============================================

class IndexedDBStorage {
    constructor(dbName = 'SecureHubDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * Initialize database
     * @returns {Promise<void>}
     */
    async init() {
        if (this.db) return; // Already initialized

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    fileStore.createIndex('messageId', 'messageId', { unique: false });
                    fileStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('IndexedDB schema created');
            };
        });
    }

    /**
     * Add file to storage
     * @param {Object} fileData - File data to store
     * @returns {Promise<number>} File ID
     */
    async addFile(fileData) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.add(fileData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get file by ID
     * @param {number} id - File ID
     * @returns {Promise<Object>} File data
     */
    async getFile(id) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get files by message ID
     * @param {string} messageId - Message ID
     * @returns {Promise<Array>} Array of files
     */
    async getFilesByMessage(messageId) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('messageId');
            const request = index.getAll(messageId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete file by ID
     * @param {number} id - File ID
     * @returns {Promise<void>}
     */
    async deleteFile(id) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all files
     * @returns {Promise<Array>} Array of all files
     */
    async getAllFiles() {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get storage usage estimate
     * @returns {Promise<Object>} Storage info
     */
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2),
                available: estimate.quota - estimate.usage
            };
        }
        return null;
    }

    /**
     * Clear all files (cleanup)
     * @returns {Promise<void>}
     */
    async clearAllFiles() {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.clear();

            request.onsuccess = () => {
                console.log('All files cleared from IndexedDB');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete old files to free space
     * @param {number} daysOld - Delete files older than this many days
     * @returns {Promise<number>} Number of files deleted
     */
    async cleanupOldFiles(daysOld = 30) {
        await this.init();

        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const index = store.index('timestamp');
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.timestamp < cutoffTime) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`🧹 Cleaned up ${deletedCount} old files`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
const indexedDBStorage = new IndexedDBStorage();
