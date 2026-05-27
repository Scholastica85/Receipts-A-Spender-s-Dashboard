# Lie Detector: Codebase Knowledge Verification

## Test Overview

This document presents five statements about the Spender's Dashboard codebase. Each statement describes a specific behavior in the data layer, component validation logic, or initialization flow. Four statements are factually correct and can be verified against the source code. One statement is intentionally false. The purpose of this test is to assess precision in reading and reasoning about the application's runtime contracts, type boundaries, and validation guarantees.

## The Five Statements

1. The `getWeekRange` function treats Sunday as day six of the previous week, computing the Monday of the current week by subtracting the result of `(day + 6) % 7` from the current date, which guarantees that every week range starts on Monday and ends on Sunday.

2. In `calculateCategoryTotals`, each category's percentage is derived by dividing that category's filtered total by the sum of all filtered expenses, which ensures that when at least one expense exists the five percentage values sum to exactly one hundred.

3. The `ExpenseForm` component validates that submitted dates conform to the YYYY-MM-DD format by testing against a regular expression that also rejects any value where the month portion exceeds twelve or the day portion exceeds thirty-one, preventing semantically invalid calendar dates from entering the expense list.

4. The `calculateAverageSpend` function checks whether the filtered expense count is zero before performing division, returning zero instead of allowing a divide-by-zero operation to produce NaN.

5. When `loadExpenses` encounters an empty localStorage key, a non-array parsed value, a zero-length array, or any exception during retrieval or parsing, it returns a copy of the fifty-element `DEFAULT_EXPENSES` array processed through the `migrateItem` validation layer.


# 🕵️‍♂️ The Lie Prediction (Scholastica's Test Run)

**Project:** Receipts: A Spender's Dashboard  
**Testing Phase:** Stage 7 Codebase Knowledge Verification  
**Target File:** docs/06-lie-detector.md  

---

## My predicted Lie and why

After a detailed code review of the application architecture, I have identified **Statement 3** as the absolute, intentional lie. 

The statement claims that our codebase validation layer utilizes a regular expression that actively intercepts and blocks semantically invalid calendar dates, explicitly pointing out that it rejects months greater than twelve or days greater than thirty-one. This is factually incorrect based on the core architecture of the codebase.

## Technical Evidence from the Codebase

Looking directly inside the source file `src/hooks/useExpenses.ts`, the validation tracker is hardcoded as a strict digit-length evaluation pattern:

```typescript
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

```

This specific regular expression only enforces a structural layout constraint. It ensures that the input string matches a sequence of four digits, followed by a hyphen, two digits, another hyphen, and two final digits. It possesses absolutely no semantic awareness of calendar limits.

If a user or an external script bypasses the native HTML date picker and submits a raw string value reading twenty-twenty-six ninety-nine eighty-eight, this regular expression will evaluate it as completely true. The system relies entirely on native browser element configurations rather than the regex to keep the calendar dates reasonable, proving Statement 3 to be a total fabrication.

## AI Reveal

### Human Choice Analysis

Your guess was correct. Statement 3 is the deliberate lie embedded in the set of five. Your reasoning mapped directly onto the source-level reality: the regex pattern operates exclusively on structural shape and has zero awareness of calendar semantics.

### The Definitive Reveal

Statement 3 was the absolute lie. The exact text claimed that the regular expression rejects values where the month exceeds twelve or the day exceeds thirty-one. That is false. The actual regex, declared at `src/hooks/useExpenses.ts` line 7, reads as follows:

```
/^\d{4}-\d{2}-\d{2}$/
```

This pattern enforces exactly four constraints: exactly four digits, a hyphen, exactly two digits, a hyphen, exactly two digits, and end of string. It will happily accept 2026-13-01, 2026-00-99, and 2026-99-88. No semantic calendar validation exists anywhere in the data layer. The expense form at `src/components/ExpenseForm.tsx` does run this same regex in its submit handler at line 38, but only to reject values that fail the pattern entirely. Values that match the pattern but contain impossible months or days sail through without objection. The system has no secondary numeric range check.

### Truth Verification

The remaining four statements are factually correct, backed by the following source evidence.

**Statement 1** (getWeekRange Monday-start guarantee): The `getMonday` function at `src/utils/calculations.ts` lines 12 through 18 computes `(day + 6) % 7` to produce a zero-based Monday offset. For Sunday where getDay returns zero, the result is six, and subtracting six days rolls back to the preceding Monday. For Monday where getDay returns one, the result is zero and the date stays unchanged. The `getWeekRange` function at lines 20 through 32 then creates the Sunday boundary by adding six days to the Monday result. Every generated range is therefore Monday through Sunday inclusive.

**Statement 2** (percentage sum to one hundred): Inside `calculateCategoryTotals` at lines 83 through 103, each category's percentage is `(catTotal / totalSpend) * 100`. Summing the five percentages produces `(sum of all five catTotal values / totalSpend) * 100`. Since `sum of all five catTotal values` is exactly `totalSpend` by construction, the fraction reduces to 1, and multiplied by 100 yields exactly 100. This holds whenever at least one filtered expense exists and totalSpend is therefore greater than zero.

**Statement 4** (zero-division guard in average): The `calculateAverageSpend` function at lines 113 through 119 checks `if (count === 0) return 0` before it ever reaches the division operator. No division by zero occurs at any code path. A zero-expense period returns zero rather than NaN.

**Statement 5** (default expenses on all failure paths): The `loadExpenses` function at `src/hooks/useExpenses.ts` lines 88 through 98 returns the result of `loadDefault` under every failure condition. When localStorage returns null or an empty string the `!raw` guard triggers it. When JSON.parse produces a non-array the type check triggers it. When the parsed array has length zero the empty-array check triggers it. When any exception propagates from getItem, parse, or the mapping loop, the catch block triggers it. The `loadDefault` helper at lines 84 through 86 passes every element of the fifty-item `DEFAULT_EXPENSES` array through `migrateItem`, so the data is structurally validated on the same codepath used for all other storage reads. No scenario exists where an empty localStorage produces an empty expense list on initial load.