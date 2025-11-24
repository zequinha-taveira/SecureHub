// ============================================
// File Manager Module
// Handles encrypted file attachments
// ============================================

class FileManager {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.chunkSize = 1024 * 1024; // 1MB chunks
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    }

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'Nenhum arquivo selecionado' };
        }

        if (file.size > this.maxFileSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `Arquivo muito grande (${sizeMB}MB). Máximo: 10MB`
            };
        }

        if (file.size === 0) {
            return { valid: false, error: 'Arquivo vazio' };
        }

        return { valid: true };
    }

    /**
     * Encrypt file in chunks
     * @param {File} file - File to encrypt
     * @param {CryptoKey} encryptionKey - Encryption key
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Encrypted file data
     */
    async encryptFile(file, encryptionKey, onProgress = null) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const chunks = [];
        const totalChunks = Math.ceil(file.size / this.chunkSize);

        // Encrypt file in chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, file.size);
            const chunk = file.slice(start, end);

            // Read chunk
            const chunkData = await this.readChunkAsArrayBuffer(chunk);

            // Encrypt chunk
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                encryptionKey,
                chunkData
            );

            chunks.push({
                data: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv)
            });

            // Report progress
            if (onProgress) {
                onProgress(((i + 1) / totalChunks) * 100);
            }
        }

        // Generate thumbnail for images
        let thumbnail = null;
        if (this.supportedImageTypes.includes(file.type)) {
            thumbnail = await this.generateThumbnail(file);
        }

        // Encrypt metadata
        const metadata = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        };

        const encryptedMetadata = await e2eeCrypto.encryptMessage(
            JSON.stringify(metadata),
            encryptionKey
        );

        return {
            chunks,
            metadata: encryptedMetadata,
            thumbnail,
            chunkCount: chunks.length,
            totalSize: file.size,
            timestamp: Date.now()
        };
    }

    /**
     * Decrypt file from chunks
     * @param {Object} encryptedFile - Encrypted file data
     * @param {CryptoKey} decryptionKey - Decryption key
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Blob>} Decrypted file as Blob
     */
    async decryptFile(encryptedFile, decryptionKey, onProgress = null) {
        // Decrypt metadata
        const metadataStr = await e2eeCrypto.decryptMessage(
            encryptedFile.metadata,
            decryptionKey
        );
        const metadata = JSON.parse(metadataStr);

        // Decrypt chunks
        const decryptedChunks = [];
        const totalChunks = encryptedFile.chunks.length;

        for (let i = 0; i < totalChunks; i++) {
            const chunk = encryptedFile.chunks[i];
            const iv = new Uint8Array(chunk.iv);
            const data = new Uint8Array(chunk.data);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                decryptionKey,
                data
            );

            decryptedChunks.push(decrypted);

            // Report progress
            if (onProgress) {
                onProgress(((i + 1) / totalChunks) * 100);
            }
        }

        // Combine chunks into blob
        const blob = new Blob(decryptedChunks, { type: metadata.type });

        // Attach metadata to blob
        blob.fileName = metadata.name;
        blob.fileSize = metadata.size;

        return blob;
    }

    /**
     * Read chunk as ArrayBuffer
     * @param {Blob} chunk - Chunk to read
     * @returns {Promise<ArrayBuffer>}
     */
    readChunkAsArrayBuffer(chunk) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(chunk);
        });
    }

    /**
     * Generate thumbnail for image
     * @param {File} file - Image file
     * @returns {Promise<string>} Base64 thumbnail
     */
    async generateThumbnail(file) {
        if (!this.supportedImageTypes.includes(file.type)) {
            return null;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Create canvas for thumbnail
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate thumbnail size (max 200x200)
                    const maxSize = 200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and convert to base64
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = () => resolve(null);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Download decrypted file
     * @param {Blob} blob - File blob
     * @param {string} filename - Filename
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get file icon based on type
     * @param {string} mimeType - MIME type
     * @returns {string} Icon emoji
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('text')) return '📝';
        return '📎';
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Export singleton instance
const fileManager = new FileManager();
