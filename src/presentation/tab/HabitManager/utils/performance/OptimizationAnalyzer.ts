export interface OptimizationStats {
    cacheHitRate: number;
    backgroundSyncCount: number;
    errorRate: number;
    averageLoadTime: number;
    improvements: string[];
}

export class OptimizationAnalyzer {
    analyzeLoadTimes(stats: LoadTimeStats[]): OptimizationStats {
        if (stats.length === 0) {
            return {
                cacheHitRate: 0,
                backgroundSyncCount: 0,
                errorRate: 0,
                averageLoadTime: 0,
                improvements: ['No data available yet']
            };
        }

        const recentStats = stats.slice(-10);
        const averageLoadTime = this.calculateAverageLoadTime(recentStats);
        const improvements = this.generateImprovements(recentStats, averageLoadTime);
        const cacheHitRate = this.calculateCacheHitRate(recentStats);

        return {
            cacheHitRate,
            backgroundSyncCount: 0,
            errorRate: 0,
            averageLoadTime,
            improvements
        };
    }

    private calculateAverageLoadTime(stats: LoadTimeStats[]): number {
        return stats.reduce((sum, stat) => sum + stat.totalLoadTime, 0) / stats.length;
    }

    private calculateCacheHitRate(stats: LoadTimeStats[]): number {
        const fastLoads = stats.filter(stat => stat.totalLoadTime < 1000).length;
        return (fastLoads / stats.length) * 100;
    }

    private generateImprovements(stats: LoadTimeStats[], averageLoadTime: number): string[] {
        const improvements: string[] = [];

        if (averageLoadTime > 5000) {
            improvements.push('Consider implementing more aggressive caching');
        }

        if (stats.some(stat => stat.authTime > 3000)) {
            improvements.push('Auth taking too long - check network connection');
        }

        if (stats.some(stat => stat.syncTime > 8000)) {
            improvements.push('Sync operations are slow - consider data pagination');
        }

        return improvements.length > 0 ? improvements : ['Performance is optimal'];
    }
}