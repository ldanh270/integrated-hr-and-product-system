import type { SubsystemConfig, SubsystemId } from "../config/subsystem"

interface SubsystemState {
  activeSubsystem: SubsystemId
  setActiveSubsystem: (id: SubsystemId) => void
  getActiveSubsystemConfig: () => SubsystemConfig | undefined
}
export declare const useSubsystemStore: import("zustand").UseBoundStore<
  import("zustand").StoreApi<SubsystemState>
>
export {}
