export function formatUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay = 300
): (...args: Parameters<T>) => void {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

export async function md5(str: string): Promise<string> {
    const buffer = await crypto.subtle.digest('MD5', new TextEncoder().encode(str));
    const array = Array.from(new Uint8Array(buffer));
    return array.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function showToast(message: string, type = 'error'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}