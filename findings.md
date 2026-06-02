# Findings & Decisions

## Requirements

- Review backend code.
- Centralize the repository through a base class to extend based on SOLID.
- Create plan first, then implement.

## Research Findings

- The backend uses Mongoose for repositories.
- `MongoEmployeeRepository` and `MongoWorkingShiftRepository` share common methods like `create`, `update`, `findById`, etc.
- A `BaseRepository<T>` can abstract these common Mongoose operations.

## Technical Decisions

| Decision                           | Rationale                                               |
| ---------------------------------- | ------------------------------------------------------- |
| `IBaseRepository<T>` interface     | To ensure loosely coupled design (Dependency Inversion) |
| `BaseRepository<T>` abstract class | To share Mongoose `Model<T>` implementations            |

## Visual/Browser Findings

- N/A
