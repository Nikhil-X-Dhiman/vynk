/**
 * Centralized Error Handler for Socket Events
 *
 * Provides consistent error handling and response formatting.
 */

import { logger } from './logger';

/** Standard error response format */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/** Standard success response format */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export type SocketResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Wraps a socket event handler with error handling.
 * Catches errors and calls callback with standardized error response.
 */
export function withErrorHandler<TPayload, TResult>(
  eventName: string,
  handler: (payload: TPayload) => Promise<SocketResponse<TResult>>,
) {
  return async (
    payload: TPayload,
    callback?: (response: SocketResponse<TResult>) => void,
  ): Promise<void> => {
    try {
      const result = await handler(payload);
      if (callback) callback(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      logger.error(`Error in ${eventName}:`, { error: errorMessage, payload });

      if (callback) {
        callback({
          success: false,
          error: errorMessage,
          code: 'INTERNAL_ERROR',
        });
      }
    }
  };
}

/**
 * Creates a validation error response
 */
export function validationError(field: string, message?: string): ErrorResponse {
  return {
    success: false,
    error: message || `Invalid ${field}`,
    code: 'VALIDATION_ERROR',
  };
}

/**
 * Creates a not found error response
 */
export function notFoundError(resource: string): ErrorResponse {
  return {
    success: false,
    error: `${resource} not found`,
    code: 'NOT_FOUND',
  };
}

/**
 * Creates a permission error response
 */
export function permissionError(action?: string): ErrorResponse {
  return {
    success: false,
    error: action ? `Not authorized to ${action}` : 'Permission denied',
    code: 'PERMISSION_DENIED',
  };
}
