import winston from 'winston';
import { config } from '../config/env';

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = ['password', 'token', 'refresh_token', 'access_token', 'cvv', 'credit_card', 'authorization'];

// Custom formatter to redact sensitive data
const redactSensitive = winston.format((info) => {
  const redactObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in redacted) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive field
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        redacted[key] = '***REDACTED***';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = redactObject(redacted[key]);
      }
    }
    
    return redacted;
  };
  
  // Redact message if it's an object
  if (typeof info.message === 'object') {
    info.message = redactObject(info.message);
  }
  
  // Redact metadata
  if (info.metadata) {
    info.metadata = redactObject(info.metadata);
  }
  
  return info;
});

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactSensitive(),
    winston.format.json()
  ),
  defaultMeta: { service: 'craftique-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Ensure logs directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Directory might already exist
}

