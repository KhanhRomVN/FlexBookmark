import { PerformanceMonitor } from './PerformanceMonitor';
import React from 'react';

export class PerfUtils {
    private static monitor = PerformanceMonitor.getInstance();

    static async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
        return this.monitor.benchmark(name, fn);
    }

    static timeFunctionSync<T>(name: string, fn: () => T): T {
        this.monitor.startTiming(name);
        try {
            const result = fn();
            this.monitor.endTiming(name);
            return result;
        } catch (error) {
            this.monitor.endTiming(name);
            throw error;
        }
    }

    static logMilestone(message: string): void {
        console.log(`🚀 Performance Milestone: ${message} at ${Date.now()}`);
    }

    static createPerfDecorator(className: string) {
        return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
            const method = descriptor.value;

            descriptor.value = async function (...args: any[]) {
                const monitor = PerformanceMonitor.getInstance();
                const operationName = `${className}.${propertyName}`;

                monitor.startTiming(operationName);
                try {
                    const result = await method.apply(this, args);
                    monitor.endTiming(operationName);
                    return result;
                } catch (error) {
                    monitor.endTiming(operationName);
                    throw error;
                }
            };
        };
    }
}

// React hook for performance tracking
export const usePerformanceTracking = (componentName: string) => {
    React.useEffect(() => {
        const monitor = PerformanceMonitor.getInstance();
        monitor.startTiming(`${componentName}.render`);

        return () => {
            monitor.endTiming(`${componentName}.render`);
        };
    }, [componentName]);

    return {
        trackOperation: async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
            const monitor = PerformanceMonitor.getInstance();
            return monitor.benchmark(`${componentName}.${operationName}`, operation);
        }
    };
};