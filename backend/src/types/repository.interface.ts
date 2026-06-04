/**
 * Generic Base Repository Interface
 * Defines standard CRUD operations for decoupling database access from business logic.
 * Follows SOLID (Dependency Inversion & Interface Segregation).
 */
export interface IBaseRepository<TDomain> {
  /**
   * Finds a record by its unique ID.
   * @param id The unique identifier of the record.
   */
  findById(id: string): Promise<TDomain | null>

  /**
   * Finds a single record matching the query filter.
   * @param filter The query filter object.
   */
  findOne(filter: Record<string, any>): Promise<TDomain | null>

  /**
   * Retrieves all records matching the query filter.
   * @param filter The query filter object (defaults to empty object to fetch all).
   */
  findAll(filter?: Record<string, any>): Promise<TDomain[]>

  /**
   * Creates a new record in the database.
   * @param data The data payload to create the record.
   */
  create(data: any): Promise<TDomain>

  /**
   * Updates an existing record by ID.
   * @param id The unique identifier of the record to update.
   * @param data The partial data payload containing updates.
   */
  update(id: string, data: any): Promise<TDomain | null>

  /**
   * Deletes a record by ID.
   * @param id The unique identifier of the record to delete.
   * @returns A promise resolving to true if deleted, false otherwise.
   */
  delete(id: string): Promise<boolean>
}
