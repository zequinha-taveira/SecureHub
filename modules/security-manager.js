// ============================================
// Security Manager Module
// Centralized security features for SecureHub
// ============================================

/**
 * Rate Limiter
 * Protects against brute force attacks by limiting attempts
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 300000) { // 5 tentativas em 5 minutos
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.blockedUntil = new Map();
    }

    /**
     * Check if an action is allowed for the given identifier
     * @param {string} identifier - Unique identifier (e.g., 'vault-unlock', 'zk-proof')
     * @returns {Object} { allowed: boolean, retryAfter?: number, attemptsLeft?: number }
     */
    checkLimit(identifier) {
        const now = Date.now();

        // Check if currently blocked
        const blockedUntil = this.blockedUntil.get(identifier);
        if (blockedUntil && now < blockedUntil) {
            return {
                allowed: false,
                retryAfter: Math.ceil((blockedUntil - now) / 1000), // seconds
                message: `Muitas tentativas. Tente novamente em ${Math.ceil((blockedUntil - now) / 1000)}s`
            };
        }

        // Get recent attempts
        const userAttempts = this.attempts.get(identifier) || [];

        // Remove old attempts outside the window
        const recentAttempts = userAttempts.filter(
            time => now - time < this.windowMs
        );

        // Check if limit exceeded
        if (recentAttempts.length >= this.maxAttempts) {
            const blockUntil = now + this.windowMs;
            this.blockedUntil.set(identifier, blockUntil);

            return {
                allowed: false,
                retryAfter: Math.ceil(this.windowMs / 1000),
                message: `Limite de tentativas excedido. Aguarde ${Math.ceil(this.windowMs / 1000)}s`
            };
        }

        // Record this attempt
        recentAttempts.push(now);
        this.attempts.set(identifier, recentAttempts);

        return {
            allowed: true,
            attemptsLeft: this.maxAttempts - recentAttempts.length
        };
    }

    /**
     * Reset attempts for an identifier (e.g., after successful login)
     * @param {string} identifier - Identifier to reset
     */
    reset(identifier) {
        this.attempts.delete(identifier);
        this.blockedUntil.delete(identifier);
    }

    /**
     * Get current status for an identifier
     * @param {string} identifier - Identifier to check
     * @returns {Object} Status information
     */
    getStatus(identifier) {
        const now = Date.now();
        const blockedUntil = this.blockedUntil.get(identifier);

        if (blockedUntil && now < blockedUntil) {
            return {
                blocked: true,
                retryAfter: Math.ceil((blockedUntil - now) / 1000)
            };
        }

        const attempts = this.attempts.get(identifier) || [];
        const recentAttempts = attempts.filter(time => now - time < this.windowMs);

        return {
            blocked: false,
            attempts: recentAttempts.length,
            attemptsLeft: this.maxAttempts - recentAttempts.length
        };
    }
}

/**
 * Session Manager
 * Manages user session timeout and auto-lock
 */
class SessionManager {
    constructor(timeoutMs = 900000) { // 15 minutos padrão
        this.timeoutMs = timeoutMs;
        this.lastActivity = Date.now();
        this.timeoutId = null;
        this.warningId = null;
        this.onTimeout = null;
        this.onWarning = null;
        this.isActive = false;
        this.warningTime = 60000; // Avisar 1 minuto antes
    }

    /**
     * Start monitoring user activity
     * @param {Function} onTimeout - Callback when session times out
     * @param {Function} onWarning - Optional callback for warning before timeout
     */
    start(onTimeout, onWarning = null) {
        this.onTimeout = onTimeout;
        this.onWarning = onWarning;
        this.isActive = true;

        // Monitor user activity events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        this.activityHandler = () => this.resetTimeout();

        events.forEach(event => {
            document.addEventListener(event, this.activityHandler, { passive: true });
        });

        this.resetTimeout();
        console.log('Session manager started - timeout:', this.timeoutMs / 1000, 'seconds');
    }

    /**
     * Stop monitoring (e.g., when user logs out)
     */
    stop() {
        this.isActive = false;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.warningId) {
            clearTimeout(this.warningId);
            this.warningId = null;
        }

        if (this.activityHandler) {
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
            events.forEach(event => {
                document.removeEventListener(event, this.activityHandler);
            });
        }

        console.log('Session manager stopped');
    }

    /**
     * Reset the timeout timer (called on user activity)
     */
    resetTimeout() {
        if (!this.isActive) return;

        this.lastActivity = Date.now();

        // Clear existing timers
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.warningId) {
            clearTimeout(this.warningId);
        }

        // Set warning timer (1 minute before timeout)
        if (this.onWarning && this.timeoutMs > this.warningTime) {
            this.warningId = setTimeout(() => {
                if (this.onWarning) {
                    this.onWarning(this.warningTime / 1000);
                }
            }, this.timeoutMs - this.warningTime);
        }

        // Set timeout timer
        this.timeoutId = setTimeout(() => {
            if (this.onTimeout) {
                this.onTimeout();
            }
            this.stop();
        }, this.timeoutMs);
    }

    /**
     * Get time until timeout
     * @returns {number} Milliseconds until timeout
     */
    getTimeUntilTimeout() {
        if (!this.isActive) return 0;
        const elapsed = Date.now() - this.lastActivity;
        return Math.max(0, this.timeoutMs - elapsed);
    }

    /**
     * Extend the session (reset timer)
     */
    extend() {
        this.resetTimeout();
    }

    /**
     * Change timeout duration
     * @param {number} timeoutMs - New timeout in milliseconds
     */
    setTimeout(timeoutMs) {
        this.timeoutMs = timeoutMs;
        if (this.isActive) {
            this.resetTimeout();
        }
    }
}

/**
 * Screen Protection
 * Basic protection against screen capture
 */
class ScreenProtection {
    static watermarkElement = null;

    /**
     * Enable screen protection features
     * @param {Object} options - Protection options
     */
    static enable(options = {}) {
        const {
            watermark = true,
            detectCapture = true,
            warnings = true
        } = options;

        if (watermark) {
            this.addWatermark();
        }

        if (detectCapture) {
            this.detectScreenCapture();
        }

        if (warnings) {
            this.showSecurityWarnings();
        }
    }

    /**
     * Disable screen protection
     */
    static disable() {
        if (this.watermarkElement) {
            this.watermarkElement.remove();
            this.watermarkElement = null;
        }
    }

    /**
     * Add invisible watermark to the page
     */
    static addWatermark() {
        if (this.watermarkElement) return;

        const watermark = document.createElement('div');
        watermark.className = 'security-watermark';
        watermark.textContent = `SecureHub - ${new Date().toISOString()} - Confidencial`;
        watermark.style.cssText = `
            position: fixed;
            bottom: 5px;
            right: 5px;
            font-size: 8px;
            color: rgba(128, 128, 128, 0.3);
            pointer-events: none;
            z-index: 9999;
            font-family: monospace;
        `;

        document.body.appendChild(watermark);
        this.watermarkElement = watermark;
    }

    /**
     * Detect potential screen capture attempts
     */
    static detectScreenCapture() {
        // Detect when page loses focus (possible screenshot)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.warn('⚠️ Página oculta - possível captura de tela');
            }
        });

        // Detect blur events
        window.addEventListener('blur', () => {
            console.warn('⚠️ Janela perdeu foco');
        });
    }

    /**
     * Show security warnings to users
     */
    static showSecurityWarnings() {
        // Add warning on first load
        const hasSeenWarning = sessionStorage.getItem('security-warning-seen');

        if (!hasSeenWarning) {
            setTimeout(() => {
                const warning = `
                    🔒 AVISO DE SEGURANÇA
                    
                    • Não compartilhe capturas de tela desta aplicação
                    • Não deixe a sessão aberta em computadores públicos
                    • Sempre faça logout ao terminar
                    • Suas chaves privadas nunca saem deste dispositivo
                `;

                console.info(warning);
                sessionStorage.setItem('security-warning-seen', 'true');
            }, 2000);
        }
    }
}

/**
 * Security Manager
 * Main class that coordinates all security features
 */
class SecurityManager {
    constructor() {
        this.rateLimiter = new RateLimiter();
        this.sessionManager = new SessionManager();
        this.screenProtection = ScreenProtection;
        this.isInitialized = false;
    }

    /**
     * Initialize security manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        const {
            sessionTimeout = 900000, // 15 minutos
            maxAttempts = 5,
            rateWindow = 300000, // 5 minutos
            screenProtection = true
        } = options;

        // Configure rate limiter
        this.rateLimiter = new RateLimiter(maxAttempts, rateWindow);

        // Configure session manager
        this.sessionManager = new SessionManager(sessionTimeout);

        // Enable screen protection
        if (screenProtection) {
            this.screenProtection.enable();
        }

        this.isInitialized = true;
        console.log('✅ Security Manager initialized');
    }

    /**
     * Start session monitoring
     * @param {Function} onTimeout - Callback when session expires
     * @param {Function} onWarning - Callback for timeout warning
     */
    startSession(onTimeout, onWarning) {
        this.sessionManager.start(onTimeout, onWarning);
    }

    /**
     * Stop session monitoring
     */
    stopSession() {
        this.sessionManager.stop();
    }

    /**
     * Check rate limit for an action
     * @param {string} action - Action identifier
     * @returns {Object} Rate limit result
     */
    checkRateLimit(action) {
        return this.rateLimiter.checkLimit(action);
    }

    /**
     * Reset rate limit for an action
     * @param {string} action - Action identifier
     */
    resetRateLimit(action) {
        this.rateLimiter.reset(action);
    }

    /**
     * Get security status
     * @returns {Object} Current security status
     */
    getStatus() {
        return {
            sessionActive: this.sessionManager.isActive,
            timeUntilTimeout: this.sessionManager.getTimeUntilTimeout(),
            initialized: this.isInitialized
        };
    }
}

// Export singleton instance
const securityManager = new SecurityManager();

// Initialize with default settings
securityManager.initialize({
    sessionTimeout: 900000, // 15 minutos
    maxAttempts: 5,
    rateWindow: 300000, // 5 minutos
    screenProtection: true
});
