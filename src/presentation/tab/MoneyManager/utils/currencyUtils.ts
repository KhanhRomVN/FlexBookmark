import { CURRENCIES } from '../constants/constants';

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    lastUpdated: Date;
}

const EXCHANGE_RATE_CACHE_KEY = 'money_exchange_rates_cache';
const EXCHANGE_RATE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Mock exchange rates - in a real app, you would fetch these from an API
const MOCK_EXCHANGE_RATES: Record<string, Record<string, number>> = {
    VND: { USD: 0.000043, EUR: 0.000039, JPY: 0.0059, GBP: 0.000033, CNY: 0.00029 },
    USD: { VND: 23250, EUR: 0.91, JPY: 137.5, GBP: 0.77, CNY: 6.75 },
    EUR: { VND: 25500, USD: 1.10, JPY: 151.0, GBP: 0.85, CNY: 7.42 },
    JPY: { VND: 169, USD: 0.0073, EUR: 0.0066, GBP: 0.0056, CNY: 0.049 },
    GBP: { VND: 30200, USD: 1.30, EUR: 1.18, JPY: 178.5, CNY: 8.75 },
    CNY: { VND: 3450, USD: 0.15, EUR: 0.135, JPY: 20.4, GBP: 0.114 }
};

export const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: ExchangeRate[]
): number => {
    if (fromCurrency === toCurrency) return amount;

    const rate = exchangeRates.find(
        r => r.from === fromCurrency && r.to === toCurrency
    );

    if (!rate) {
        // Fallback to mock rates if no rate found
        const mockRate = MOCK_EXCHANGE_RATES[fromCurrency]?.[toCurrency];
        if (mockRate) {
            return amount * mockRate;
        }
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return amount * rate.rate;
};

export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
    // Try to get cached rates first
    const cachedRates = await getCachedExchangeRates();
    if (cachedRates) return cachedRates;

    try {
        // In a real app, you would fetch from an API like:
        // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        // const data = await response.json();

        // For now, we'll use mock data and simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const rates: ExchangeRate[] = [];
        const now = new Date();

        // Generate rates from mock data
        Object.entries(MOCK_EXCHANGE_RATES).forEach(([from, toRates]) => {
            Object.entries(toRates).forEach(([to, rate]) => {
                rates.push({
                    from,
                    to,
                    rate,
                    lastUpdated: now
                });
            });
        });

        // Cache the rates
        await cacheExchangeRates(rates);

        return rates;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Return empty array if API fails
        return [];
    }
};

export const cacheExchangeRates = async (rates: ExchangeRate[]): Promise<void> => {
    const cacheData = {
        data: rates,
        timestamp: Date.now()
    };

    return new Promise((resolve) => {
        chrome.storage.local.set({
            [EXCHANGE_RATE_CACHE_KEY]: cacheData
        }, () => resolve());
    });
};

export const getCachedExchangeRates = async (): Promise<ExchangeRate[] | null> => {
    return new Promise((resolve) => {
        chrome.storage.local.get([EXCHANGE_RATE_CACHE_KEY], (result) => {
            if (!result[EXCHANGE_RATE_CACHE_KEY] || !result[EXCHANGE_RATE_CACHE_KEY].data) {
                resolve(null);
                return;
            }

            const { data, timestamp } = result[EXCHANGE_RATE_CACHE_KEY];
            const isExpired = Date.now() - timestamp > EXCHANGE_RATE_EXPIRY;

            if (isExpired) {
                resolve(null);
            } else {
                // Convert string dates back to Date objects
                const rates = data.map((rate: any) => ({
                    ...rate,
                    lastUpdated: new Date(rate.lastUpdated)
                }));
                resolve(rates);
            }
        });
    });
};

export const formatCurrency = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
    });

    return formatter.format(amount);
};

export const getCurrencySymbol = (currency: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    // Extract the currency symbol from the formatted string
    const parts = formatter.formatToParts(1);
    const symbol = parts.find(part => part.type === 'currency')?.value;

    return symbol || currency;
};

export const isValidCurrency = (currency: string): boolean => {
    return Object.values(CURRENCIES).includes(currency as any);
};