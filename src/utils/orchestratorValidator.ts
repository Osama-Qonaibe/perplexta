export interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateToolRoutePricing(
  _route: {
    id?: string;
    tool_id?: string;
  },
  _language: 'ar' | 'en' = 'en'
): RouteValidationResult {
  return {
    isValid: true,
    errors: [],
  };
}
