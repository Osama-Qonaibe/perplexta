export interface ServerValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ServerToolRoute {
  tool_id?: string;
  primary_provider?: string;
  primary_model?: string;
  fallback_1_provider?: string;
  fallback_1_model?: string;
  fallback_2_provider?: string;
  fallback_2_model?: string;
  fallback_3_provider?: string;
  fallback_3_model?: string;
  is_active?: boolean;
  protocol_config?: unknown;
}

export function validateServerToolRoute(route: ServerToolRoute): ServerValidationResult {
  const errors: string[] = [];

  const {
    tool_id,
    primary_provider,
    primary_model,
    fallback_1_provider,
    fallback_1_model,
    fallback_2_provider,
    fallback_2_model,
    fallback_3_provider,
    fallback_3_model,
    protocol_config,
  } = route;

  if (!tool_id || String(tool_id).trim() === '') {
    errors.push('tool_id is required and cannot be empty.');
  }

  const validateStringLen = (val: string | undefined, limit: number, fieldName: string) => {
    if (val && String(val).length > limit) {
      errors.push(`${fieldName} string exceeds database schema VARCHAR limit of ${limit} characters.`);
    }
  };

  validateStringLen(primary_provider, 100, 'primary_provider');
  validateStringLen(primary_model, 255, 'primary_model');
  validateStringLen(fallback_1_provider, 100, 'fallback_1_provider');
  validateStringLen(fallback_1_model, 255, 'fallback_1_model');
  validateStringLen(fallback_2_provider, 100, 'fallback_2_provider');
  validateStringLen(fallback_2_model, 255, 'fallback_2_model');
  validateStringLen(fallback_3_provider, 100, 'fallback_3_provider');
  validateStringLen(fallback_3_model, 255, 'fallback_3_model');

  if (tool_id === 'video') {
    if (primary_provider && !primary_model) {
      errors.push('Video Tool Error: A specific model must be set when designating a primary provider.');
    }
  }

  if (protocol_config !== undefined && protocol_config !== null) {
    if (typeof protocol_config === 'string') {
      try {
        JSON.parse(protocol_config);
      } catch {
        errors.push('protocol_config holds corrupt or malformed JSON format.');
      }
    } else if (typeof protocol_config !== 'object') {
      errors.push('protocol_config carries unsupported primitive types.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
