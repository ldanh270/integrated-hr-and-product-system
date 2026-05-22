# configs/

Static configuration and constants. All magic values live here — nothing in handlers.

## Structure

```
configs/
├── database.config.ts      # DB connection parameters (stub — populate when driver added)
└── constant/
    ├── auth.config.ts      # JWT secrets and token TTLs
    ├── http.config.ts      # HttpStatusCode const object + HttpStatusCodeType
    └── regex.config.ts     # ⚠️ DUPLICATE of auth.config.ts — needs cleanup
```

## Usage

```ts
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from "@/config/constant/auth.config.ts"
import { HttpStatusCode } from "@/config/constant/http.config.ts"

res.status(HttpStatusCode.CREATED).json(...)
```

## Missing

- `env.ts` — typed `process.env` wrapper with startup validation (fail fast if required vars missing)
- `routes.ts` — route name → path map (prevent hardcoded strings in tests/clients)
