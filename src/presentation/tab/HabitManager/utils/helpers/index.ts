/**
 * 🛠️ HELPERS INDEX
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 📦 Export tất cả helper utilities
 * ├── 🎯 Centralized access point
 * └── 🔧 Re-export từ các module con
 */

import dateUtils from './dateUtils';
import errorUtils from './errorUtils';
import validationUtils from './validationUtils';

// Re-export từ dateUtils
export * from './dateUtils';
export { default as dateUtils } from './dateUtils';

// Re-export từ validationUtils
export * from './validationUtils';
export { default as validationUtils } from './validationUtils';

// Re-export từ errorUtils
export * from './errorUtils';
export { default as errorUtils } from './errorUtils';

// 🎯 Combined helper object
const helpers = {
    date: dateUtils,
    validation: validationUtils,
    error: errorUtils
};

export default helpers;