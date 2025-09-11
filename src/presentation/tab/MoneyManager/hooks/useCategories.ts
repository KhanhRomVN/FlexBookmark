import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryFormData } from '../types/types';
import { useAuth } from '../../../../contexts/AuthContext';
import { MoneyServer } from '../services/moneyService';
import { cacheCategories, getCachedCategories } from '../utils/cacheUtils';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const { authState, getFreshToken } = useAuth();

    const loadCategories = useCallback(async () => {
        if (!authState.isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Try to load from cache first
            const cachedCategories = await getCachedCategories();
            if (cachedCategories) {
                setCategories(cachedCategories);
            }

            // Load from server
            const token = await getFreshToken();
            if (token) {
                const moneyService = new MoneyServer(token);
                const categoriesData = await moneyService.fetchCategories();
                setCategories(categoriesData);
                await cacheCategories(categoriesData);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, getFreshToken]);

    const addCategory = useCallback(async (formData: CategoryFormData) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.createCategory(formData);

            // Reload categories to get the latest data
            await loadCategories();
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, loadCategories]);

    const updateCategory = useCallback(async (category: Category) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.updateCategory(category);

            // Update local state
            setCategories(prev => prev.map(c => c.id === category.id ? category : c));
            await cacheCategories(categories.map(c => c.id === category.id ? category : c));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, categories]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    return {
        categories,
        loading,
        error,
        addCategory,
        updateCategory,
        reloadCategories: loadCategories
    };
};