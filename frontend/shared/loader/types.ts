// frontend/shared/loader/types.ts - Global Loader State & Options Contracts
export interface LoaderState {
  visible: boolean;
  message?: string;
  title?: string;
  subtitle?: string;
  activeRequests: number;
}

export interface LoaderOptions {
  message?: string;
  title?: string;
  subtitle?: string;
}
