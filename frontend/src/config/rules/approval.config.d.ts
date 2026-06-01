export declare const APPROVAL_CONFIG: {
  readonly application: {
    readonly roles: readonly ["admin", "general_manager", "hr_manager", "team_leader"]
  }
  readonly password_reset: {
    readonly roles: readonly ["admin", "general_manager"]
  }
  readonly recruitment_proposal: {
    readonly roles: readonly ["admin", "general_manager", "hr_manager"]
  }
}
export declare const APPROVAL_CATEGORIES: readonly [
  "application",
  "password_reset",
  "recruitment_proposal",
]
export declare const APPROVAL_CATEGORY: {
  readonly APPLICATION: "application"
  readonly PASSWORD_RESET: "password_reset"
  readonly RECRUITMENT_PROPOSAL: "recruitment_proposal"
}
