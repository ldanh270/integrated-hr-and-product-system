/**
 * Fields regex
 */
export const REGEX = {
  // MongoDB ObjectId (_id). 24 characters hex string
  MONGO_ID: /^[0-9a-fA-F]{24}$/,

  // Only contain lowercase letters, numbers, and underscores (_) and dots (.)
  USERNAME: /^[a-z0-9_.]+$/,

  // Minimum 8 characters, including at least 1 uppercase, 1 lowercase, 1 number and 1 special character.
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Can include + at first character, length from 10 to 15 characters
  PHONE: /^\+?[0-9]{10,15}$/,
}
