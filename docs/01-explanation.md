# 🧠 ELI7: How Spender's Dashboard Works Under the Hood

Imagine you have a **magic money-journal** that lives entirely in your pocket. There is no bank server, no internet, no cloud — just you, a notebook, and a pen that never runs out of ink. This dashboard works exactly like that: **everything happens inside your browser, on your machine, from the moment you open the page.**

Below is a tour of the three superpowers that make it tick.

---

## 1. 🗃️ How Raw Expense Data Is Pulled from `localStorage`

### The "Shoebox Under the Bed" Metaphor

Think of `localStorage` as a **shoebox hidden under your bed**. When you close your browser and go to sleep, the shoebox stays there. When you open the dashboard again, you pull the shoebox out and dump the contents on the floor — that's the **data loading** step.

**The file that does this:** `src/hooks/useExpenses.ts`

```
                  ┌─────────────────────────────┐
                  │     localStorage             │
                  │  ("spender-dashboard-expenses"│
                  │   = a JSON string)           │
                  └──────────┬──────────────────┘
                             │
                    loadExpenses() reads it
                             │
                             ▼
                  ┌─────────────────────────────┐
                  │  JSON.parse(raw)             │
                  │  → array of plain objects    │
                  └──────────┬──────────────────┘
                             │
                   migrateItem() makes sure
                   every field is correct type
                             │
                             ▼
                  ┌─────────────────────────────┐
                  │  useState<Expense[]>(loadExpenses)
                  │  → "expenses" state variable │
                  └─────────────────────────────┘
```

**Line-by-line walkthrough:**

**Lines 1–3:** Imports. `useState` and `useEffect` are React hooks (like a magical toolbelt). `useCallback` is a performance gizmo.

**Line 5:** `STORAGE_KEY = 'spender-dashboard-expenses'` — this is the **label on the shoebox**. It's the exact key name used in `localStorage` so nothing gets lost.

**Lines 7–16:** `migrateItem(item)` — this is a **bouncer** at the club door. Each expense that comes out of storage gets checked: "Do you have a real ID? A real amount? A real category?" If the category is gibberish (not in the approved list), it gets bounced to `'Other'`. Every field gets coerced to the right type (`String()`, `Number()`, etc.). This prevents old or corrupted data from crashing the app.

**Lines 18–27:** `loadExpenses()` — the **shoebox-opening ceremony**:
1. Try to grab the string from `localStorage` using the key (line 20).
2. If nothing is there (`!raw`), return an empty array (line 21) — first time user, empty shoebox.
3. Parse the JSON string into a JavaScript array (line 22).
4. If it's not an array (corrupted data), return empty (line 23).
5. Run every item through the bouncer (`migrateItem`) (line 24).
6. If ANY of this fails (bad JSON, localStorage disabled), the `catch` silently returns an empty array (line 26). **Never crashes.**

**Lines 30–35:** `useExpenses()` — the **main control panel**:
- `useState<Expense[]>(loadExpenses)` — here's the magic trick: `loadExpenses` is passed as a **lazy initializer**, not called immediately with `()`. React calls it exactly once, on the very first render. That single function call reaches into `localStorage` and seeds the entire app with data. After that, `expenses` is a normal React state variable — a living, breathing array.

**Lines 32–34:** The `useEffect` — the **auto-save fairy**. Whenever `expenses` changes (a new expense is added), this effect runs and stuffs the entire array back into `localStorage` as JSON. No "Save" button needed.

**Lines 37–39:** `addExpense` — the **only way new data enters the system**. It uses the immutable-update pattern: `setExpenses(prev => [...prev, expense])`. Instead of pushing to the old array (which would mutate it), it **spreads** the old array into a brand-new one and adds the new expense at the end. The old array is thrown away, never touched.

### 🪣 The budget shoebox (`useBudget.ts`)

There's a second, smaller shoebox for budget settings. The pattern is identical:
- `loadBudget()` reads `'spender-dashboard-budget'` from `localStorage`
- Parses `daily` / `weekly` / `monthly` numbers (coerces to `Number`, defaults to `0`)
- `useState(loadBudget)` seeds it, `useEffect` auto-saves it

```
localStorage                  React State
─────────────                 ───────────
"spender-dashboard-expenses"  →  expenses  (useExpenses)
"spender-dashboard-budget"    →  budget    (useBudget)
```

**Two shoeboxes. Two hooks. Zero backend.**

---

## 2. 📊 How Charts Receive Their Data Without a Backend

### The "Lego Table" Metaphor

Imagine a table covered in Lego bricks (expenses). When you want to see how much you spent on Food this week, you don't ask a waiter in a back room to go check a database — you just **walk over to the table, pick up the bricks that match "this week" and "Food," and count them right there**. The charts work the same way: they receive pre-counted, pre-sorted data as **props** — like handing someone a finished Lego tower and saying "put this on the shelf."

**The file that connects everything:** `src/components/Dashboard.tsx`

```
  ┌───────────────────────────────────────────────────────┐
  │                    Dashboard.tsx                       │
  │                                                       │
  │  expenses ───→ calculateDailyTotals(expenses, period) │
  │       │               │                               │
  │       │               ▼                               │
  │       │         dailyTotals: DailyTotal[]              │
  │       │               │                               │
  │       │               └──────────→ <BarChart data={...}/>  │
  │       │                                                  │
  │       └──→ calculateCategoryTotals(expenses, period)     │
  │                       │                                  │
  │                       ▼                                  │
  │                 categoryTotals: CategoryTotal[]           │
  │                       │                                  │
  │                       └──────────→ <DonutChart data={...}/> │
  └───────────────────────────────────────────────────────┘
```

**Line-by-line walkthrough of the data stream:**

**Dashboard.tsx, lines 1–28:** Imports the hooks (`useExpenses`, `useBudget`) and every calculator function from `calculations.ts`. The calculators are **pure functions** — they take data in, return new data out, and never touch the world around them.

**Line 45:** `const { expenses, addExpense } = useExpenses();` — grab the expense array from the shoebox.

**Line 47:** `const [period, setPeriod] = useState<FilterPeriod>('this-week');` — the time filter. This is the **knob** that changes what the calculators see.

**Lines 56–66:** Every derived value is computed inline, during render:
```typescript
const totalSpend = calculateTotalSpend(expenses, period);
const dailyTotals = calculateDailyTotals(expenses, period);
const categoryTotals = calculateCategoryTotals(expenses, period);
```
Each of these is a **fresh computation** on every render. React is fast enough that this doesn't matter — we're talking about arrays with maybe hundreds of entries, not millions.

**Passing to charts (lines in the isPeriodView block or AnalyticsOnlyView):**
```typescript
<DonutChart data={categoryTotals} />
<BarChart data={dailyTotals} />
```

### 🍩 DonutChart.tsx — The "Pie Slicer"

**Lines 63–67:** The incoming `CategoryTotal[]` is **filtered** to remove zero-spend categories (`.filter(d => d.total > 0)`) and **mapped** to the shape Recharts needs (`{ name, value, color }`). The filtering happens right inside the component — no external prep needed.

**Lines 84–108:** The `recharts` library takes over:
- `<PieChart>` is the canvas
- `<Pie>` draws the donut (hollow because `innerRadius={60}`, `outerRadius={90}`)
- `<Cell>` colors each slice using a `<linearGradient>` defined in `<defs>`
- `<Tooltip>` shows a floating card with formatted currency on hover

**Data flow:** `calculateCategoryTotals()` in `calculations.ts` (lines 72–86) filters expenses by period, builds a `Map<Category, number>` by iterating once, then maps the 5 known categories to `CategoryTotal` objects with percentages calculated relative to the total. No mutations. No cache. Just math.

### 📊 BarChart.tsx — The "Stacking Blocks"

**Line 63:** Receives `DailyTotal[]` from `calculateDailyTotals()`.

**Lines 70–91:** Recharts' `<BarChart>` component:
- `<XAxis dataKey="label">` — uses the weekday abbreviation (Mon, Tue...)
- `<YAxis>` — shows dollar amounts
- `<Bar dataKey="amount">` — the bars themselves, with custom rounded rects
- `<ResponsiveContainer>` — makes it fill its parent and auto-resize

**Data flow:** `calculateDailyTotals()` in `calculations.ts` (lines 31–47) is the brain:
1. First calls `filterExpenses()` to get only relevant expenses
2. Builds a `Map<date, total>` by summing amounts per date
3. If `period === 'all-time'`, uses the actual dates present in the data (sorted); otherwise generates all 7 dates of the week (including days with $0 spending — that's how you see empty bars)
4. Maps each date to a `DailyTotal` with a human-readable weekday label

**Crucial detail:** The chart data array always has exactly 7 entries for weekly views, ensuring the Mon–Sun axis is always complete.

### 🎯 Why this works without a backend

There is **no API call**. There is **no database query**. There is **no network request**.

```
User adds expense → useExpenses.addExpense()
                         ↓
                 expenses[] updates (new array via spread)
                         ↓
                 React re-renders Dashboard.tsx
                         ↓
           All calculator functions run on the new expenses[]
                         ↓
           New dailyTotals / categoryTotals / metric values
                         ↓
           Charts receive new data as props
                         ↓
           Recharts re-draws with smooth animation
```

**Every step happens in the same JavaScript thread, in the same browser tab, in under 16 milliseconds.** This is the **unidirectional data flow** pattern: data flows *down* through props, never up. Expenses are the source of truth; everything else is a **derivation** — computed fresh each time, just like adding numbers on a piece of paper.

---

## 3. 🔄 How State Is Dynamically Derived by Time-Filter Without Mutation

### The "Kaleidoscope" Metaphor

Imagine you have a kaleidoscope with colored beads (expenses) inside a sealed tube. You twist the end (change the filter period), and the beads rearrange into a new pattern — but **you never take any beads out, you never glue them down, you never break the tube**. The original beads stay exactly as they were. You're just looking at them through a different lens.

**The filter mechanism lives in two places:**

### The Knob: `FilterTabs.tsx`

Three buttons (This Week / Last Week / All Time) that call `onChange(period)` when clicked.

In `Dashboard.tsx`:
```typescript
function handlePeriodChange(period: FilterPeriod) {
  setPeriod(period);    // ← This single state change triggers a full recalculation
  setIsPeriodView(true);
}
```

Changing `period` is like turning the kaleidoscope. Every derived value recalculates.

### The Lens: `calculations.ts`

**`filterExpenses()` (lines 24–29) — the gateway:**
```typescript
export function filterExpenses(expenses: Expense[], period: FilterPeriod): Expense[] {
  if (period === 'all-time') return expenses;    // ← No filter: return the original array
  const { start, end } = getWeekRange(period);
  const startStr = toISODate(start);
  const endStr = toISODate(end);
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
  //        ↑ .filter() creates a NEW array. The original expenses[] is never touched.
}
```

**`Array.prototype.filter()`** is the hero here. It creates a brand-new array with only the elements that pass the test. The original `expenses` array — the one sitting in React state — is **never mutated, never sorted, never reversed, never spliced**. It stays pristine forever.

**`getWeekRange()` (lines 12–22) — the calendar:**
```typescript
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}
```
This calculates the Monday of the current week. For "last week", it subtracts 7 more days. The result is a `{ start: Monday, end: Sunday }` range. Simple math, no dependencies.

### Every calculator follows the same pattern:

```
expenses[] (immutable source of truth)
     │
     ▼
filterExpenses(expenses, period) → filtered[] (new array, throwaway)
     │
     ▼
reduce / map / forEach over filtered[] → result (pure computation)
     │
     ▼
return result (used in JSX, passed as props)
```

Concrete example — **`calculateCategoryTotals()` (lines 62–86):**

1. `const filtered = filterExpenses(expenses, period)` — new filtered array
2. `const totalSpend = filtered.reduce(...)` — sum all amounts (1 iteration)
3. `const categoryMap = new Map()` — iterate again, group by category
4. `return categories.map(category => { ... })` — for each of the 5 categories, compute percentage against `totalSpend`
5. Returns a **fresh `CategoryTotal[]` array** every call

**`calculateDailyTotals()` (lines 31–55):**

1. `filterExpenses(...)` — get the right time window
2. `new Map<date, total>()` — aggregate by date
3. If `all-time`: use existing dates; if week: generate all 7 days (even zeros)
4. Map to `DailyTotal[]` with weekday labels
5. Return fresh array

**`calculateTotalSpend()` (lines 88–90):**

```typescript
export function calculateTotalSpend(expenses: Expense[], period: FilterPeriod): number {
  return filterExpenses(expenses, period).reduce((sum, e) => sum + e.amount, 0);
}
```
One-liner: filter, then sum. No storage, no cache, no mutation.

### 🧊 What NEVER happens:

❌ `expenses.sort(...)` — never sorts the original array in place  
❌ `expenses.push(...)` — never appends to the original array (uses spread in the hook)  
❌ `delete expenses[i]` — never removes from the original array  
❌ `expenses[0].amount = 50` — never modifies an expense object in place  
❌ Global variables or caches — no Redux, no Zustand, no Context for expenses  

### ✅ What ALWAYS happens:

✅ `expenses` is read-only in every component  
✅ `filter()` / `map()` / `reduce()` create new arrays/values  
✅ `useState` setter replaces the entire array with a new one  
✅ Every render recalculates everything from scratch  

### Why this is safe:

Since `expenses` is never mutated, React's re-render guarantees are simple: the reference changes only when `addExpense` runs. When `period` changes, `expenses` stays the same reference, but all the calculators produce new results because their `period` input changed. React efficiently diffs the virtual DOM and only updates the parts of the UI that actually changed (e.g., just the metric card numbers, or just the chart bars).

---

## 🏗️ The Big Picture: Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        index.html                            │
│                  <script src="main.tsx">                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                                │
│                     <Dashboard />                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                     Dashboard.tsx                             │
│                                                               │
│  ┌─────────────┐    ┌────────────────────────────────────┐   │
│  │ useExpenses │───→│ expenses (immutable source array)  │   │
│  └─────────────┘    └──────────┬─────────────────────────┘   │
│                                │                              │
│  ┌─────────────┐    period ────┤                              │
│  │ useBudget   │               │                              │
│  └─────────────┘               ▼                              │
│                     ┌─────────────────────┐                   │
│                     │ calculators.ts      │                   │
│                     │ filterExpenses()    │                   │
│                     │ calculateDaily...() │                   │
│                     │ calculateCategory() │                   │
│                     │ calculateTotal...() │                   │
│                     └────────┬────────────┘                   │
│                              │                                │
│   ┌──────────┬───────────────┼───────────────┬───────────┐   │
│   ▼          ▼               ▼               ▼           ▼   │
│ ┌──────┐ ┌────────┐ ┌─────────────┐ ┌────────────┐ ┌─────┐  │
│ │Metric│ │ Budget │ │ ExpenseLog  │ │ DonutChart │ │ Bar │  │
│ │Cards │ │ Tracker│ │ View        │ │            │ │Chart│  │
│ └──────┘ └────────┘ └─────────────┘ └────────────┘ └─────┘  │
│       (all receive props, no side effects)                   │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                     localStorage                             │
│  "spender-dashboard-expenses" ↔ JSON.stringify(expenses)    │
│  "spender-dashboard-budget"   ↔ JSON.stringify(budget)      │
└──────────────────────────────────────────────────────────────┘
```

**The golden rule of this architecture:** *Every piece of derived data is computed on the spot, from scratch, using only `expenses` and `period`. Nothing is ever saved, cached, or duplicated. The source array is never touched.*

This is the **single source of truth** pattern, and it's why the dashboard can run entirely in your browser with zero backend: the data set is small enough that recomputing everything on every render is instant, and the code is simple enough that there are no hidden state bugs.
