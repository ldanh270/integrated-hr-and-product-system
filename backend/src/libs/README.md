# libs/

Shared singleton resources. Initialized once at startup, imported everywhere.

## Files

| File          | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `database.ts` | `connectDB()` — establishes DB connection before server starts |

## database.ts

```ts
const connectDB = async () => {
  // TODO: initialize real driver here
  // e.g. pg Pool, mysql2 createPool, Prisma client.$connect()
}
export { connectDB }
```

Called in `index.ts`:

```ts
connectDB().then(() => app.listen(PORT, ...))
```

Server does NOT start if `connectDB()` rejects — `process.exit(1)` on failure.

## Missing

- Actual DB driver instantiation (`pg.Pool`, `mysql2`, etc.)
- Export of the DB client/pool instance for use in repositories
- Connection pool config (min/max connections, idle timeout)
