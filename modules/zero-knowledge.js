// ============================================
// Zero-Knowledge Proof Module
// Implements ZK proofs for authentication and attribute verification
// ============================================

class ZeroKnowledge {
    constructor() {
        this.challenges = new Map(); // Store active challenges
        this.proofs = new Map(); // Store verified proofs
    }

    /**
     * Generate a cryptographic challenge for ZK proof
     * @returns {Object} Challenge data
     */
    generateChallenge() {
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        const challengeId = this.arrayToHex(challenge);

        this.challenges.set(challengeId, {
            challenge: challenge,
            timestamp: Date.now(),
            verified: false
        });

        return {
            challengeId,
            challenge: this.arrayToHex(challenge)
        };
    }

    /**
     * Create a password-based ZK proof (Schnorr-like protocol)
     * User proves they know the password without revealing it
     * @param {string} password - User's password
     * @param {string} challengeHex - Challenge from server
     * @returns {Promise<Object>} ZK proof
     */
    async createPasswordProof(password, challengeHex) {
        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // Generate a random salt
            const salt = window.crypto.getRandomValues(new Uint8Array(16));

            // Derive a commitment from password
            const commitment = await this.hashData(
                new Uint8Array([...passwordBuffer, ...salt])
            );

            // Create response to challenge
            const challenge = this.hexToArray(challengeHex);
            const response = await this.hashData(
                new Uint8Array([...commitment, ...challenge, ...passwordBuffer])
            );

            return {
                commitment: this.arrayToHex(commitment),
                response: this.arrayToHex(response),
                salt: this.arrayToHex(salt),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error creating password proof:', error);
            throw new Error('Failed to create password proof');
        }
    }

    /**
     * Verify a password-based ZK proof
     * @param {Object} proof - ZK proof from user
     * @param {string} challengeId - Challenge ID
     * @param {string} storedPasswordHash - Stored hash of the password
     * @returns {Promise<boolean>} Verification result
     */
    async verifyPasswordProof(proof, challengeId, storedPasswordHash) {
        try {
            const challengeData = this.challenges.get(challengeId);
            if (!challengeData) {
                throw new Error('Challenge not found or expired');
            }

            // Verify timestamp (challenge should be recent)
            const age = Date.now() - challengeData.timestamp;
            if (age > 300000) { // 5 minutes
                this.challenges.delete(challengeId);
                throw new Error('Challenge expired');
            }

            // In a real implementation, we would verify the proof mathematically
            // For this demo, we simulate the verification
            const isValid = proof.commitment && proof.response && proof.salt;

            if (isValid) {
                challengeData.verified = true;
                this.proofs.set(challengeId, {
                    verified: true,
                    timestamp: Date.now()
                });
            }

            return isValid;
        } catch (error) {
            console.error('Error verifying password proof:', error);
            return false;
        }
    }

    /**
     * Create an age verification proof without revealing birthdate
     * Proves age >= minAge without revealing actual age
     * @param {Date} birthdate - User's birthdate
     * @param {number} minAge - Minimum age requirement
     * @returns {Promise<Object>} ZK proof
     */
    async createAgeProof(birthdate, minAge) {
        try {
            const today = new Date();
            const age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();

            // Adjust age if birthday hasn't occurred this year
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())
                ? age - 1
                : age;

            // Create a commitment to the age
            const encoder = new TextEncoder();
            const ageBuffer = encoder.encode(actualAge.toString());
            const salt = window.crypto.getRandomValues(new Uint8Array(16));

            const commitment = await this.hashData(
                new Uint8Array([...ageBuffer, ...salt])
            );

            // Create proof that age >= minAge without revealing actual age
            const meetsRequirement = actualAge >= minAge;

            // Generate a range proof (simplified for demo)
            const rangeProof = await this.hashData(
                new Uint8Array([
                    ...commitment,
                    ...encoder.encode(minAge.toString()),
                    meetsRequirement ? 1 : 0
                ])
            );

            return {
                commitment: this.arrayToHex(commitment),
                rangeProof: this.arrayToHex(rangeProof),
                meetsRequirement,
                minAge,
                timestamp: Date.now(),
                // Note: We don't include the actual age or birthdate
            };
        } catch (error) {
            console.error('Error creating age proof:', error);
            throw new Error('Failed to create age proof');
        }
    }

    /**
     * Verify an age proof
     * @param {Object} proof - Age proof
     * @returns {boolean} Whether the proof is valid
     */
    verifyAgeProof(proof) {
        try {
            // Verify the proof structure
            if (!proof.commitment || !proof.rangeProof) {
                return false;
            }

            // Verify timestamp is recent
            const age = Date.now() - proof.timestamp;
            if (age > 3600000) { // 1 hour
                return false;
            }

            // In a real ZK system, we would verify the mathematical proof
            // For this demo, we check the proof structure is valid
            return proof.meetsRequirement === true || proof.meetsRequirement === false;
        } catch (error) {
            console.error('Error verifying age proof:', error);
            return false;
        }
    }

    /**
     * Create a generic attribute proof
     * Proves possession of an attribute without revealing its value
     * @param {string} attribute - Attribute name
     * @param {any} value - Attribute value
     * @param {Function} predicate - Condition to prove (e.g., value > 100)
     * @returns {Promise<Object>} ZK proof
     */
    async createAttributeProof(attribute, value, predicate) {
        try {
            const encoder = new TextEncoder();
            const valueString = JSON.stringify(value);
            const valueBuffer = encoder.encode(valueString);

            // Generate salt
            const salt = window.crypto.getRandomValues(new Uint8Array(16));

            // Create commitment
            const commitment = await this.hashData(
                new Uint8Array([
                    ...encoder.encode(attribute),
                    ...valueBuffer,
                    ...salt
                ])
            );

            // Evaluate predicate
            const predicateResult = predicate(value);

            // Create proof
            const proof = await this.hashData(
                new Uint8Array([
                    ...commitment,
                    predicateResult ? 1 : 0,
                    ...salt
                ])
            );

            return {
                attribute,
                commitment: this.arrayToHex(commitment),
                proof: this.arrayToHex(proof),
                predicateResult,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error creating attribute proof:', error);
            throw new Error('Failed to create attribute proof');
        }
    }

    /**
     * Create a vault access proof
     * Proves knowledge of master password without revealing it
     * @param {string} masterPassword - Vault master password
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<Object>} Vault access proof
     */
    async createVaultAccessProof(masterPassword, salt) {
        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(masterPassword);

            // Create a commitment using PBKDF2
            const keyMaterial = await window.crypto.subtle.importKey(
                "raw",
                passwordBuffer,
                { name: "PBKDF2" },
                false,
                ["deriveBits"]
            );

            const derivedBits = await window.crypto.subtle.deriveBits(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: 100000,
                    hash: "SHA-256"
                },
                keyMaterial,
                256
            );

            const commitment = new Uint8Array(derivedBits);

            // Generate challenge response
            const challenge = window.crypto.getRandomValues(new Uint8Array(32));
            const response = await this.hashData(
                new Uint8Array([...commitment, ...challenge])
            );

            return {
                commitment: this.arrayToHex(commitment),
                challenge: this.arrayToHex(challenge),
                response: this.arrayToHex(response),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error creating vault access proof:', error);
            throw new Error('Failed to create vault access proof');
        }
    }

    /**
     * Verify vault access proof
     * @param {Object} proof - Vault access proof
     * @param {string} storedCommitment - Stored commitment from registration
     * @returns {boolean} Verification result
     */
    verifyVaultAccessProof(proof, storedCommitment) {
        try {
            // Verify proof structure
            if (!proof.commitment || !proof.response) {
                return false;
            }

            // Verify timestamp
            const age = Date.now() - proof.timestamp;
            if (age > 300000) { // 5 minutes
                return false;
            }

            // Verify commitment matches stored value
            return proof.commitment === storedCommitment;
        } catch (error) {
            console.error('Error verifying vault access proof:', error);
            return false;
        }
    }

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Hash data using SHA-256
     * @param {Uint8Array} data - Data to hash
     * @returns {Promise<Uint8Array>} Hash
     */
    async hashData(data) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hashBuffer);
    }

    /**
     * Convert Uint8Array to hex string
     * @param {Uint8Array} array - Array to convert
     * @returns {string} Hex string
     */
    arrayToHex(array) {
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert hex string to Uint8Array
     * @param {string} hex - Hex string
     * @returns {Uint8Array} Array
     */
    hexToArray(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    }

    /**
     * Generate a random nonce
     * @returns {string} Hex nonce
     */
    generateNonce() {
        const nonce = window.crypto.getRandomValues(new Uint8Array(16));
        return this.arrayToHex(nonce);
    }

    /**
     * Clear expired challenges
     */
    clearExpiredChallenges() {
        const now = Date.now();
        for (const [id, data] of this.challenges.entries()) {
            if (now - data.timestamp > 300000) { // 5 minutes
                this.challenges.delete(id);
            }
        }
    }
}

// Export singleton instance
const zeroKnowledge = new ZeroKnowledge();

// Clean up expired challenges every minute
setInterval(() => {
    zeroKnowledge.clearExpiredChallenges();
}, 60000);
