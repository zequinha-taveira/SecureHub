// ============================================
// THEME MANAGEMENT
// ============================================

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ============================================
// MODAL MANAGEMENT
// ============================================

const modal = document.getElementById('toolModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

function openTool(toolName) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load tool content based on toolName
    switch(toolName) {
        case 'password-generator':
            loadPasswordGenerator();
            break;
        case 'password-strength':
            loadPasswordStrength();
            break;
        case 'url-scanner':
            loadUrlScanner();
            break;
        case 'hash-verifier':
            loadHashVerifier();
            break;
        case 'encryption':
            loadEncryption();
            break;
        case 'token-generator':
            loadTokenGenerator();
            break;
        case 'breach-checker':
            loadBreachChecker();
            break;
        case 'vulnerability-scanner':
            loadVulnerabilityScanner();
            break;
        default:
            modalTitle.textContent = 'Ferramenta não encontrada';
            modalBody.innerHTML = '<p>Esta ferramenta ainda não está disponível.</p>';
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado para a área de transferência!', 'success');
    }).catch(err => {
        showNotification('Erro ao copiar', 'error');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.animation = 'fadeInUp 0.3s ease-out';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function generateRandomString(length, charset) {
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        result += charset[array[i] % charset.length];
    }
    
    return result;
}

function calculateEntropy(password) {
    const charsets = {
        lowercase: /[a-z]/,
        uppercase: /[A-Z]/,
        numbers: /[0-9]/,
        symbols: /[^a-zA-Z0-9]/
    };
    
    let poolSize = 0;
    if (charsets.lowercase.test(password)) poolSize += 26;
    if (charsets.uppercase.test(password)) poolSize += 26;
    if (charsets.numbers.test(password)) poolSize += 10;
    if (charsets.symbols.test(password)) poolSize += 32;
    
    return password.length * Math.log2(poolSize);
}

// ============================================
// HASH FUNCTIONS (for client-side hashing)
// ============================================

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha512(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple MD5 implementation (for educational purposes)
function md5(string) {
    // Note: This is a simplified version. For production, use a proper library
    // or Web Crypto API when available
    return 'MD5 requires external library or implementation';
}

// ============================================
// ENCRYPTION FUNCTIONS
// ============================================

async function encryptText(text, password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate key from password
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
    );
    
    // Combine salt + iv + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return btoa(String.fromCharCode(...result));
}

async function decryptText(encryptedData, password) {
    try {
        const encoder = new TextEncoder();
        const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const encrypted = data.slice(28);
        
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error('Falha na descriptografia. Senha incorreta ou dados corrompidos.');
    }
}

// ============================================
// INITIALIZATION
// ============================================

console.log('SecureHub initialized');
console.log('Theme:', savedTheme);
