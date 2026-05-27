# 🏗️ Software Design Pattern Analysis

## 1. 🔁 Derived State — Cascading without Sync Bugs

### How it works

`Dashboard.tsx:67–77` declares **every derived value as a plain `const`** at the top of the render function, computed from exactly two sources: the `expenses` array and the `period` filter:

```typescript
// Dashboard.tsx, lines 67–77
const totalSpend = calculateTotalSpend(expenses, period);
const todayTotal = calculateTodayTotal(expenses);
const weekTotal = calculateCurrentWeekTotal(expenses);
const monthTotal = calculateMonthTotal(expenses);
const expenseCount = calculateExpenseCount(expenses, period);
const averageSpend = calculateAverageSpend(expenses, period);
const categoriesUsed = calculateCategoriesUsed(expenses, period);
const highestSpend = calculateHighestSpend(expenses, period);
const dailyTotals = calculateDailyTotals(expenses, period);
const categoryTotals = calculateCategoryTotals(expenses, period);
const currentWeekTotal = calculateCurrentWeekTotal(expenses);
```

**Why this eliminates sync bugs:** There are zero `useEffect` calls that watch one state variable and update another. There is no "when X changes, update Y" wiring. Instead, **every render recomputes every value from scratch**. When `expenses` changes (new expense added) or `period` changes (user clicks a filter tab):

```
setExpenses(...) or setPeriod(...)
    │
    ▼
React re-renders Dashboard
    │
    ▼
All 11 const assignments re-run
    │
    ▼
New values flow down as props to <MetricCards>, <DonutChart>, <BarChart>, etc.
    │
    ▼
React reconciles DOM — only the changed parts update
```

There is no window where `totalSpend` reflects the old period but `dailyTotals` reflects the new one. They are computed in the same synchronous pass.

**The same pattern appears in `ExpenseLogView.tsx:113–126`:**

```typescript
const filtered = filterExpenses(expenses, period);
const sorted = [...filtered].sort(/* ... */);
const grouped = new Map</* ... */>();
// ...
const dayGroups = [...grouped.entries()];
```

Again, all computed inline from props, no cached/stale intermediate state.

---

## 2. 🧪 Pure Functions — Filtering & Transformation

### The entire `calculations.ts` file is a pure-function module

Every exported function in `calculations.ts:43–212` satisfies the two laws of purity:
1. **Same input → same output** (no randomness, no Date.now() hidden inside — note: `getWeekRange` calls `new Date()` so it's technically **impure** by date, but deterministic for any given clock tick)
2. **No side effects** (no DOM writes, no localStorage calls, no network requests, no mutations of input arrays)

**Spotlight — `filterExpenses` at line 43:**
```typescript
export function filterExpenses(expenses: Expense[], period: FilterPeriod): Expense[] {
  if (period === 'all-time') return expenses;
  const { start, end } = getWeekRange(period);
  const startStr = toISODate(start);
  const endStr = toISODate(end);
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
}
```

No mutations. No global state access. Just `filter()` producing a new array.

**Spotlight — `calculateCategoryTotals` at line 83:**
```typescript
export function calculateCategoryTotals(expenses: Expense[], period: FilterPeriod): CategoryTotal[] {
  const filtered = filterExpenses(expenses, period);
  const totalSpend = filtered.reduce((sum, e) => sum + e.amount, 0);
  const categoryMap = new Map<Category, number>();
  for (const e of filtered) { categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount); }
  const categories: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];
  return categories.map(category => {
    const catTotal = categoryMap.get(category) ?? 0;
    return {
      category, total: catTotal,
      percentage: totalSpend > 0 ? (catTotal / totalSpend) * 100 : 0,
      color: CATEGORY_COLORS[category],
    };
  });
}
```

Three pure operations chained: `filter` → `reduce` → `map`. The function takes an array in, returns a new array out. It never touches the DOM, never writes to a cache, never mutates a global.

**Spotlight — `calculateBudgetStatus` at line 195:**
```typescript
export function calculateBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return { spent, budget, percentage: 0, remaining: 0, status: 'not-set' };
  }
  const percentage = (spent / budget) * 100;
  const remaining = budget - spent;
  const status = spent > budget ? 'exceeded' : 'on-track';
  return { spent, budget, percentage, remaining, status };
}
```

A mathematical function. Two numbers in, one object out. No hidden dependencies.

**Spotlight — `formatters.ts` is also pure:**
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
```

Same input → same formatted string (Intl.NumberFormat is deterministic). These formatters are called freely inside JSX without concern for side effects.

---

## 3. 🧩 Separation: Presentation vs Business Logic

### Directory structure is the first clue

```
src/
  types/           → Data contracts (expense.ts)
  utils/           → Pure business logic (calculations.ts, formatters.ts)
  hooks/           → State management + persistence (useExpenses.ts, useBudget.ts)
  components/      → Pure presentation (Dashboard.tsx, BarChart.tsx, DonutChart.tsx, etc.)
  styles/          → CSS (main.css)
```

### How data crosses the boundary

**No component imports or calls a calculator directly during event handling** (with one exception, see anti-patterns below). Instead, calculations happen **at the render level** in `Dashboard.tsx`, and results are **passed as props** to leaf components:

```typescript
// Dashboard.tsx:193–198 — orchestrator passes data, not logic
<DonutChart data={categoryTotals} />
<BarChart data={dailyTotals} />
```

**`DonutChart.tsx` (lines 62–136) is a pure presentational component:** it receives `data: CategoryTotal[]`, filters zeros, maps to Recharts format, and renders. It imports nothing from `calculations.ts`.

**`BarChart.tsx` (lines 55–97) is identical in role:** receives `data: DailyTotal[]`, renders a `<RechartsBarChart>`. Zero business logic.

**`MetricCards.tsx` (lines 12–97)** receives pre-computed `totalSpend`, `expenseCount`, `averageSpend`, etc. as props. It only formats and displays.

**The type definitions in `types/expense.ts:1–30` are the contract** between the logic layer and the UI layer. Both sides import from the same file, ensuring shape compatibility at compile time.

---

## 4. 🧊 Immutability — State Operations Never Mutate

### The primary state update: `useExpenses.ts:46–48`

```typescript
const addExpense = useCallback((expense: Expense) => {
  setExpenses(prev => [...prev, expense]);
}, []);
```

This is the **only path that modifies the expense list**. It:
1. Takes the previous array (`prev`)
2. Spreads every element into a **brand-new array** (`[...prev]`)
3. Appends the new expense at the end

The old array is garbage-collected. No `.push()`. No `.splice()`. No mutation of existing objects.

### The persistence layer also respects immutability: `useExpenses.ts:38–44`

```typescript
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // Storage unavailable
  }
}, [expenses]);
```

`JSON.stringify` creates a **new string representation**. It never touches the in-memory array.

### Every calculator function returns new objects

- `filterExpenses` → `Array.filter()` returns a new array (`calculations.ts:49`)
- `calculateDailyTotals` → `.map()` returns a new `DailyTotal[]` (`calculations.ts:75–80`)
- `calculateCategoryTotals` → `.map()` returns a new `CategoryTotal[]` (`calculations.ts:94–102`)
- `calculateHighestSpend` → returns a new `{ amount, merchant }` object (`calculations.ts:132`)
- `ExpenseLogView.tsx:114` → `[...filtered].sort(...)` — spreads before sorting to avoid mutating the filtered array

### Budget state update: `useBudget.ts` follows the same pattern

```typescript
const updateBudget = useCallback((settings: BudgetSettings) => {
  setBudget(settings);   // replaces the entire object
}, []);
```

A new `BudgetSettings` object replaces the old one atomically.

---

## 5. 🎯 Single Source of Truth — No Duplicated State

### The expense array is the root

```
useExpenses().expenses  (src/hooks/useExpenses.ts:36)
    │
    ├──→ calculateTotalSpend(expenses, period)
    ├──→ calculateDailyTotals(expenses, period)
    ├──→ calculateCategoryTotals(expenses, period)
    ├──→ calculateAverageSpend(expenses, period)
    ├──→ calculateHighestSpend(expenses, period)
    ├──→ ExpenseLogView receives expenses + period, computes filtered/sorted/grouped inline
    └──→ DashboardView receives filtered metrics as props (never receives raw expenses for display)
```

**There are no secondary caches.** No derived state is stored in `useState` or `useRef` across renders. Every metric, every chart data point, every log entry is recomputed from the single source.

### The budget is its own single source

```
useBudget().budget  (src/hooks/useBudget.ts)
    │
    ├──→ BudgetTracker receives budget + todayTotal/weekTotal/monthTotal
    └──→ BudgetPage receives budget + updateBudget callback
```

Two independent single-source-of-truth hooks (`useExpenses`, `useBudget`). They never cross-reference each other's state.

### TypeScript enforces the contract

`types/expense.ts:5` defines `FilterPeriod` as the literal union `'this-week' | 'last-week' | 'all-time'`. Every function that accepts a period uses this exact type. The compiler ensures no component can pass an invalid filter value.

---

## 6. ⚠️ Anti-Patterns Found

### 🟡 6a — Duplicate `CATEGORY_COLORS` map

**Defined in two places:**
- `calculations.ts:4–10`
- `ExpenseLogView.tsx:11–17`

Both are identical `Record<Category, string>` maps. If a color is changed in one but not the other, the donut chart colors will diverge from the expense-log dot colors. This should be a shared constant, likely exported from `calculations.ts` or defined in `types/expense.ts`.

### 🟡 6b — No memoization on render-costly derivations

`Dashboard.tsx:67–77` recomputes all metrics **on every render**, even when neither `expenses` nor `period` changed (e.g., when the sidebar nav button is clicked, changing only `activeView`).

Similarly, `ExpenseLogView.tsx:113–126` runs filter + sort + group on every render, even when the visible day groups haven't changed.

For the current dataset size this is invisible, but `useMemo` wrappers would future-proof against performance degradation:

```typescript
const dailyTotals = useMemo(
  () => calculateDailyTotals(expenses, period),
  [expenses, period]
);
```

### 🟡 6c — Silent `catch` blocks in persistence hooks

`useExpenses.ts:41–42`:
```typescript
catch {
  // Storage unavailable
}
```

`useBudget.ts` has the same pattern. Errors from `localStorage.setItem` (quota exceeded, private browsing restrictions, etc.) are swallowed with no user feedback. A user whose localStorage is full will silently lose new expenses.

### 🟡 6d — `isPeriodView` introduces redundant state

`Dashboard.tsx:65`:
```typescript
const [isPeriodView, setIsPeriodView] = useState(false);
```

This boolean duplicates the information of *how the user arrived at the current view*. It's set `true` by `handlePeriodChange` (line 86) and `false` by `handleNavigate` (line 81). If any code path changes `activeView` without going through `handleNavigate`, or changes `period` without going through `handlePeriodChange`, the UI will show the wrong content (the main area switches between two entirely different render trees based on this flag).

A more robust approach would derive the view mode from the active navigation state directly, or consolidate into a single state machine.

### 🟡 6e — `filterExpenses` returns the original reference for `all-time`

`calculations.ts:44`:
```typescript
if (period === 'all-time') return expenses;   // returns SAME reference
```

For all other periods, `.filter()` returns a new array. For `all-time`, the original `expenses` array reference is returned directly. Any code that **mutates** the result would silently corrupt the source of truth. Currently no code does this (all transformers are read-only), but it's a fragile optimization.

### 🟡 6f — Business logic inside presentation (`ExpenseForm.tsx:29–41`)

```typescript
const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.replace(/[^0-9.]/g, '');
  const parts = val.split('.');
  if (parts.length > 2) return;
  if (parts[1] && parts[1].length > 2) return;
  setAmount(val);
};
```

This input-validation logic (strip non-numeric characters, limit decimal places, prevent multiple dots) lives inside a component file. It should live in `utils/formatters.ts` or a dedicated validation module, keeping the component focused on rendering only.

### 🟡 6g — `period` parameter name shadows outer variable

`Dashboard.tsx:84`:
```typescript
function handlePeriodChange(period: FilterPeriod) {
  setPeriod(period);    // parameter shadows state variable of same name
  setIsPeriodView(true);
}
```

Not a bug (the parameter correctly shadows and is used immediately), but it creates a moment of confusion on first read — a reader scanning the function body sees `setPeriod(period)` and must mentally verify which `period` is which.

---

## Summary

| Principle | Status | Strongest Example | Weakest Point |
|---|---|---|---|
| **Derived State** | ✅ Excellent | `Dashboard.tsx:67–77` inline computations | No memoization (`useMemo`) |
| **Pure Functions** | ✅ Excellent | `calculations.ts` — all exported functions | `getWeekRange` depends on `Date()` (clock impurity) |
| **Separation of Concerns** | ✅ Strong | `utils/` vs `components/` directory split | `ExpenseForm.tsx:29` validation logic in component |
| **Immutability** | ✅ Excellent | `useExpenses.ts:47` — `[...prev, expense]` | `calculations.ts:44` returns original ref for all-time |
| **Single Source of Truth** | ✅ Excellent | `expenses` array is the root of all metrics | `isPeriodView` is a derived-boolean duplication |
