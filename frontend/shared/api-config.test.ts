// frontend/shared/api-config.test.ts - Tests for Single API Base URL and Config
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getApiBaseUrl,
  normalizeUrl,
  isValidUrl,
  DEFAULT_API_BASE_URL,
  DEFAULT_BACKEND_PORT,
  getApiMode,
  setApiMode,
  getMockErrorSimulation,
  setMockErrorSimulation,
} from './api-config';

describe('Centralized API Configuration', () => {
  const originalEnv = process.env.VITE_API_BASE_URL;

  beforeEach(() => {
    delete process.env.VITE_API_BASE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.VITE_API_BASE_URL = originalEnv;
    } else {
      delete process.env.VITE_API_BASE_URL;
    }
  });

  describe('normalizeUrl', () => {
    it('normalizes single and multiple trailing slashes', () => {
      expect(normalizeUrl('http://localhost:8080/')).toBe('http://localhost:8080');
      expect(normalizeUrl('http://localhost:8080///')).toBe('http://localhost:8080');
      expect(normalizeUrl('https://api.example.com/')).toBe('https://api.example.com');
    });

    it('trims leading and trailing whitespace', () => {
      expect(normalizeUrl('  http://localhost:8080/  ')).toBe('http://localhost:8080');
    });

    it('returns empty string for falsy or invalid input', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl(null as any)).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('validates absolute http and https URLs', () => {
      expect(isValidUrl('http://localhost:8080')).toBe(true);
      expect(isValidUrl('https://api.example.com')).toBe(true);
      expect(isValidUrl('http://127.0.0.1:8080')).toBe(true);
    });

    it('validates relative API paths', () => {
      expect(isValidUrl('/api')).toBe(true);
      expect(isValidUrl('/api/v1')).toBe(true);
    });

    it('rejects invalid URL strings or malformed inputs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not_a_valid_url')).toBe(false);
      expect(isValidUrl('//protocol_relative_invalid')).toBe(false);
      expect(isValidUrl(123 as any)).toBe(false);
    });
  });

  describe('getApiBaseUrl', () => {
    it('defaults to http://localhost:8080 when no environment variable is set', () => {
      expect(DEFAULT_BACKEND_PORT).toBe(8080);
      expect(DEFAULT_API_BASE_URL).toBe('http://localhost:8080');
      const url = getApiBaseUrl();
      expect(url).toBe('http://localhost:8080');
    });

    it('reads VITE_API_BASE_URL and normalizes trailing slashes', () => {
      process.env.VITE_API_BASE_URL = 'http://localhost:8080/';
      expect(getApiBaseUrl()).toBe('http://localhost:8080');

      process.env.VITE_API_BASE_URL = 'https://qa-api.enrollnow.local/';
      expect(getApiBaseUrl()).toBe('https://qa-api.enrollnow.local');
    });

    it('rejects invalid VITE_API_BASE_URL and falls back to default', () => {
      process.env.VITE_API_BASE_URL = 'invalid-not-a-url';
      expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    });

    it('never contains legacy service-specific ports (8081-8092)', () => {
      const url = getApiBaseUrl();
      const legacyPorts = [8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8091, 8092];
      legacyPorts.forEach((port) => {
        expect(url).not.toContain(`:${port}`);
      });
    });
  });

  describe('ApiMode & Error Simulation Config', () => {
    it('defaults to mock mode when VITE_API_MODE is unset', () => {
      setApiMode(null);
      delete process.env.VITE_API_MODE;
      expect(getApiMode()).toBe('mock');
    });

    it('reads VITE_API_MODE=real from environment', () => {
      setApiMode(null);
      process.env.VITE_API_MODE = 'real';
      expect(getApiMode()).toBe('real');
    });

    it('allows programmatic override via setApiMode', () => {
      setApiMode('real');
      expect(getApiMode()).toBe('real');
      setApiMode('mock');
      expect(getApiMode()).toBe('mock');
      setApiMode(null);
    });

    it('supports mock error simulation configuration', () => {
      setMockErrorSimulation(null);
      expect(getMockErrorSimulation()).toBeNull();

      setMockErrorSimulation(500);
      expect(getMockErrorSimulation()).toBe('500');

      setMockErrorSimulation('network');
      expect(getMockErrorSimulation()).toBe('network');

      setMockErrorSimulation(null);
    });
  });
});
