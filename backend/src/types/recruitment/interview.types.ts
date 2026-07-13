import { InterviewRound, InterviewScorecard, InterviewFormat, InterviewStatus, InterviewResult, InterviewRoundMember, InterviewRoundCandidate } from "@prisma/client";

export interface IInterviewRoundRepository {
  create(data: CreateInterviewRoundDTO): Promise<InterviewRound>;
  findById(id: string): Promise<InterviewRound | null>;
  findByRequisitionId(requisitionId: string): Promise<InterviewRound[]>;
  update(id: string, data: UpdateInterviewRoundDTO): Promise<InterviewRound>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: InterviewStatus): Promise<InterviewRound>;
  addInterviewer(roundId: string, employeeId: string): Promise<InterviewRoundMember>;
  addCandidate(roundId: string, applicationId: string): Promise<InterviewRoundCandidate>;
  getInterviewers(roundId: string): Promise<InterviewRoundMember[]>;
  getCandidates(roundId: string): Promise<InterviewRoundCandidate[]>;
}

export interface IInterviewScorecardRepository {
  upsert(data: SubmitScorecardDTO & { interviewerId: string }): Promise<InterviewScorecard>;
  findByRoundId(roundId: string): Promise<InterviewScorecard[]>;
  findByApplicationAndRound(applicationId: string, roundId: string): Promise<InterviewScorecard[]>;
}

export interface IInterviewService {
  scheduleRound(requisitionId: string, data: CreateInterviewRoundDTO, interviewerIds: string[], applicationIds: string[]): Promise<InterviewRound>;
  updateRound(id: string, data: UpdateInterviewRoundDTO): Promise<InterviewRound>;
  deleteRound(id: string): Promise<void>;
  getRoundById(id: string): Promise<InterviewRound | null>;
  submitScorecard(interviewerId: string, data: SubmitScorecardDTO): Promise<InterviewScorecard>;
  addCandidateToRound(roundId: string, applicationId: string): Promise<InterviewRoundCandidate>;
}

export type CreateInterviewRoundDTO = {
  requisitionId: string;
  roundNumber: number;
  title: string;
  leadInterviewerId: string;
  format?: InterviewFormat;
  scheduledAt?: Date;
};

export type UpdateInterviewRoundDTO = {
  title?: string;
  format?: InterviewFormat;
  status?: InterviewStatus;
  scheduledAt?: Date;
  leadInterviewerId?: string;
};

export type SubmitScorecardDTO = {
  roundId: string;
  applicationId: string;
  scores?: Record<string, unknown>; // JSON structure based on role
  verdict: InterviewResult;
  note?: string;
};
