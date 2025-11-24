// ============================================
// Crypto Worker
// Web Worker for heavy cryptographic operations
// ============================================

/**
 * This worker handles CPU-intensive cryptographic operations
 * to prevent blocking the main UI thread
 */

// Listen for messages from main thread
self.addEventListener('message', async (event) => {
    const { id, type, data } = event.data;

    try {
        let result;

        switch (type) {
            case 'deriveKey':
                result = await deriveKeyFromPassword(data);
                break;

            case 'encryptData':
                result = await encryptData(data);
                break;

            case 'decryptData':
                result = await decryptData(data);
                break;

            case 'generateKeyPair':
                result = await generateKeyPair(data);
                break;

            case 'deriveSharedSecret':
                result = await deriveSharedSecret(data);
                break;

            case 'hashData':
                result = await hashData(data);
                break;

            default:
                throw new Error(`Unknown operation type: ${type}`);
        }

        // Send success response
        self.postMessage({
            id,
            success: true,
            result
        });

    } catch (error) {
        // Send error response
        self.postMessage({
            id,
            success: false,
            error: error.message
        });
    }
});

// ============================================
// Cryptographic Operations
// ============================================

/**
 * Derive encryption key from password using PBKDF2
 * @param {Object} data - { password, salt, iterations }
 * @returns {Promise<Object>} Derived key data
 */
async function deriveKeyFromPassword({ password, salt, iterations = 100000 }) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = typeof salt === 'string'
        ? Uint8Array.from(atob(salt), c => c.charCodeAt(0))
        : new Uint8Array(salt);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive AES key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );

    // Export key for transmission
    const exportedKey = await crypto.subtle.exportKey('jwk', key);

    return {
        key: exportedKey,
        salt: btoa(String.fromCharCode(...saltBuffer))
    };
}

/**
 * Encrypt data using AES-256-GCM
 * @param {Object} data - { plaintext, keyJwk }
 * @returns {Promise<Object>} Encrypted data
 */
async function encryptData({ plaintext, keyJwk }) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Import key
    const key = await crypto.subtle.importKey(
        'jwk',
        keyJwk,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt']
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        data
    );

    // Convert to base64
    const encryptedArray = Array.from(new Uint8Array(encrypted));
    const ivArray = Array.from(iv);

    return {
        ciphertext: btoa(String.fromCharCode(...encryptedArray)),
        iv: btoa(String.fromCharCode(...ivArray)),
        timestamp: Date.now()
    };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} data - { ciphertext, iv, keyJwk }
 * @returns {Promise<string>} Decrypted plaintext
 */
async function decryptData({ ciphertext, iv, keyJwk }) {
    // Convert from base64
    const encryptedData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    // Import key
    const key = await crypto.subtle.importKey(
        'jwk',
        keyJwk,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivData
        },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Generate ECDH key pair
 * @param {Object} data - { curve }
 * @returns {Promise<Object>} Key pair
 */
async function generateKeyPair({ curve = 'P-256' } = {}) {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: curve
        },
        true,
        ['deriveKey', 'deriveBits']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk
    };
}

/**
 * Derive shared secret using ECDH
 * @param {Object} data - { privateKeyJwk, publicKeyJwk }
 * @returns {Promise<Object>} Shared secret key
 */
async function deriveSharedSecret({ privateKeyJwk, publicKeyJwk }) {
    // Import keys
    const privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        false,
        ['deriveKey']
    );

    const publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        false,
        []
    );

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );

    // Export for transmission
    const exportedKey = await crypto.subtle.exportKey('jwk', sharedSecret);

    return {
        sharedSecret: exportedKey
    };
}

/**
 * Hash data using SHA-256
 * @param {Object} data - { message }
 * @returns {Promise<string>} Hash in hex format
 */
async function hashData({ message }) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Notify that worker is ready
self.postMessage({ type: 'ready' });
