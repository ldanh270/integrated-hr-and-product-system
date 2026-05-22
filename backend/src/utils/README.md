# utils/

Pure helper functions and shared utilities. No side effects, no HTTP, no DB.

## Files

| File            | Export     | Purpose                       |
| --------------- | ---------- | ----------------------------- |
| `error.util.ts` | `AppError` | Typed application error class |

## AppError

```ts
throw new AppError("User not found", 404, "AuthRepository")
// → caught by globalErrorHandler
// → returns { message: "User not found" } with status 404
// → logs: [ERROR - AuthRepository] : User not found
```

Constructor: `(message: string, statusCode: number, layer?: string)`

Layer values used by convention:

- `"Validation"` — input shape errors
- `"AuthService"` — auth business rule violations
- `"Database"` — repository / query failures
- `"Unknown"` — default fallback

## Missing

```
util/
├── error.util.ts       ✅ exists
├── jwt.util.ts         ❌ sign/verify token helpers
├── hash.util.ts        ❌ bcrypt wrap (hashPassword, comparePassword)
└── pagination.util.ts  ❌ page/limit → offset calc for list endpoints
```
