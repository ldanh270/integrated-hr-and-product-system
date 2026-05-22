# services/

Business logic layer. Orchestrates repository calls, enforces rules, throws typed errors.

## Pattern

```ts
export class FooService {
  constructor(private repo: IFooRepository) {}

  async create(data: CreateFooDto): Promise<Foo> {
    const existing = await this.repo.findByX(data.x)
    if (existing) throw new AppError("Already exists", HttpStatusCode.CONFLICT, "FooService")

    return this.repo.create(data)
  }
}
```

## Files

| File              | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `auth.service.ts` | Signup, login, token management — **`signup()` is empty stub** |

## auth.service.ts — Missing Implementation

```ts
export class AuthService {
  async signup(data: SignupDto): Promise<User> {
    // 1. check email not taken (repo.findByEmail)
    // 2. hash password (bcrypt)
    // 3. insert user (repo.createUser)
    // 4. return user (without password hash)
  }

  async login(data: LoginDto): Promise<{ accessToken: string }> {
    // 1. find user by email
    // 2. compare password (bcrypt.compare)
    // 3. sign access token (jwt, 15m)
    // 4. sign refresh token (jwt, 7d) — store in DB, set cookie
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> { ... }

  async logout(refreshToken: string): Promise<void> { ... }
}
```

## Required Dependencies (not yet installed)

```bash
bun add jsonwebtoken bcryptjs
bun add -d @types/jsonwebtoken @types/bcryptjs
```
