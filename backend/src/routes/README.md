# routes/

Route definitions. Wires HTTP methods + paths to controller handlers. Handles middleware composition per route.

## Pattern

```ts
const router = express.Router()
const service = new FooService()
const controller = new FooController(service)

router.post("/", validate(fooSchema), controller.create)
router.get("/:id", requireAuth, controller.getById)

export default router
```

## Files

| File            | Mounted At  | Endpoints      |
| --------------- | ----------- | -------------- |
| `auth.route.ts` | `/api/auth` | `POST /signup` |

## auth.route.ts — Current vs Planned

```
Current:
  POST /api/auth/signup       ← wired, service stub

Planned:
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh
```

## Issues

- `validate()` middleware not yet called on `/signup` — raw body hits controller
- No `requireAuth` middleware applied anywhere (needs to exist first)

## Missing

- Login, logout, refresh routes
- Validation middleware on each mutation route
- Route-level rate limiting on auth endpoints
