/**
 * Password validation utility with complexity requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password complexity requirements
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Zod schema for password validation with complexity requirements
 */
export const passwordComplexitySchema = {
  password: {
    string: {
      min: 8,
      max: 50,
      message: 'Password must be between 8 and 50 characters'
    },
    refine: (password: string) => {
      const validation = validatePasswordComplexity(password);
      return validation.isValid;
    },
    message: 'Password must meet complexity requirements'
  }
};
