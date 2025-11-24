// ============================================
// E2EE Cryptographic Module
// End-to-End Encryption using ECDH + AES-256-GCM
// ============================================

class E2EECrypto {
    constructor() {
        this.keyPairs = new Map(); // Store key pairs for different users
        this.sharedSecrets = new Map(); // Store derived shared secrets
    }

    /**
     * Generate an ECDH key pair for a user
     * @param {string} userId - Unique identifier for the user
     * @returns {Promise<Object>} Key pair with public and private keys
     */
    async generateKeyPair(userId) {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDH",
                    namedCurve: "P-256"
                },
                true, // extractable
                ["deriveKey", "deriveBits"]
            );

            // Export public key for sharing
            const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
            
            // Store the key pair
            this.keyPairs.set(userId, keyPair);

            return {
                userId,
                publicKey: publicKeyJwk,
                privateKey: keyPair.privateKey,
                fingerprint: await this.generateFingerprint(publicKeyJwk)
            };
        } catch (error) {
            console.error('Error generating key pair:', error);
            throw new Error('Failed to generate key pair');
        }
    }

    /**
     * Generate a fingerprint for a public key (for verification)
     * @param {Object} publicKeyJwk - Public key in JWK format
     * @returns {Promise<string>} Hex fingerprint
     */
    async generateFingerprint(publicKeyJwk) {
        const keyString = JSON.stringify(publicKeyJwk);
        const encoder = new TextEncoder();
        const data = encoder.encode(keyString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    }

    /**
     * Derive a shared secret from local private key and remote public key
     * @param {string} localUserId - Local user ID
     * @param {Object} remotePublicKeyJwk - Remote user's public key
     * @returns {Promise<CryptoKey>} Derived AES key
     */
    async deriveSharedSecret(localUserId, remotePublicKeyJwk) {
        try {
            const localKeyPair = this.keyPairs.get(localUserId);
            if (!localKeyPair) {
                throw new Error('Local key pair not found');
            }

            // Import remote public key
            const remotePublicKey = await window.crypto.subtle.importKey(
                "jwk",
                remotePublicKeyJwk,
                {
                    name: "ECDH",
                    namedCurve: "P-256"
                },
                true,
                []
            );

            // Derive shared secret
            const sharedSecret = await window.crypto.subtle.deriveKey(
                {
                    name: "ECDH",
                    public: remotePublicKey
                },
                localKeyPair.privateKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                ["encrypt", "decrypt"]
            );

            return sharedSecret;
        } catch (error) {
            console.error('Error deriving shared secret:', error);
            throw new Error('Failed to derive shared secret');
        }
    }

    /**
     * Encrypt a message using AES-256-GCM
     * @param {string} message - Plain text message
     * @param {CryptoKey} key - AES key
     * @returns {Promise<Object>} Encrypted data with IV
     */
    async encryptMessage(message, key) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encrypt
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                data
            );

            // Convert to base64 for storage/transmission
            const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
            const ivArray = Array.from(iv);

            return {
                ciphertext: btoa(String.fromCharCode(...encryptedArray)),
                iv: btoa(String.fromCharCode(...ivArray)),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * Decrypt a message using AES-256-GCM
     * @param {Object} encryptedData - Encrypted data with IV
     * @param {CryptoKey} key - AES key
     * @returns {Promise<string>} Decrypted message
     */
    async decryptMessage(encryptedData, key) {
        try {
            // Convert from base64
            const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));

            // Decrypt
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (error) {
            console.error('Error decrypting message:', error);
            throw new Error('Failed to decrypt message - invalid key or corrupted data');
        }
    }

    /**
     * Export key pair for backup
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Exportable key pair
     */
    async exportKeyPair(userId) {
        const keyPair = this.keyPairs.get(userId);
        if (!keyPair) {
            throw new Error('Key pair not found');
        }

        const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        return {
            userId,
            publicKey: publicKeyJwk,
            privateKey: privateKeyJwk,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import key pair from backup
     * @param {Object} exportedKeyPair - Exported key pair
     * @returns {Promise<void>}
     */
    async importKeyPair(exportedKeyPair) {
        try {
            const publicKey = await window.crypto.subtle.importKey(
                "jwk",
                exportedKeyPair.publicKey,
                {
                    name: "ECDH",
                    namedCurve: "P-256"
                },
                true,
                []
            );

            const privateKey = await window.crypto.subtle.importKey(
                "jwk",
                exportedKeyPair.privateKey,
                {
                    name: "ECDH",
                    namedCurve: "P-256"
                },
                true,
                ["deriveKey", "deriveBits"]
            );

            this.keyPairs.set(exportedKeyPair.userId, { publicKey, privateKey });
        } catch (error) {
            console.error('Error importing key pair:', error);
            throw new Error('Failed to import key pair');
        }
    }

    /**
     * Generate a signing key pair for message authentication
     * @returns {Promise<CryptoKeyPair>} ECDSA key pair
     */
    async generateSigningKeyPair() {
        return await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["sign", "verify"]
        );
    }

    /**
     * Sign a message for authenticity
     * @param {string} message - Message to sign
     * @param {CryptoKey} privateKey - Private signing key
     * @returns {Promise<string>} Base64 signature
     */
    async signMessage(message, privateKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }
            },
            privateKey,
            data
        );

        const signatureArray = Array.from(new Uint8Array(signature));
        return btoa(String.fromCharCode(...signatureArray));
    }

    /**
     * Verify a message signature
     * @param {string} message - Original message
     * @param {string} signatureBase64 - Base64 signature
     * @param {CryptoKey} publicKey - Public signing key
     * @returns {Promise<boolean>} Verification result
     */
    async verifySignature(message, signatureBase64, publicKey) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

            return await window.crypto.subtle.verify(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" }
                },
                publicKey,
                signature,
                data
            );
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    /**
     * Secure key derivation from password (for vault encryption)
     * @param {string} password - User password
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>} Derived AES key
     */
    async deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as key material
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        // Derive AES key
        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
    }
}

// Export singleton instance
const e2eeCrypto = new E2EECrypto();
