import { useCallback, useRef } from "react";

export function useAdvancedDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T {
    const { leading = false, trailing = true, maxWait } = options;
    const timeoutRef = useRef<NodeJS.Timeout>();
    const maxTimeoutRef = useRef<NodeJS.Timeout>();
    const lastCallTime = useRef<number>();
    const lastInvokeTime = useRef<number>(0);

    const debouncedCallback = useCallback((...args: any[]) => {
        const now = Date.now();
        const shouldInvoke = leading && !timeoutRef.current;
        lastCallTime.current = now;

        const invokeCallback = () => {
            lastInvokeTime.current = now;
            callback(...args);
        };

        const shouldInvokeNow = () => {
            if (maxWait && now - lastInvokeTime.current >= maxWait) {
                return true;
            }
            return false;
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
        }

        if (shouldInvoke) {
            invokeCallback();
        }

        if (shouldInvokeNow()) {
            invokeCallback();
            return;
        }

        timeoutRef.current = setTimeout(() => {
            if (trailing && lastCallTime.current && now - lastCallTime.current >= delay) {
                invokeCallback();
            }
            timeoutRef.current = undefined;
        }, delay);

        if (maxWait && !maxTimeoutRef.current) {
            maxTimeoutRef.current = setTimeout(() => {
                invokeCallback();
                maxTimeoutRef.current = undefined;
            }, maxWait);
        }
    }, [callback, delay, leading, trailing, maxWait]) as T;

    return debouncedCallback;
}