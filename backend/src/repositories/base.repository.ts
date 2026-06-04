import { PrismaClient } from "@prisma/client"

/**
 * Abstract Base Repository Class for Prisma.
 * Because Prisma's delegates (e.g. prisma.user) do not share a generic base class interface
 * like Mongoose's Model<T>, we cannot implement generic CRUD methods here easily without
 * sacrificing type safety.
 * Therefore, this class simply provides access to the PrismaClient instance to subclasses.
 */
export abstract class BaseRepository {
  /**
   * @param prisma PrismaClient injected via constructor injection (SOLID)
   */
  constructor(protected readonly prisma: PrismaClient) {}
}
