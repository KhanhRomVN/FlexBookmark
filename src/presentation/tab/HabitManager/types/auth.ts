/**
 * 🔐 AUTHENTICATION TYPES & INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🎯 Core authentication types và interfaces
 * ├── 🔄 State management types
 * ├── 🧪 Validation và permission types  
 * ├── 🔧 Hook configuration types
 * └── 🛠️ Utility và helper types
 */

// ========== CORE AUTH TYPES ==========

export type AuthError =
    | 'no_auth'
    | 'invalid_token'
    | 'token_expired'
    | 'missing_permissions'
    | 'insufficient_scope'
    | 'network_error'
    | 'permission_denied'
    | 'consent_required'
    | 'unknown_error';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

// ========== STATE MANAGEMENT TYPES ==========

export interface BaseAuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
}

export interface EnhancedAuthState extends BaseAuthState {
    // Validation status
    isValidating: boolean;
    canProceed: boolean;
    lastValidation: number | null;

    // Token management
    tokenRefreshInProgress: boolean;
    lastTokenRefresh: number | null;

    // Enhanced state flags
    isReady: boolean;
}

// ========== VALIDATION TYPES ==========

export interface ValidationStatus {
    isValid: boolean;
    hasValidToken: boolean;
    hasRequiredScopes: boolean;
    needsReauth: boolean;
    lastValidation: number;
    expiresAt: number | null;
    errors: string[];
    validationInProgress: boolean;
    scopeDetails?: TokenScopeDetails;
}

export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    hasRequiredScopes: boolean;
    expiresAt: number | null;
    errors: string[];
    scopeDetails?: TokenScopeDetails;
}

export interface TokenScopeDetails {
    grantedScopes: string[];
    requiredScopes: string[];
    missingScopes: string[];
    optionalScopes: string[];
}

// ========== PERMISSION TYPES ==========

export interface PermissionStatus {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
    folderStructureExists?: boolean;
    checked: boolean;
    lastChecked: number | null;
    checkInProgress: boolean;
}

export interface PermissionCheckResult {
    hasRequiredScopes: boolean;
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;
    scopeDetails: ScopeDetail[];
    grantedScopes: string[];
    missingScopes: string[];
}

export interface ScopeDetail {
    name: string;
    url: string;
    hasAccess: boolean;
    required: boolean;
    description: string;
}

export interface PermissionScope {
    name: string;
    url: string;
    required: boolean;
    testEndpoint: string;
    description: string;
    category: 'storage' | 'calendar' | 'other';
    fallbackTest?: string;
}

// ========== OPERATION RESULT TYPES ==========

export interface AuthOperationResult {
    success: boolean;
    error?: string;
    needsReauth?: boolean;
    missingScopes?: string[];
}

export interface TokenRefreshResult {
    success: boolean;
    newToken?: string;
    expiresAt?: number;
    error?: string;
}

export interface OAuthConsentResult {
    success: boolean;
    grantedScopes: string[];
    deniedScopes: string[];
    newToken?: string;
    error?: string;
}

export interface ApiTestResult {
    hasAccess: boolean;
    status: number;
    error?: string;
    responseTime?: number;
}

export interface ScopeTestResult {
    [scopeName: string]: boolean;
}

// ========== HOOK CONFIGURATION TYPES ==========

export interface AuthHookConfig {
    requiredScopes?: string[];
    autoValidate?: boolean;
    validationDelay?: number;
}

export interface TokenRefreshConfig {
    interactive: boolean;
    timeout: number;
    retryCount: number;
    forceReauth: boolean;
    includeOptionalScopes: boolean;
}

export interface AuthValidationConfig {
    periodicInterval?: number;
    tokenExpiryBuffer?: number;
    maxRetryAttempts?: number;
}

// ========== DIAGNOSTIC TYPES ==========

export interface AuthDiagnosticResult {
    isHealthy: boolean;
    severity: 'healthy' | 'warning' | 'critical' | 'fatal';
    issues: AuthIssue[];
    recommendations: string[];
    needsUserAction: boolean;
    canAutoRecover: boolean;
    systemStatus: SystemHealthStatus;
    recoveryPlan?: RecoveryPlan;
}

export interface AuthIssue {
    type: AuthError;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    canAutoRecover: boolean;
    requiresUserAction: boolean;
    suggestedAction: string;
    technicalDetails?: string;
}

export interface SystemHealthStatus {
    tokenValid: boolean;
    scopesValid: boolean;
    networkReachable: boolean;
    authManagerHealthy: boolean;
    chromeIdentityAvailable: boolean;
    manifestConfigValid: boolean;
    cacheOperational: boolean;
}

export interface RecoveryPlan {
    steps: RecoveryStep[];
    estimatedTime: string;
    successProbability: 'high' | 'medium' | 'low';
    requiresUserInteraction: boolean;
}

export interface RecoveryStep {
    action: string;
    description: string;
    automated: boolean;
    estimatedDuration: number;
}

// ========== CONTEXT TYPES ==========

export interface AuthContextValue {
    // Core state
    authState: EnhancedAuthState;
    validationStatus: ValidationStatus;
    permissions: PermissionStatus;

    // Loading states
    isCheckingPermissions: boolean;

    // Actions
    login: () => Promise<AuthOperationResult>;
    logout: () => Promise<AuthOperationResult>;
    forceReauth: () => Promise<AuthOperationResult>;

    // Validation
    validateAuth: (force?: boolean) => Promise<boolean>;
    triggerValidation: () => Promise<boolean>;
    refreshPermissions: () => Promise<PermissionStatus>;

    // Token management
    refreshAccessToken: () => Promise<TokenRefreshResult>;
    forceTokenRefresh: () => Promise<boolean>;

    // Status getters
    getAuthStatus: () => AuthStatus;
    diagnoseAuthIssues: () => AuthDiagnosticResult;

    // Utility functions
    checkScope: (scope: string) => boolean;
    getRequiredScopes: () => string[];

    // Computed values
    isReady: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasError: boolean;

    // Permission shortcuts
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;
}

export interface AuthStatus {
    // Basic auth state
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;

    // Enhanced state
    isReady: boolean;
    isValidating: boolean;
    lastValidation: number | null;

    // Token status
    hasToken: boolean;
    tokenValid: boolean;
    tokenExpired: boolean;
    tokenExpiry: number | null;

    // Permission status
    hasRequiredScopes: boolean;
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;

    // Diagnostic info
    grantedScopes: string[];
    validationErrors: string[];
    scopeDetails: ScopeDetail[];
}

// ========== UTILITY TYPES ==========

export interface CacheEntry<T> {
    result: T;
    timestamp: number;
}

export interface CacheStats {
    validationCacheSize: number;
    scopeCacheSize: number;
    oldestValidationEntry: number | null;
    oldestScopeEntry: number | null;
}

export interface DetailedDiagnostics {
    systemInfo: SystemHealthStatus;
    authAnalysis: any;
    permissionAnalysis: any;
    networkStatus: boolean;
    cacheStatus: CacheStats;
    recommendations: string[];
}

// ========== EVENT TYPES ==========

export interface AuthStateChangeEvent {
    type: 'auth_state_changed';
    oldState: EnhancedAuthState;
    newState: EnhancedAuthState;
    timestamp: number;
}

export interface ValidationCompleteEvent {
    type: 'validation_complete';
    result: ValidationStatus;
    duration: number;
    timestamp: number;
}

export interface TokenRefreshEvent {
    type: 'token_refresh';
    success: boolean;
    error?: string;
    timestamp: number;
}

// ========== TYPE GUARDS ==========

export const isAuthUser = (user: any): user is AuthUser => {
    return user &&
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof user.name === 'string' &&
        typeof user.accessToken === 'string';
};

export const isValidationStatus = (status: any): status is ValidationStatus => {
    return status &&
        typeof status.isValid === 'boolean' &&
        typeof status.hasValidToken === 'boolean' &&
        typeof status.hasRequiredScopes === 'boolean' &&
        typeof status.needsReauth === 'boolean' &&
        typeof status.lastValidation === 'number' &&
        Array.isArray(status.errors) &&
        typeof status.validationInProgress === 'boolean';
};

export const isPermissionStatus = (permissions: any): permissions is PermissionStatus => {
    return permissions &&
        typeof permissions.hasDrive === 'boolean' &&
        typeof permissions.hasSheets === 'boolean' &&
        typeof permissions.hasCalendar === 'boolean' &&
        typeof permissions.allRequired === 'boolean' &&
        typeof permissions.checked === 'boolean' &&
        typeof permissions.checkInProgress === 'boolean';
};

// ========== EXPORT DEFAULT ==========

export default {
    // Types
    AuthError,
    AuthUser,
    BaseAuthState,
    EnhancedAuthState,
    ValidationStatus,
    TokenValidationResult,
    PermissionStatus,
    AuthOperationResult,
    TokenRefreshResult,
    AuthHookConfig,
    AuthContextValue,
    AuthStatus,
    AuthDiagnosticResult,

    // Type guards
    isAuthUser,
    isValidationStatus,
    isPermissionStatus
};