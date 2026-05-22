# repositories/

Data access layer. All DB queries live here. No business logic, no HTTP concerns.

## Pattern

```ts
export class FooRepository {
  async findById(id: string): Promise<Foo | null> {
    // raw SQL or ORM query
    // return typed result or null
  }
}
```

## Files

| File                 | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `auth.repository.ts` | User lookup + insert for auth flows — **currently empty** |

## Missing

All methods in `auth.repository.ts`:

```ts
export class AuthRepository {
  async findByEmail(email: string): Promise<User | null>
  async createUser(data: CreateUserDto): Promise<User>
  async saveRefreshToken(userId: string, token: string): Promise<void>
  async revokeRefreshToken(token: string): Promise<void>
}
```

Also missing:

- DB client import (needs `lib/database.ts` to export pool/client after driver added)
- `IAuthRepository` interface for DI (per CLAUDE.md §2-D)
- Parameterized queries — never string interpolation in SQL
