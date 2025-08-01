/**
 * Format lại URL để hiển thị
 * @param {string} url 
 * @returns {string}
 */
export function formatUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
  
  /**
   * Kiểm tra URL hợp lệ
   * @param {string} url 
   * @returns {boolean}
   */
  export function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Tạo ID ngẫu nhiên
   * @returns {string}
   */
  export function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Debounce function để tối ưu hiệu suất
   * @param {Function} func 
   * @param {number} delay 
   * @returns {Function}
   */
  export function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }
// Hàm md5 cho Gravatar
export async function md5(str) {
  const buffer = await crypto.subtle.digest('MD5', new TextEncoder().encode(str));
  const array = Array.from(new Uint8Array(buffer));
  return array.map(b => b.toString(16).padStart(2, '0')).join('');
}