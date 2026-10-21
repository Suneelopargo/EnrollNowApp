// frontend/shared/api-architecture.test.ts - Automated Architectural Safeguard for API Integrations
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Scans directories recursively for files matching extension filters.
 */
function scanSourceFiles(dir: string, extensions = ['.ts', '.tsx']): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name === 'coverage'
      ) {
        continue;
      }
      results = results.concat(scanSourceFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext)) && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe('Enterprise API Architecture Compliance Rules', () => {
  const rootDir = path.resolve(__dirname, '..');
  const allSourceFiles = scanSourceFiles(rootDir);

  it('prohibits hardcoded localhost:8080 backend URLs in runtime source files', () => {
    const violations: { file: string; line: number; text: string }[] = [];

    // Approved exceptions: test mocks and centralized configuration definitions
    const approvedFiles = [
      'api-architecture.test.ts',
      'api-client',
      'api-config.ts',
      'api-config.test.ts',
      'api-client.test.ts',
      'AuthContext.test.ts',
      'administratorApi.test.ts',
      'communication.test.ts',
      'dashboard.test.ts',
      'document.test.ts',
      'identity.test.ts',
      'organization.test.ts',
      'participant.test.ts',
      'recruitment.test.ts',
      'study.test.ts',
      'survey.test.ts',
      'task.test.ts',
      'vite.config.ts', // Proxy target definition
    ];

    allSourceFiles.forEach((file) => {
      const normalizedPath = file.replace(/\\/g, '/');
      if (approvedFiles.some((approved) => normalizedPath.includes(approved))) return;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (
          (line.includes('http://localhost:8080') || line.includes('http://127.0.0.1:8080')) &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*')
        ) {
          violations.push({ file, line: index + 1, text: line.trim() });
        }
      });
    });

    expect(
      violations,
      `Found prohibited hardcoded backend URL in runtime files:\n${violations.map((v) => `${v.file}:${v.line} -> ${v.text}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('prohibits independent axios.create() calls outside centralized api-client', () => {
    const violations: { file: string; line: number; text: string }[] = [];

    allSourceFiles.forEach((file) => {
      const normalizedPath = file.replace(/\\/g, '/');
      if (
        normalizedPath.endsWith('shared/api-client/index.ts') ||
        normalizedPath.endsWith('.test.ts') ||
        normalizedPath.endsWith('.test.tsx')
      ) {
        return;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('axios.create(') && !line.trim().startsWith('//')) {
          violations.push({ file, line: index + 1, text: line.trim() });
        }
      });
    });

    expect(
      violations,
      `Found independent axios.create() calls outside centralized client:\n${violations.map((v) => `${v.file}:${v.line} -> ${v.text}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('prohibits unapproved direct window.fetch() calls in business logic', () => {
    const violations: { file: string; line: number; text: string }[] = [];

    // Approved exceptions: static runtime-config asset loader
    const approvedFiles = ['runtime-config/index.ts'];

    allSourceFiles.forEach((file) => {
      const normalizedPath = file.replace(/\\/g, '/');
      if (
        normalizedPath.endsWith('.test.ts') ||
        normalizedPath.endsWith('.test.tsx') ||
        approvedFiles.some((approved) => normalizedPath.endsWith(approved))
      ) {
        return;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (
          (line.includes('fetch(') || line.includes('window.fetch(')) &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*')
        ) {
          violations.push({ file, line: index + 1, text: line.trim() });
        }
      });
    });

    expect(
      violations,
      `Found unapproved direct fetch() calls. All API communication must use apiClient:\n${violations.map((v) => `${v.file}:${v.line} -> ${v.text}`).join('\n')}`
    ).toHaveLength(0);
  });
});
