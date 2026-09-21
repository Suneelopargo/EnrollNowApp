// frontend/shared/telemetry/index.ts - Structured Frontend Telemetry & Observability
import { TelemetryEvent } from '../contracts';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'corr-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

class TelemetryLogger {
  private currentCorrelationId: string = generateCorrelationId();
  private enabled: boolean = true;

  public setCorrelationId(id: string) {
    if (id && id.trim()) {
      this.currentCorrelationId = id;
    }
  }

  public getCorrelationId(): string {
    return this.currentCorrelationId;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public track(event: Omit<TelemetryEvent, 'timestamp' | 'correlationId'>) {
    if (!this.enabled) return;

    // Sanitize details to never log credentials, tokens, or sensitive PHI
    const sanitizedDetails = event.details ? this.sanitize(event.details) : undefined;

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      correlationId: this.currentCorrelationId,
      details: sanitizedDetails,
    };

    // Output structured JSON telemetry (can be plugged into external observability agent)
    if (event.eventType.includes('ERROR')) {
      console.warn(`[TELEMETRY] [${fullEvent.eventType}] [${fullEvent.correlationId}]`, JSON.stringify(fullEvent));
    } else {
      console.info(`[TELEMETRY] [${fullEvent.eventType}] [${fullEvent.correlationId}]`, JSON.stringify(fullEvent));
    }
  }

  private sanitize(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'key', 'ssn', 'dob', 'mrn'];
    const clean: Record<string, any> = {};

    for (const [k, v] of Object.entries(obj)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = this.sanitize(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }
}

export const telemetry = new TelemetryLogger();
export default telemetry;
