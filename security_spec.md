# Security Specification - Vigilant Trader Journal

## 1. Data Invariants
- A `TradeReview` cannot exist without a valid `Trade` (referenced by `tradeId`).
- A user can only read/write their own data (`users/{userId}/**` where `userId == request.auth.uid`).
- Fields like `id` and `date` should be immutable once created where applicable.
- `RiskSettings` must contain valid numbers for limits (non-negative).
- `Premarket` checklist size must match the hardcoded `PREMARKET_ITEMS` length.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Attempt to write a trade to another user's path.
   - `path`: `/users/ATTACKER_ID/trades/trade123`
   - `auth`: `request.auth.uid == VICTIM_ID`
   - Result: `PERMISSION_DENIED`

2. **Shadow Field Injection**: Attempt to inject an `isAdmin` field into a user profile.
   - `path`: `/users/USER123/profile/main`
   - `data`: `{ "name": "Evil", "isAdmin": true }`
   - Result: `PERMISSION_DENIED` (Validation helper checks exact keys/schema).

3. **Orphaned Review**: Create a `TradeReview` for a `tradeId` that doesn't exist.
   - `path`: `/users/USER123/tradeReviews/rev1`
   - `data`: `{ "tradeId": "NON_EXISTENT_TRADE", ... }`
   - Result: `PERMISSION_DENIED` (exists() check in rule).

4. **Resource Poisoning (ID Large)**: Use a 2MB string as a document ID.
   - `path`: `/users/USER123/trades/` + "A" * 2,000,000
   - Result: `PERMISSION_DENIED` (isValidId size check).

5. **Resource Poisoning (Field Large)**: Write a 1MB string into a `symbol` field.
   - `data`: `{ "symbol": "A" * 1,000,000, ... }`
   - Result: `PERMISSION_DENIED` (String size limit in validator).

6. **State Shortcut**: Update a `Trade` to have a `pnl` of $1,000,000 bypassing actual logic.
   - Result: `PERMISSION_DENIED` (If update rules are tiered).

7. **Immortal Field Overwrite**: Attempt to change the `date` of an existing `Trade`.
   - Result: `PERMISSION_DENIED` (`incoming().date == existing().date`).

8. **Unverified Auth**: Write data as a user with `email_verified == false`.
   - Result: `PERMISSION_DENIED`.

9. **Negative Risk**: Set `dailyLimit` to `-5000`.
   - Result: `PERMISSION_DENIED` (Value range check).

10. **Array Explosion**: Inject 10,000 elements into `followedRules`.
    - Result: `PERMISSION_DENIED` (Array size limit).

11. **PII Leak**: Read `/users/USER_A/profile/main` as `USER_B`.
    - Result: `PERMISSION_DENIED`.

12. **Cross-Collection Poisoning**: Set `tradeId` in a review to the ID of a `Mission` document (from another app).
    - Result: `PERMISSION_DENIED` (Path-specific exists check).

## 3. Test Runner Strategy
We will implement a `firestore.rules.test.ts` (conceptual or actual if environment supports) using the Firebase Emulator / local tests to verify these. Since I am an AI agent, I will ensure the `firestore.rules` logic explicitly blocks these cases.
