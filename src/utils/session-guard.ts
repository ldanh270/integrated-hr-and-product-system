import { sessionManager } from '../session/session.manager.js';
import { SessionData } from '../types/session.types.js';

export class UnauthorizedError extends Error {
  constructor(message: string = 'Invalid or expired session. Please login again.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Get and validate the session. Throws an error if invalid.
 */
export const requireSession = (sessionId: string): SessionData => {
  const session = sessionManager.get(sessionId);
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
};

/**
 * Check if the user has one of the required roles
 */
export const requireRole = (session: SessionData, allowedRoles: string[]) => {
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(`Required roles: ${allowedRoles.join(', ')}. Current role: ${session.role}`);
  }
};
