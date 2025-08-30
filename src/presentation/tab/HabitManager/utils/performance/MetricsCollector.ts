export interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

export interface LoadTimeStats {
    totalLoadTime: number;
    authTime: number;
    cacheLoadTime: number;
    permissionsTime: number;
    syncTime: number;
    initializationTime: number;
    timestamp: number;
}

export class MetricsCollector {
    private metrics: Map<string, PerformanceMetric> = new Map();

    startTiming(name: string, metadata?: Record<string, any>): void {
        this.metrics.set(name, {
            name,
            startTime: performance.now(),
            metadata
        });
    }

    endTiming(name: string): number | null {
        const metric = this.metrics.get(name);
        if (!metric) return null;

        const endTime = performance.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;

        return duration;
    }

    getCurrentTiming(name: string): number | null {
        const metric = this.metrics.get(name);
        return metric ? performance.now() - metric.startTime : null;
    }

    getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    clear(): void {
        this.metrics.clear();
    }
}