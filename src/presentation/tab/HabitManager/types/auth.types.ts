/**
 * 🔐 AUTHENTICATION TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 👤 User và token types
 * ├── 🔐 Credentials và scope types
 * ├── 🏗️ State management types
 * ├── 📊 Result types
 * ├── 🐛 Error types
 * ├── ⚙️ Configuration types
 * └── 📡 Event types
 */

// ========== BASIC TYPES ==========

/**
 * 👤 Authenticated user
 */
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    locale?: string;
    email_verified?: boolean;
    hd?: string;
}

/**
 * 🔑 Token information
 */
export interface TokenInfo {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
    expires_at: number;
    token_type: string;
    scope: string;
}

/**
 * 🔐 Authentication credentials
 */
export interface AuthCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

/**
 * 🎯 Google scope definition
 */
export interface GoogleScope {
    name: string;
    description: string;
    required: boolean;
    granted: boolean;
}

/**
 * 📊 Scope status
 */
export interface ScopeStatus {
    scopes: GoogleScope[];
    allRequiredGranted: boolean;
}

// ========== STATE TYPES ==========

/**
 * 🏗️ Authentication state
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    tokenInfo: TokenInfo | null;
    isLoading: boolean;
    error: AuthError | null;
    scopes: ScopeStatus;
}

/**
 * ✅ Validation state
 */
export interface AuthValidationState {
    isValid: boolean;
    issues: AuthIssue[];
    timestamp: number;
}

/**
 * 📊 System status
 */
export interface AuthSystemStatus {
    isOnline: boolean;
    lastChecked: number;
    health: AuthSystemHealthStatus;
}

// ========== RESULT TYPES ==========

/**
 * 🔓 Login result
 */
export interface LoginResult {
    success: boolean;
    user?: AuthUser;
    tokenInfo?: TokenInfo;
    error?: AuthError;
    requires2FA?: boolean;
}

/**
 * 🔒 Logout result
 */
export interface LogoutResult {
    success: boolean;
    message?: string;
    error?: AuthError;
}

/**
 * 🔄 Token refresh result
 */
export interface TokenRefreshResult {
    success: boolean;
    tokenInfo?: TokenInfo;
    error?: AuthError;
}

/**
 * 🎯 Permission check result
 */
export interface PermissionCheckResult {
    hasPermission: boolean;
    missingScopes?: string[];
    error?: AuthError;
}

// ========== ERROR TYPES ==========

/**
 * 🐛 Authentication error
 */
export interface AuthError {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
}

/**
 * 📝 Authentication issue
 */
export interface AuthIssue {
    type: string;
    severity: 'warning' | 'error' | 'info';
    message: string;
    code?: string;
    timestamp: number;
}

/**
 * 🩺 System health status
 */
export interface AuthSystemHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
        auth: boolean;
        storage: boolean;
        network: boolean;
        api: boolean;
    };
    lastUpdated: number;
}

/**
 * 🔍 Diagnostic result
 */
export interface AuthDiagnosticResult {
    timestamp: number;
    checks: {
        name: string;
        status: 'pass' | 'fail' | 'warn';
        message: string;
        duration: number;
    }[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        warnings: number;
    };
}

// ========== CONFIGURATION TYPES ==========

/**
 * ⚙️ Authentication configuration
 */
export interface AuthConfig {
    clientId: string;
    apiKey: string;
    discoveryDocs: string[];
    scopes: string[];
    redirectUri: string;
    uxMode: 'popup' | 'redirect';
    autoLogin?: boolean;
    persistSession?: boolean;
}

/**
 * ⚙️ Token refresh configuration
 */
export interface TokenRefreshConfig {
    enabled: boolean;
    interval: number;
    beforeExpiry: number;
    maxAttempts: number;
    retryDelay: number;
}

// ========== EVENT TYPES ==========

/**
 * 📡 Authentication state change event
 */
export interface AuthStateChangeEvent {
    previousState: AuthState;
    currentState: AuthState;
    timestamp: number;
    type: 'login' | 'logout' | 'token_refresh' | 'error';
}

/**
 * 🔄 Token refresh event
 */
export interface TokenRefreshEvent {
    success: boolean;
    timestamp: number;
    oldToken?: TokenInfo;
    newToken?: TokenInfo;
    error?: AuthError;
}

/**
 * 🎯 Permission update event
 */
export interface PermissionUpdateEvent {
    scopes: ScopeStatus;
    timestamp: number;
    changedScopes: string[];
}