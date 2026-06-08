import { ISeeder } from "./seeder.interface.ts"

class SeederRegistry {
  private seeders: ISeeder[] = []

  register(seeder: ISeeder): void {
    this.seeders.push(seeder)
  }

  getSorted(): ISeeder[] {
    return [...this.seeders].sort((a, b) => a.order - b.order)
  }
}

export const registry = new SeederRegistry()
