import { IBaseRepository } from "@/types"

import { Model } from "mongoose"

/**
 * Abstract Base Repository Class implementing common Mongoose database operations.
 * Decouples Mongoose specific details from services and provides type safety.
 *
 * @template TDb The database document schema type (Mongoose schema/document)
 * @template TDomain The domain entity schema type returned to the services (defaults to TDb)
 */
export abstract class BaseRepository<TDb, TDomain = TDb> implements IBaseRepository<TDomain> {
  /**
   * @param model Mongoose model injected via constructor injection (SOLID)
   */
  constructor(protected model: Model<TDb>) {}

  /**
   * Optional mapper to convert database document models to domain entity models.
   * Override this method in child repositories if you need to reshape database models (e.g. mapping _id to id).
   */
  protected mapToDomain(doc: TDb): TDomain {
    return doc as unknown as TDomain
  }

  /**
   * Find a record by its database ID
   * Defaults to returning plain JS object (lean = true) for speed
   */
  async findById(id: string, lean = true): Promise<TDomain | null> {
    const query = this.model.findById(id)
    const doc = await (lean ? query.lean<TDb>() : query)
    if (!doc) return null
    return this.mapToDomain(doc as unknown as TDb)
  }

  /**
   * Find a single record using query filter
   */
  async findOne(filter: Record<string, any>, lean = true): Promise<TDomain | null> {
    const query = this.model.findOne(filter)
    const doc = await (lean ? query.lean<TDb>() : query)
    if (!doc) return null
    return this.mapToDomain(doc as unknown as TDb)
  }

  /**
   * Find all records using query filter
   */
  async findAll(filter: Record<string, any> = {}, lean = true): Promise<TDomain[]> {
    const query = this.model.find(filter)
    const docs = await (lean ? query.lean<TDb[]>() : query)
    return (docs as TDb[]).map((doc) => this.mapToDomain(doc))
  }

  /**
   * Save a new document to the database
   */
  async create(data: any): Promise<TDomain> {
    const created = new this.model(data)
    const saved = await created.save()
    return this.mapToDomain(saved.toObject() as TDb)
  }

  /**
   * Update a document by its database ID
   */
  async update(id: string, data: any, lean = true): Promise<TDomain | null> {
    const query = this.model.findByIdAndUpdate(id, { $set: data }, { new: true })
    const updated = await (lean ? query.lean<TDb>() : query)
    if (!updated) return null
    return this.mapToDomain(updated as unknown as TDb)
  }

  /**
   * Remove a document by its database ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id })
    return result.deletedCount > 0
  }
}
