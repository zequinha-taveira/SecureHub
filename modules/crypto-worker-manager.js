// ============================================
// Crypto Worker Manager
// Manages Web Worker pool for crypto operations
// ============================================

class CryptoWorkerManager {
    constructor(workerCount = 2) {
        this.workers = [];
        this.workerCount = workerCount;
        this.nextWorkerId = 0;
        this.pendingOperations = new Map();
        this.operationId = 0;
        this.initialized = false;
    }

    /**
     * Initialize worker pool
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;

        const workerPath = 'workers/crypto-worker.js';

        for (let i = 0; i < this.workerCount; i++) {
            try {
                const worker = new Worker(workerPath);

                // Handle messages from worker
                worker.addEventListener('message', (event) => {
                    this.handleWorkerMessage(event.data);
                });

                // Handle errors
                worker.addEventListener('error', (error) => {
                    console.error('Worker error:', error);
                });

                this.workers.push({
                    worker,
                    busy: false,
                    id: i
                });

            } catch (error) {
                console.error('Failed to create worker:', error);
                // Fallback: continue without workers
                break;
            }
        }

        this.initialized = this.workers.length > 0;

        if (this.initialized) {
            console.log(`✅ Crypto Worker Pool initialized with ${this.workers.length} workers`);
        } else {
            console.warn('⚠️ Web Workers not available - using main thread');
        }
    }

    /**
     * Handle message from worker
     * @param {Object} data - Message data
     */
    handleWorkerMessage(data) {
        if (data.type === 'ready') {
            return;
        }

        const { id, success, result, error } = data;
        const pending = this.pendingOperations.get(id);

        if (!pending) return;

        // Clear timeout
        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
        }

        // Resolve or reject promise
        if (success) {
            pending.resolve(result);
        } else {
            pending.reject(new Error(error));
        }

        // Remove from pending
        this.pendingOperations.delete(id);

        // Mark worker as available
        if (pending.workerId !== undefined) {
            const worker = this.workers[pending.workerId];
            if (worker) {
                worker.busy = false;
            }
        }
    }

    /**
     * Get next available worker
     * @returns {Object|null} Worker object or null
     */
    getAvailableWorker() {
        return this.workers.find(w => !w.busy) || null;
    }

    /**
     * Execute operation in worker
     * @param {string} type - Operation type
     * @param {Object} data - Operation data
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<any>} Operation result
     */
    async execute(type, data, timeout = 30000) {
        if (!this.initialized) {
            await this.initialize();
        }

        // If no workers available, execute in main thread
        if (this.workers.length === 0) {
            return this.executeInMainThread(type, data);
        }

        // Get available worker
        const workerObj = this.getAvailableWorker();

        if (!workerObj) {
            // All workers busy, execute in main thread
            console.warn('All workers busy, using main thread');
            return this.executeInMainThread(type, data);
        }

        // Mark worker as busy
        workerObj.busy = true;

        // Create operation promise
        const operationId = this.operationId++;

        return new Promise((resolve, reject) => {
            // Set timeout
            const timeoutId = setTimeout(() => {
                this.pendingOperations.delete(operationId);
                workerObj.busy = false;
                reject(new Error('Operation timeout'));
            }, timeout);

            // Store pending operation
            this.pendingOperations.set(operationId, {
                resolve,
                reject,
                timeoutId,
                workerId: workerObj.id
            });

            // Send message to worker
            workerObj.worker.postMessage({
                id: operationId,
                type,
                data
            });
        });
    }

    /**
     * Fallback: execute in main thread
     * @param {string} type - Operation type
     * @param {Object} data - Operation data
     * @returns {Promise<any>} Result
     */
    async executeInMainThread(type, data) {
        // Use existing e2eeCrypto methods as fallback
        switch (type) {
            case 'deriveKey':
                return await e2eeCrypto.deriveKeyFromPassword(data.password, new Uint8Array(16));

            case 'encryptData':
                // Fallback to existing encryption
                throw new Error('Main thread fallback not implemented for this operation');

            default:
                throw new Error(`Unknown operation: ${type}`);
        }
    }

    /**
     * Terminate all workers
     */
    terminate() {
        this.workers.forEach(({ worker }) => {
            worker.terminate();
        });
        this.workers = [];
        this.initialized = false;
        console.log('Crypto workers terminated');
    }

    // ============================================
    // Convenience Methods
    // ============================================

    /**
     * Derive key from password
     * @param {string} password - Password
     * @param {string|Uint8Array} salt - Salt
     * @param {number} iterations - PBKDF2 iterations
     * @returns {Promise<Object>} Derived key
     */
    async deriveKey(password, salt, iterations = 100000) {
        return this.execute('deriveKey', { password, salt, iterations });
    }

    /**
     * Encrypt data
     * @param {string} plaintext - Data to encrypt
     * @param {Object} keyJwk - AES key in JWK format
     * @returns {Promise<Object>} Encrypted data
     */
    async encrypt(plaintext, keyJwk) {
        return this.execute('encryptData', { plaintext, keyJwk });
    }

    /**
     * Decrypt data
     * @param {string} ciphertext - Encrypted data
     * @param {string} iv - Initialization vector
     * @param {Object} keyJwk - AES key in JWK format
     * @returns {Promise<string>} Decrypted plaintext
     */
    async decrypt(ciphertext, iv, keyJwk) {
        return this.execute('decryptData', { ciphertext, iv, keyJwk });
    }

    /**
     * Generate ECDH key pair
     * @param {string} curve - Curve name
     * @returns {Promise<Object>} Key pair
     */
    async generateKeyPair(curve = 'P-256') {
        return this.execute('generateKeyPair', { curve });
    }

    /**
     * Derive shared secret
     * @param {Object} privateKeyJwk - Private key
     * @param {Object} publicKeyJwk - Public key
     * @returns {Promise<Object>} Shared secret
     */
    async deriveSharedSecret(privateKeyJwk, publicKeyJwk) {
        return this.execute('deriveSharedSecret', { privateKeyJwk, publicKeyJwk });
    }

    /**
     * Hash data
     * @param {string} message - Message to hash
     * @returns {Promise<string>} Hash
     */
    async hash(message) {
        return this.execute('hashData', { message });
    }
}

// Export singleton instance
const cryptoWorker = new CryptoWorkerManager(2);

// Initialize on load
cryptoWorker.initialize().catch(err => {
    console.warn('Failed to initialize crypto workers:', err);
});
