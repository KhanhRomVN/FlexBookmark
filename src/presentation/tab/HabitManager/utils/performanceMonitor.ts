import React from "react";

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface LoadTimeStats {
    totalLoadTime: number;
    authTime: number;
    cacheLoadTime: number;
    permissionsTime: number;
    syncTime: number;
    initializationTime: number;
    timestamp: number;
}

interface OptimizationStats {
    cacheHitRate: number;
    backgroundSyncCount: number;
    errorRate: number;
    averageLoadTime: number;
    improvements: string[];
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, PerformanceMetric> = new Map();
    private historicalStats: LoadTimeStats[] = [];

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // Start timing a specific operation
    startTiming(name: string, metadata?: Record<string, any>): void {
        this.metrics.set(name, {
            name,
            startTime: performance.now(),
            metadata
        });
        console.log(`⏱️ Started timing: ${name}`);
    }

    // End timing and calculate duration
    endTiming(name: string): number | null {
        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`No timing started for: ${name}`);
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;

        console.log(`⏱️ Completed timing: ${name} - ${duration.toFixed(2)}ms`);
        return duration;
    }

    // Get current timing for an operation (while it's still running)
    getCurrentTiming(name: string): number | null {
        const metric = this.metrics.get(name);
        if (!metric) return null;

        return performance.now() - metric.startTime;
    }

    // Record complete load time stats
    recordLoadTime(stats: Omit<LoadTimeStats, 'timestamp'>): void {
        const completeStats: LoadTimeStats = {
            ...stats,
            timestamp: Date.now()
        };

        this.historicalStats.push(completeStats);

        // Keep only last 50 load times to prevent memory bloat
        if (this.historicalStats.length > 50) {
            this.historicalStats = this.historicalStats.slice(-50);
        }

        // Store in cache for persistence
        this.saveStatsTocache(completeStats);

        console.log('Load Time Stats:', completeStats);
    }

    // Get optimization recommendations
    getOptimizationStats(): OptimizationStats {
        if (this.historicalStats.length === 0) {
            return {
                cacheHitRate: 0,
                backgroundSyncCount: 0,
                errorRate: 0,
                averageLoadTime: 0,
                improvements: ['No data available yet']
            };
        }

        const recentStats = this.historicalStats.slice(-10); // Last 10 loads
        const averageLoadTime = recentStats.reduce((sum, stat) => sum + stat.totalLoadTime, 0) / recentStats.length;

        const improvements: string[] = [];

        // Analyze performance and suggest improvements
        if (averageLoadTime > 5000) {
            improvements.push('Consider implementing more aggressive caching');
        }

        if (recentStats.some(stat => stat.authTime > 3000)) {
            improvements.push('Auth taking too long - check network connection');
        }

        if (recentStats.some(stat => stat.syncTime > 8000)) {
            improvements.push('Sync operations are slow - consider data pagination');
        }

        const fastLoads = recentStats.filter(stat => stat.totalLoadTime < 1000).length;
        const cacheHitRate = (fastLoads / recentStats.length) * 100;

        return {
            cacheHitRate,
            backgroundSyncCount: 0, // Would need to track this separately
            errorRate: 0, // Would need to track this separately
            averageLoadTime,
            improvements: improvements.length > 0 ? improvements : ['Performance is optimal']
        };
    }

    // Benchmark specific operation
    async benchmark<T>(name: string, operation: () => Promise<T>): Promise<T> {
        this.startTiming(name);
        try {
            const result = await operation();
            this.endTiming(name);
            return result;
        } catch (error) {
            this.endTiming(name);
            console.error(`Benchmark failed for ${name}:`, error);
            throw error;
        }
    }

    // Get performance report
    getPerformanceReport(): {
        currentSession: PerformanceMetric[];
        recentLoadTimes: LoadTimeStats[];
        optimizationStats: OptimizationStats;
    } {
        return {
            currentSession: Array.from(this.metrics.values()),
            recentLoadTimes: this.historicalStats.slice(-10),
            optimizationStats: this.getOptimizationStats()
        };
    }

    // Save stats to cache
    private async saveStatsTocache(stats: LoadTimeStats): Promise<void> {
        try {
            const existingStats = await this.loadStatsFromCache();
            const allStats = [...existingStats, stats].slice(-20); // Keep last 20

            await new Promise<void>((resolve) => {
                chrome.storage.local.set({
                    'performance_stats': allStats
                }, () => resolve());
            });
        } catch (error) {
            console.warn('Failed to save performance stats:', error);
        }
    }

    // Load stats from cache
    private async loadStatsFromCache(): Promise<LoadTimeStats[]> {
        try {
            return new Promise((resolve) => {
                chrome.storage.local.get(['performance_stats'], (result) => {
                    resolve(result.performance_stats || []);
                });
            });
        } catch (error) {
            console.warn('Failed to load performance stats:', error);
            return [];
        }
    }

    // Clear all metrics and stats
    clear(): void {
        this.metrics.clear();
        this.historicalStats = [];
    }
}

// Utility functions for easy performance tracking
export const PerfUtils = {
    // Time a function call
    async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
        const monitor = PerformanceMonitor.getInstance();
        return monitor.benchmark(name, fn);
    },

    // Time a synchronous function
    timeFunctionSync<T>(name: string, fn: () => T): T {
        const monitor = PerformanceMonitor.getInstance();
        monitor.startTiming(name);
        try {
            const result = fn();
            monitor.endTiming(name);
            return result;
        } catch (error) {
            monitor.endTiming(name);
            throw error;
        }
    },

    // Create a performance decorator for class methods
    createPerfDecorator(name: string) {
        return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
            const method = descriptor.value;

            descriptor.value = async function (...args: any[]) {
                const monitor = PerformanceMonitor.getInstance();
                monitor.startTiming(`${name}.${propertyName}`);
                try {
                    const result = await method.apply(this, args);
                    monitor.endTiming(`${name}.${propertyName}`);
                    return result;
                } catch (error) {
                    monitor.endTiming(`${name}.${propertyName}`);
                    throw error;
                }
            };
        };
    },

    // Log performance milestone
    logMilestone(message: string): void {
        console.log(`🚀 Performance Milestone: ${message} at ${Date.now()}`);
    }
};

// Hook for React components to track render performance
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

export default PerformanceMonitor;