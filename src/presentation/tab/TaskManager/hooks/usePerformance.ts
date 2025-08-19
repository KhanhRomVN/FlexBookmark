export class PerformanceMonitor {
    private metrics = new Map<string, number[]>();

    startTimer(operation: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            if (!this.metrics.has(operation)) {
                this.metrics.set(operation, []);
            }
            const measurements = this.metrics.get(operation)!;
            measurements.push(duration);

            // Keep only last 100 measurements
            if (measurements.length > 100) {
                measurements.splice(0, measurements.length - 100);
            }
        };
    }

    getAverageTime(operation: string): number {
        const measurements = this.metrics.get(operation);
        if (!measurements || measurements.length === 0) return 0;
        return measurements.reduce((a, b) => a + b, 0) / measurements.length;
    }

    getStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
        const stats: Record<string, any> = {};
        for (const [operation, measurements] of this.metrics) {
            if (measurements.length > 0) {
                stats[operation] = {
                    avg: this.getAverageTime(operation),
                    min: Math.min(...measurements),
                    max: Math.max(...measurements),
                    count: measurements.length
                };
            }
        }
        return stats;
    }
}

export function usePerformance() {
    const performanceMonitor = new PerformanceMonitor();

    return {
        performanceMonitor,
        getPerformanceStats: () => performanceMonitor.getStats(),
        startTimer: (operation: string) => performanceMonitor.startTimer(operation)
    };
}