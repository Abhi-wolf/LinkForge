/**
 * Password validation utility for frontend - matches backend validation
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

/**
 * Validates password complexity requirements
 * @param password - Password to validate
 * @returns Validation result with errors and requirement status
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
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
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }
};
