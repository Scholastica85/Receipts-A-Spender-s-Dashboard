import { useState, useEffect, useCallback } from 'react';
import type { BudgetSettings } from '../types/expense';

const STORAGE_KEY = 'spender-dashboard-budget';

function loadBudget(): BudgetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { daily: 0, weekly: 0, monthly: 0 };
    const parsed = JSON.parse(raw);
    return {
      daily: Number(parsed.daily) || 0,
      weekly: Number(parsed.weekly) || 0,
      monthly: Number(parsed.monthly) || 0,
    };
  } catch {
    return { daily: 0, weekly: 0, monthly: 0 };
  }
}

export function useBudget() {
  const [budget, setBudget] = useState<BudgetSettings>(loadBudget);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
      setStorageError(null);
    } catch (err) {
      const msg = err instanceof DOMException
        ? err.name === 'QuotaExceededError'
          ? 'Storage is full. Free up space or remove old entries.'
          : err.name === 'SecurityError'
            ? 'Browser storage access is blocked. Check your privacy settings.'
            : `Storage error: ${err.message}`
        : 'Unable to save budget data to local storage.';
      setStorageError(msg);
    }
  }, [budget]);

  const updateBudget = useCallback((settings: BudgetSettings) => {
    setBudget(settings);
  }, []);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  return { budget, updateBudget, storageError, clearStorageError };
}
