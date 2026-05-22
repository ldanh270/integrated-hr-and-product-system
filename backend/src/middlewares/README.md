# middlewares/

Express middleware. Runs before route handlers or as global error catcher.

## Files

| File                  | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `error.middleware.ts` | `globalErrorHandler` — catches `AppError` and unknown errors |

## globalErrorHandler

```ts
app.use(globalErrorHandler) // must be LAST app.use() call
```

Behavior:

- `instanceof AppError` → logs `[ERROR - {layer}]`, returns `{ message }` with correct status
- Unknown error → logs `[UNHANDLED CRASH]`, returns 500

> ⚠️ Currently NOT registered in `index.ts`. A raw inline handler is used instead. Fix: remove inline handler, add `app.use(globalErrorHandler)`.

## Missing

```
middleware/
├── auth.middleware.ts      # verifyToken — JWT guard for protected routes
├── validate.middleware.ts  # validate(schema: ZodSchema) — input validation
└── cors.middleware.ts      # CORS headers config for frontend dev
```

### auth.middleware.ts (needed)

```ts
export const requireAuth = (req, res, next) => {
  // verify access token from Authorization header
  // attach decoded user to req.user
  // throw AppError(401) if invalid
}
```

### validate.middleware.ts (needed)

```ts
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) throw new AppError(result.error.message, 422, "Validation")
  req.body = result.data
  next()
}
```
