## Refactoring Execution

- Created `IBaseRepository<T>` interface and `BaseRepository<T>` base class.
- Refactored `MongoWorkingShiftRepository`, `MongoEmployeeRepository`, `MongoAttendanceRepository`, `MongoAuthRepository`, `MongoApplicationRepository`, `MongoEmployeeShiftRepository`, `MongoHolidayRepository`, `MongoProfileRepository`, and `MongoShiftScheduleRepository` to extend `BaseRepository`.
- Launched `bun x tsc` to verify TypeScript compile success.
- TypeScript compiled successfully with exit code 0.
- Completed all phases of the plan.
