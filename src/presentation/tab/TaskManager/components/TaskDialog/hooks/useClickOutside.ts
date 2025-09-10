// src/presentation/components/TaskManager/TaskDialog/hooks/useClickOutside.ts
import { useEffect, RefObject } from "react";

export const useClickOutside = (
    ref: RefObject<HTMLElement>,
    callback: () => void
) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};