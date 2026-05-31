import { create } from "zustand"
import { SUBSYSTEMS } from "@/config/subsystem"
import type { SubsystemId, SubsystemConfig } from "@/config/subsystem"

interface SubsystemState {
  activeSubsystem: SubsystemId
  setActiveSubsystem: (id: SubsystemId) => void
  getActiveSubsystemConfig: () => SubsystemConfig | undefined
}

export const useSubsystemStore = create<SubsystemState>((set, get) => ({
  activeSubsystem: "hrm", // Default to hrm
  
  setActiveSubsystem: (id) => set({ activeSubsystem: id }),
  
  getActiveSubsystemConfig: () => {
    const { activeSubsystem } = get()
    return SUBSYSTEMS.find((s) => s.id === activeSubsystem)
  }
}))
