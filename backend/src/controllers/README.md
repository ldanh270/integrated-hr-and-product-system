# controllers/

HTTP layer only. Receives request, delegates to service, returns response. No business logic here.

## Pattern

```ts
export class FooController {
  constructor(private service: FooService) {}

  create = async (req: Request, res: Response) => {
    // 1. [MISSING] validate req.body via Zod schema
    // 2. call service
    const result = await this.service.create(req.body)
    // 3. respond
    res.status(HttpStatusCode.CREATED).json({ data: result })
  }
}
```

## Files

| File                 | Endpoints                                 |
| -------------------- | ----------------------------------------- |
| `auth.controller.ts` | `signup` (stub — service not implemented) |

## Issues

- `req` and `res` typed as `any` — replace with `Request<P, ResBody, ReqBody>` generics
- No input validation — add `validate(schema)` middleware before each handler
- Error catching uses raw `.message` — throw `AppError` from service instead

## Missing

- `login`, `logout`, `refresh` handlers
- Typed request bodies (move to `types/`)
