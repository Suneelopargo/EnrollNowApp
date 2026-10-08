// frontend/shared/mock-api/mockResponse.ts - Standardized Mock Response & Error Generators
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Returns HTTP standard status text.
 */
export function getStatusText(status: number): string {
  switch (status) {
    case 200:
      return 'OK';
    case 201:
      return 'Created';
    case 204:
      return 'No Content';
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    default:
      return status >= 400 ? 'Error' : 'OK';
  }
}

/**
 * Generates an AxiosResponse matching standard Spring Boot ApiResponse<T> contract.
 */
export function createMockSuccessResponse<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200,
  message = 'Success'
): AxiosResponse {
  const correlationId = (config.headers?.['X-Correlation-Id'] as string) || `mock-cid-${Date.now()}`;
  const responseData = {
    success: true,
    message,
    data,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  return {
    data: responseData,
    status,
    statusText: getStatusText(status),
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
    },
    config,
    request: {},
  };
}

/**
 * Generates an AxiosError matching standard Spring Boot error payload.
 */
export function createMockErrorResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  message: string,
  code?: string,
  details?: string[]
): AxiosError {
  const correlationId = (config.headers?.['X-Correlation-Id'] as string) || `mock-cid-${Date.now()}`;
  const errorCode = code || (status === 401 ? 'UNAUTHORIZED' : `HTTP_${status}`);
  const responseData = {
    success: false,
    message,
    error: {
      code: errorCode,
      message,
      details: details || [],
    },
    correlationId,
    timestamp: new Date().toISOString(),
  };

  const response: AxiosResponse = {
    data: responseData,
    status,
    statusText: getStatusText(status),
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
    },
    config,
    request: {},
  };

  return new axios.AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
    config,
    {},
    response
  );
}

/**
 * Generates a simulated network failure error (e.g. timeout or offline).
 */
export function createMockNetworkError(config: InternalAxiosRequestConfig): AxiosError {
  return new axios.AxiosError(
    'Network Error: Simulated connection failure',
    'ERR_NETWORK',
    config,
    {},
    undefined
  );
}
