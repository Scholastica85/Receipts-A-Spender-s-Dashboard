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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
    } catch {
      // Storage unavailable
    }
  }, [budget]);

  const updateBudget = useCallback((settings: BudgetSettings) => {
    setBudget(settings);
  }, []);

  return { budget, updateBudget };
}
