import { MetricsCollector, LoadTimeStats } from './MetricsCollector';

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metricsCollector: MetricsCollector;

    private constructor() {
        this.metricsCollector = new MetricsCollector();
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    startTiming(name: string, metadata?: Record<string, any>): void {
        this.metricsCollector.startTiming(name, metadata);
    }

    endTiming(name: string): number | null {
        return this.metricsCollector.endTiming(name);
    }

    getCurrentTiming(name: string): number | null {
        return this.metricsCollector.getCurrentTiming(name);
    }

    recordLoadTime(stats: LoadTimeStats): void {
        // You might want to store this or send it to an analytics service
        console.log('Load time recorded:', stats);
    }

    // Additional methods for benchmarking, etc.
    async benchmark<T>(name: string, operation: () => Promise<T>): Promise<T> {
        this.startTiming(name);
        try {
            const result = await operation();
            this.endTiming(name);
            return result;
        } catch (error) {
            this.endTiming(name);
            throw error;
        }
    }
}