# Security Specification & Test Protocol

## 1. Data Invariants
1. **Product Document Identity**: Every product document stored at `/products/{productId}` must have a non-empty string `id` bounded to 128 characters, matching the document path key.
2. **Catalog Integrity**: Physical products must declare a string `name` (1-200 chars), numeric non-negative `retailPrice`, integer non-negative `stock`, non-empty `sku`, and non-empty `barcode`.
3. **Commercial Services Isolation**: Services at `/services/{serviceId}` do not track inventory stock and require numeric non-negative `price` and string `name`.
4. **Sales Immutability**: Recorded sales transactions at `/sales/{saleId}` are immutable audits; total and timestamp are mandatory.
5. **Path Hardening**: All collection IDs must conform to `^[a-zA-Z0-9_\-]+$` and never exceed 128 characters to prevent path pollution and resource exhaustion.
6. **Denial of Wallet Defense**: Array limits and field size constraints are strictly enforced across all operations.

## 2. The "Dirty Dozen" Threat Payloads
1. **Oversized ID Injection**: Document ID with 2KB junk characters attempting Denial of Wallet.
2. **Negative Price Exploit**: Product payload with `retailPrice: -500` attempting revenue subversion.
3. **Negative Inventory Underflow**: Stock adjustment setting `stock: -9999` bypassing non-negative checks.
4. **Missing Required Key**: Product missing required `name` or `barcode` payload.
5. **Type Confusion Attack**: String passed into numeric `retailPrice: "FREE"`.
6. **Service Inventory Poisoning**: Service item attempting to inject unmonitored physical stock fields.
7. **Phantom Document ID Mismatch**: Payload `id` differs from Firestore path variable `{productId}`.
8. **Malicious Script Injection**: XSS payload injected into `description` or `name` field exceeding max character thresholds.
9. **Settings Overwrite By Unauthenticated Actor**: Malicious actor rewriting global store currency and tax configuration without auth.
10. **Sales Record Null Total**: Sale logged with undefined `total` or corrupted items array.
11. **Excessive Field Injection**: Shadow fields injected into product documents beyond schema.
12. **Recursive Batch Exploit**: Massive nested structure payload targeting memory consumption.

## 3. Security Rule Verification
All paths are guarded by `isValidId()` boundary checks and strict schema field validations.
Rules deployed and verified via `DeployRules` RPC.
