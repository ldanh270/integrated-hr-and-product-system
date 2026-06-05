import { SeedContext } from "./seed-context.ts"

export interface ISeeder {
  readonly name: string
  readonly order: number
  run(context: SeedContext): Promise<Partial<SeedContext>>
}
