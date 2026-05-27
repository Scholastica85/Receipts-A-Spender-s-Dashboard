# 🛡️ Pessimistic Engineering Audit

This document evaluates every likely failure mode across four threat surfaces. Each finding is tagged with severity: **🔴 Critical**, **🟠 High**, **🟡 Medium**, **🔵 Low**.

---

## 1. 💾 localStorage Failures

### 1a — Storage is blocked or unavailable (private browsing, enterprise policy)

**Files:** `useExpenses.ts:23–32`, `useExpenses.ts:38–44`, `useBudget.ts:6–19`, `useBudget.ts:24–30`

**What happens:**

- `loadExpenses()` wraps `getItem()` in try-catch. If the browser throws (`SecurityError` for denied access, `ReferenceError` if the API doesn't exist entirely), the function returns `[]` — an empty array. The app renders with zero expenses. **No crash.**
- `loadBudget()` has the same protection. Returns `{ daily: 0, weekly: 0, monthly: 0 }`. **No crash.**
- The `useEffect` that writes back (`setItem`) also has a try-catch **with an empty block** (lines 41–42 comment: `// Storage unavailable`).

**🔴 CRITICAL — Silent data loss on blocked storage:**

A user adds 50 expenses over a session. Every `setItem` inside the `useEffect` silently throws. The `catch` block is completely empty — no console warning, no user-facing toast, no fallback. On page refresh, all 50 expenses vanish. The user has no indication that persistence failed.

```
Sequence:
  1. User adds expense → addExpense() updates React state
  2. useEffect fires → localStorage.setItem() throws → catch {}
  3. User sees expense in UI (it's in memory) → thinks it's saved
  4. User refreshes → loadExpenses() returns [] → all data gone
  5. User has no way to know anything went wrong
```

**🔴 CRITICAL — Same pattern in `useBudget.ts:27–28`:**

Budget limits changed by the user are silently lost on the same failure mode.

**🟠 HIGH — Quota exceeded (5MB cap):**

`localStorage` is limited to ~5MB per origin. A single expense object is roughly 200 bytes as JSON. At 25,000 expenses, the 5MB ceiling is reached. `setItem` throws `QuotaExceededError` → silent catch → all subsequent writes are lost. Existing data in storage is NOT cleared, so the user gets a confusing partial-save state: some data persists from earlier sessions, but the most recent additions are lost.

**🟡 MEDIUM — Corrupt storage data:**

If `localStorage` contains malformed JSON (bit rot, manual tampering, race condition from another tab):

```
loadExpenses():
  try {
    const raw = localStorage.getItem(STORAGE_KEY);  // returns a string
    const parsed = JSON.parse(raw);                   // throws SyntaxError
  } catch {
    return [];                                        // all data lost
  }
```

The corrupt entry is silently discarded. The user loses every expense. No recovery attempt, no backup key, no console error logged. The old key is overwritten on the next `useEffect` write, destroying any chance of manual recovery.

**Recommended patches:**

| Patch | Severity |
|---|---|
| Add a `console.warn` or `console.error` inside every `catch` block so failures appear in DevTools | 🟡 |
| Show a dismissible banner in the UI: "Changes are not being saved to your browser's storage" | 🔴 |
| On `QuotaExceededError`, evict the oldest expenses before retrying, or prompt user to export | 🟠 |
| Validate JSON before parse (try `JSON.parse` inside the try; if it fails, store a backup under a secondary key before clearing) | 🟡 |

---

## 2. 🫙 Empty State Performance

### 2a — Visual layout with zero expenses

**All scenarios evaluated with `expenses = []`:**

| Component | Behavior | Verdict |
|---|---|---|
| `Dashboard.tsx:67` – `totalSpend` | `filterExpenses([], 'this-week')` → `[].reduce(sum, 0)` → `0` | ✅ |
| `Dashboard.tsx:68` – `todayTotal` | `[].filter(...).reduce(...)` → `0` | ✅ |
| `Dashboard.tsx:71` – `expenseCount` | `filterExpenses([], 'this-week').length` → `0` | ✅ |
| `Dashboard.tsx:72` – `averageSpend` | `filtered.length === 0` → early return `0` (`calculations.ts:116`) | ✅ |
| `Dashboard.tsx:73` – `categoriesUsed` | `new Set([].map()).size` → `0` | ✅ |
| `Dashboard.tsx:74` – `highestSpend` | `filtered.length === 0` → returns `null` (`calculations.ts:130`) | ✅ |
| `MetricCards` receives null | `highestSpend ? ... : 'No expenses yet'` (`MetricCards.tsx:93`) | ✅ |
| `DonutChart` receives empty data | `chartData = [].filter(d => d.total > 0)` → empty → shows "No category data for this period" (`DonutChart.tsx:76–78`) | ✅ |
| `BarChart` receives 7 zero-value datapoints | All bars render at height 0. Axis shows `$0` for all ticks. Graph is flatline. | ✅ (ambiguous — no empty state message, user sees an empty grid with $0 labels) |
| `ExpenseLogView` | `filtered = []` → `sorted = []` → `dayGroups = []` → shows "No expenses recorded for this period" (`ExpenseLogView.tsx:148`) | ✅ |
| `BudgetTracker` | `todayTotal=0`, `weekTotal=0`, `monthTotal=0`, budget=0 → `calculateBudgetStatus(0,0)` → `status: 'not-set'` → shows "No budget set" | ✅ |

**🔵 LOW — `DashboardView.tsx:41` — Plural grammar:**

When `activeDays` is `0`, the text reads `"0 days with activity"`. This is grammatically correct but contextually odd — the user has never used the app, and "0 days with activity" sounds like they stopped using it rather than never started.

**🔵 LOW — `BarChart` has no dedicated empty state:**

Unlike `DonutChart` (which shows an explicit "No category data for this period" message), the `BarChart` component has no `data.length === 0` guard. It receives 7 zero-value `DailyTotal` entries and renders a flat line at Y=0. A completely new user sees an empty bar chart with no explanation.

### 2b — Console behavior with zero expenses

**No errors are expected.** Every code path that accesses expense data is guarded:
- Array methods (`.filter`, `.map`, `.reduce`) on empty arrays are safe
- `calculateHighestSpend` null-checked with `if (filtered.length === 0) return null`
- `formatCurrency(0)` → `"$0.00"` — no error
- `d.percentage.toFixed(0)` on 0 → `"0"` — no error
- `new Set()`, `new Map()` on empty data — no error
- The `<Pie>` component with `data={[]}` renders nothing (Recharts handles empty arrays gracefully)

**No warnings from React or Recharts with empty data.**

### Recommended patches:

| Patch | Severity |
|---|---|
| Add a `data.length === 0` guard in `BarChart.tsx` with the same empty-state layout as `DonutChart` | 🔵 |
| Change "0 days with activity" to "No activity yet" when `activeDays === 0` | 🔵 |

---

## 3. 📈 Scalability — 1,000+ Expenses

### 3a — Derived state computation cost

**Baseline:** Each expense object is ~200 bytes as JSON. 1,000 expenses ≈ 200KB in memory. `JSON.parse`/`JSON.stringify` overhead is negligible.

**Per-render computation cost (traced through `Dashboard.tsx:67–77`):**

| Function | O-notation | Ops at 1,000 items |
|---|---|---|
| `calculateTotalSpend` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateTodayTotal` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateCurrentWeekTotal` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateMonthTotal` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateExpenseCount` | O(n) | 1 filter + `.length` (~1,000 iterations) |
| `calculateAverageSpend` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateCategoriesUsed` | O(n) | 1 filter + 1 map + 1 Set (~2,000 iterations) |
| `calculateHighestSpend` | O(n) | 1 filter + 1 reduce (~2,000 iterations) |
| `calculateDailyTotals` | O(n) | 1 filter + 1 loop + 1 map (~2,000 iterations) |
| `calculateCategoryTotals` | O(n) | 1 filter + 1 reduce + 1 loop + 1 map (~3,000 iterations) |
| **Total (worst case)** | **O(n)** | **~19 filter/reduce/map passes over the full array** |

**🔴 CRITICAL — 19x array iteration per render:**

Every render of `Dashboard` iterates the entire expenses array approximately 19 times (each calculator independently calls `filterExpenses`, then does its own aggregation). At 1,000 items this is invisible (~1–2ms). At 100,000 items this freezes the UI for 100–200ms.

The deeper problem: these 19 passes happen **even when neither `expenses` nor `period` changed**. If `activeView` changes (user clicks a sidebar button), the entire `Dashboard` re-renders and all 19 passes re-run. If the user opens the Settings view, the same 19 passes run — even though Settings doesn't display any expense metrics.

**In `ExpenseLogView.tsx:113–114`:**

```typescript
const filtered = filterExpenses(expenses, period);  // O(n) filter
const sorted = [...filtered].sort(...);              // O(n log n) sort + O(n) spread copy
```

At 1,000 items, the sort is ~10,000 comparisons. At 10,000 items, it's ~100,000 comparisons. This runs on every render of the Expense Log tab, including when the modal opens/closes (`selectedExpense` state change triggers a re-render).

**🟡 MEDIUM — `useMemo` absence:**

None of the 11 derived values in `Dashboard.tsx:67–77` are wrapped in `useMemo`. Every sibling state change (`isPeriodView`, `activeView`) triggers a full recomputation:

```typescript
// What exists:
const dailyTotals = calculateDailyTotals(expenses, period);

// What should exist for large datasets:
const dailyTotals = useMemo(
  () => calculateDailyTotals(expenses, period),
  [expenses, period]
);
```

### 3b — DOM and Recharts rendering cost

**🟠 HIGH — No virtualized list in `ExpenseLogView`:**

At 1,000 expenses, the expense log renders ~1,000 DOM nodes (each with border, padding, hover transitions). The Recharts `<ResponsiveContainer>` also creates hundreds of SVG elements. If the user scrolls the log while a chart is visible, the browser paints ~1,500+ elements every frame.

No `react-window`, `react-virtuoso`, or any virtualization library is used. Every expense is rendered as a real DOM element. A mobile device with 1,000 expenses will stutter during scroll.

**🟠 HIGH — All-time daily chart at 1,000 expenses:**

`calculateDailyTotals` with `period='all-time'` generates one bar per unique date. If 1,000 expenses are spread across 365 days, Recharts renders 365 `<rect>` bars. At `maxBarSize={40}`, each bar is 40px wide, requiring a chart area of 14,600px. Inside a 300px container, the bars compress to ~0.8px each — essentially invisible. The chart becomes a solid gradient block with no readable data.

**🔵 LOW — `DonutChart` scale invariant:**

The donut chart has at most 5 slices (one per category). Category aggregation is O(n) and independent of the number of unique dates. This component scales perfectly to any dataset size.

### 3c — localStorage quota with 1,000 expenses

1,000 expense objects at ~200 bytes each = 200KB. `JSON.stringify` overhead adds ~20%. Total: ~240KB. This is well within the 5MB `localStorage` limit. **Not a concern at 1,000 items.** Becomes a concern at ~20,000 items.

### Recommended patches:

| Patch | Severity |
|---|---|
| Wrap all 11 derived values in `Dashboard.tsx:67–77` with `useMemo` keyed on `[expenses, period]` | 🟡 |
| Memoize `ExpenseLogView` intermediate values (`filtered`, `sorted`, `grouped`, `dayGroups`) | 🟡 |
| Add `React.memo` to leaf components (`MetricCards`, `DonutChart`, `BarChart`, `BudgetTracker`) | 🟡 |
| Extract the all-time daily chart to a separate component that downsamples or paginates data | 🟠 |
| Add virtual scrolling (`react-window`) to `ExpenseLogView` for >200 items | 🟠 |

---

## 4. 🧮 Input Boundary Issues

### 4a — Category enforcement

**🟢 SAFE — Category input is locked to a `<select>`:**

`ExpenseForm.tsx:90–98` renders a `<select>` with 5 hardcoded `<option>` elements. The user cannot type a custom category. The TypeScript cast `e.target.value as Category` is type-safe because the runtime value always comes from the `CATEGORIES` array.

**🟢 SAFE — `migrateItem` handles corrupt categories from storage:**

`useExpenses.ts:14–16`:
```typescript
category: (VALID_CATEGORIES as readonly string[]).includes(category)
  ? (category as Category)
  : 'Other',
```

An invalid category from localStorage (e.g., `"Entertainment"`, `"null"`, `""`) is silently downgraded to `"Other"`. Always safe. Never throws.

### 4b — Trailing and leading whitespace

**🔵 LOW — `merchant` and `notes` are never trimmed:**

`ExpenseForm.tsx:39–45`:
```typescript
onAdd({
  id: generateId(),
  merchant,        // ← "  Starbucks  " stored as-is
  amount: numAmount,
  category,
  date,
  notes,           // ← "  some note  " stored as-is
  createdAt: new Date().toISOString(),
});
```

Neither field is `.trim()`'d before storage. This causes:
- Display: `"  Starbucks  "` renders with visible extra spaces in the expense log
- Sorting/grouping: `formatDayHeader` compares dates by string equality — unaffected
- No security risk, purely cosmetic/normalization

**🔵 LOW — Category is always trimmed:**

`<select>` values have no leading/trailing whitespace in their `value` attribute. Categories are inherently safe.

### 4c — Massive currency values

**🟠 HIGH — No upper bound on `amount`:**

`handleAmountChange` at `ExpenseForm.tsx:25–31`:
```typescript
const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.replace(/[^0-9.]/g, '');
  const parts = val.split('.');
  if (parts.length > 2) return;
  if (parts[1] && parts[1].length > 2) return;
  setAmount(val);
};
```

This only constrains formatting (digits, one decimal point, max 2 fractional digits). It does **not** constrain magnitude. A user can type `"99999999999999999999999999999999999999"` (38 digits) and submit it.

**Failure cascade with extreme values:**

```
Input:        "1" + "0".repeat(309)  (310 characters)
parseFloat:   1e+309 → Infinity
Stored as:    Infinity

formatCurrency(Infinity)
  → Intl.NumberFormat formats Infinity as "$∞" (Chrome) or "$Infinity.00"
  → Displayed in MetricCards, ExpenseLog, BudgetTracker, charts

calculateCategoryTotals:
  totalSpend = Infinity (from reduce)
  percentage = (catTotal / Infinity) * 100 → 0 for every category except the one with Infinity
  percentage = (Infinity / Infinity) * 100 → NaN for the Infinity category

DonutChart: d.percentage.toFixed(0) → NaN → renders "NaN%"
BarChart: YAxis tickFormatter → "$Infinity"
BudgetTracker: percentage > 100 → true → red exceeded bar with "-$Infinity"
```

The app does not crash — React renders `"NaN"` and `"Infinity"` as text strings — but the dashboard becomes meaningless.

**🟡 MEDIUM — Same risk via `addExpense` from any source:**

If future code calls `addExpense({ amount: Infinity })` programmatically (import of malformed data, test helper, etc.), every derived calculation is contaminated.

**🔵 LOW — Decimal granularity mismatch:**

The input allows up to 2 decimal places (cents), which is correct for USD. But `amount` is stored as a raw JavaScript `Number`, which uses binary floating point. Values like `0.10 + 0.20 = 0.30000000000000004` accumulate rounding errors over hundreds of transactions. The `formatCurrency` display rounds to 2 decimals, masking the problem, but:
- `calculateTotalSpend` accumulates floating-point error
- `calculateAverageSpend` divides error-prone totals
- `calculateBudgetStatus` comparisons (`spent > budget`) can have off-by-one-cent errors

### 4d — Date boundary issues

**🔵 LOW — Future dates allowed:**

`ExpenseForm.tsx:126–131` uses a native `<input type="date">` with no `max` attribute. The user can select any future date. This means:
- `calculateCurrentWeekTotal` may be inflated by future-dated expenses
- `calculateMonthTotal` includes future entries
- No functional crash; data integrity concern only

**🔵 LOW — `toISODate` dependency on local time:**

`formatters.ts:20–24`:
```typescript
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

This uses local timezone. If a user near midnight UTC (e.g., 11 PM in a UTC+2 timezone) adds an expense, `toISODate(new Date())` gives today's date, but `new Date().toISOString()` in `createdAt` uses UTC and may return tomorrow's date. The date comparison in `filterExpenses` uses the `date` field (local), but sorting falls through to `createdAt` comparison (`ExpenseLogView.tsx:114`). Across a timezone boundary, an expense added at 1 AM UTC could appear on the wrong day in the log.

### 4e — Missing form validation feedback

**🟡 MEDIUM — Silent submission failure:**

`ExpenseForm.tsx:36`:
```typescript
if (isNaN(numAmount) || numAmount <= 0) return;
```

When the submit button is clicked with an empty or zero amount, **nothing happens**. No error message, no field highlight, no console log. The user may click repeatedly, wondering why nothing is saved. Same for empty merchant (allowed but confusing UX).

### Recommended patches:

| Patch | Severity |
|---|---|
| `.trim()` `merchant` and `notes` in `handleSubmit` before storing | 🔵 |
| Cap `amount` at `Number.MAX_SAFE_INTEGER` (9e15) or `1e12` ($1 trillion) with a validation message | 🟠 |
| Validate `amount` is finite: `if (!isFinite(numAmount) || numAmount <= 0) return` (catches `Infinity`) | 🟠 |
| Show inline validation error (red text) for zero/invalid amounts instead of silent return | 🟡 |
| Add `max={toISODate(new Date())}` to the date input | 🔵 |
| Store `amount` as integer cents (`amount * 100`) to avoid floating-point drift | 🟡 |
| Alert the user via a toast or banner when `localStorage.setItem` fails | 🔴 |
| Log errors to console in all catch blocks | 🟡 |

---

## Summary of Critical and High Findings

| # | Severity | Area | Issue |
|---|---|---|---|
| 1a | 🔴 | localStorage | Silent catch blocks cause total data loss on blocked storage with zero user feedback |
| 2a | 🔵 | Empty state | `BarChart` lacks empty-state UI (unlike `DonutChart`) |
| 3a | 🔴 | Scalability | 19x array iteration per render with zero memoization; every state change triggers full recomputation |
| 3b | 🟠 | Scalability | No list virtualization; 1,000+ expenses create 1,000+ DOM nodes in the log |
| 3b | 🟠 | Scalability | All-time daily chart with 365 bars collapses to unreadable pixel width |
| 4c | 🟠 | Input | No upper bound on `amount`; `Infinity` and `NaN` propagate through the entire dashboard |
| 4c | 🟡 | Input | Floating-point accumulation error in all monetary calculations |
| 4e | 🟡 | Input | Silent form failure with no user feedback on invalid amounts |
