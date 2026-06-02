# Findings

## Research Context

- The user wants to refactor the frontend codebase to strictly adhere to the custom hook separation pattern shown in `VirtualScanner.tsx` and `useVirtualScanner.ts`.
- The pattern ensures that UI components are purely presentational and use custom hooks (e.g. `useVirtualScanner`, `useEmployeeMaster`, `useProfileMaster`) for state management, API interactions, and business logic.
- The project follows SOLID principles, specifically Single Responsibility Principle and Clean Architecture layer isolation.
- Identified pages to refactor: `Dashboard.tsx`, `ViewEmployee.tsx`, and modules like `application`, `asset`, `payroll`, `recruitment`, `training`, `security`, `settings`.

## Important Links / Documentation

- [VirtualScanner Component](file:///c:/Users/ducan/Personal/Code/university/SU26/swp391/integrated-hr-and-product-system/frontend/src/components/features/attendance/VirtualScanner.tsx)
- [useVirtualScanner Hook](file:///c:/Users/ducan/Personal/Code/university/SU26/swp391/integrated-hr-and-product-system/frontend/src/hooks/attendance/useVirtualScanner.ts)
