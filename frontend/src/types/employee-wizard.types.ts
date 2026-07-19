export interface IEducationItem {
  id: string
  fromMonthYear: string
  toMonthYear: string
  degree: string
  trainingType: string
  major: string
  school: string
}

export interface IExperienceItem {
  id: string
  fromMonthYear: string
  toMonthYear: string
  company: string
  position: string
  description: string
}

export interface IFamilyMemberItem {
  id: string
  nationalId: string
  gender: string
  dateOfBirth: string
  nationality: string
  ethnicity: string
  relationship: string
  birthAddress: string
  isDependent: boolean
}

export interface IEmployeeWizardFormData {
  // Tab 1: Sơ yếu lý lịch
  fullName: string
  gender: string
  dateOfBirth: string
  placeOfBirth: string
  nationality: string
  ethnicity: string
  religion: string
  nationalId: string
  idIssueDate: string
  idIssuePlace: string
  permanentAddress: string
  province: string
  district: string
  maritalStatus: string
  idFrontUrl?: string
  idBackUrl?: string

  // Liên hệ
  phone: string
  email: string
  currentAddress: string
  currentProvince: string
  currentDistrict: string

  // Học vấn & Kinh nghiệm
  educations: IEducationItem[]
  experiences: IExperienceItem[]

  // Tab 2: Công việc
  employeeCode: string
  workLocation: string
  department: string
  positionId: string
  startDate: string
  workScheduleType: string
  managerId: string

  // Tài khoản
  username: string
  password?: string
  role: string
  autoGenUsername: boolean
  autoGenPassword: boolean

  // Tab 3: Thành viên gia đình
  familyCode: string
  headFullName: string
  headPhone: string
  headNationalId: string
  householdAddress: string
  householdProvince: string
  householdDistrict: string
  familyMembers: IFamilyMemberItem[]
}

export type WizardTab = "bio" | "job" | "family"
