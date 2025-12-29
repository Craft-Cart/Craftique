#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check that Winston logger is properly configured with redaction
 * to prevent credential leaks in logs
 */

const loggerPath = path.join(__dirname, '..', 'src', 'utils', 'logger.ts');

let errors = [];
let warnings = [];

if (!fs.existsSync(loggerPath)) {
  console.error('❌ Logger file not found:', loggerPath);
  process.exit(1);
}

const content = fs.readFileSync(loggerPath, 'utf8');

// Check for sensitive fields array
const hasSensitiveFields = /SENSITIVE_FIELDS\s*=\s*\[/i.test(content);
if (!hasSensitiveFields) {
  errors.push({
    file: 'Backend/src/utils/logger.ts',
    message: 'Missing SENSITIVE_FIELDS array. Define sensitive fields to redact (password, token, etc.)',
    fix: 'Add: const SENSITIVE_FIELDS = [\'password\', \'token\', \'refresh_token\', \'access_token\', \'cvv\', \'credit_card\', \'authorization\'];'
  });
}

// Check for redactSensitive formatter
const hasRedactSensitive = /redactSensitive\s*=/i.test(content) || /const\s+redactSensitive/i.test(content);
if (!hasRedactSensitive) {
  errors.push({
    file: 'Backend/src/utils/logger.ts',
    message: 'Missing redactSensitive formatter. Logger must redact sensitive fields before writing to logs.',
    fix: 'Add redactSensitive formatter function that masks sensitive fields'
  });
}

// Check if redactSensitive is used in main logger format
const hasRedactInMainFormat = /winston\.format\.combine\([\s\S]*?redactSensitive\(\)/i.test(content);
if (!hasRedactInMainFormat) {
  errors.push({
    file: 'Backend/src/utils/logger.ts',
    message: 'redactSensitive() not included in main logger format. Add it to winston.format.combine()',
    fix: 'Add redactSensitive() to the format chain: winston.format.combine(..., redactSensitive(), ...)'
  });
}

// Check if redactSensitive is used in console transport
const hasRedactInConsole = /winston\.transports\.Console\([\s\S]*?format:\s*winston\.format\.combine\([\s\S]*?redactSensitive\(\)/i.test(content);
if (!hasRedactInConsole) {
  errors.push({
    file: 'Backend/src/utils/logger.ts',
    message: 'redactSensitive() not included in console transport format. Console output must also redact sensitive data to prevent credential leaks in stdout.',
    fix: 'Add redactSensitive() to console transport format chain before other formatters'
  });
}

// Check for common sensitive field names
const requiredFields = ['password', 'token'];
const missingFields = [];
requiredFields.forEach(field => {
  if (!new RegExp(`['"]${field}['"]`, 'i').test(content)) {
    missingFields.push(field);
  }
});

if (missingFields.length > 0) {
  warnings.push({
    file: 'Backend/src/utils/logger.ts',
    message: `SENSITIVE_FIELDS array should include: ${missingFields.join(', ')}`
  });
}

// Check for console.log usage in source files
const srcDir = path.join(__dirname, '..', 'src');
function checkForConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules' && file.name !== '__tests__') {
      checkForConsoleLogs(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      
      // Check for console.log with potentially sensitive data
      const consolePattern = /console\.(log|error|warn|info|debug)\s*\([^)]*(?:req\.body|req\.headers|password|token|secret)/i;
      if (consolePattern.test(fileContent)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        warnings.push({
          file: relativePath,
          message: 'Found console.log/error/warn/info with potentially sensitive data. Use logger from utils/logger.ts instead.'
        });
      }
    }
  }
}

if (fs.existsSync(srcDir)) {
  try {
    checkForConsoleLogs(srcDir);
  } catch (error) {
    // Ignore errors during directory traversal
  }
}

// Print results
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => {
    console.log(`  ${w.file}: ${w.message}`);
  });
}

if (errors.length > 0) {
  console.error('\n❌ Log redaction configuration issues:');
  errors.forEach(e => {
    console.error(`  ${e.file}: ${e.message}`);
    if (e.fix) {
      console.error(`    Fix: ${e.fix}`);
    }
  });
  console.error(`\n❌ Found ${errors.length} log redaction issue(s)`);
  process.exit(1);
} else {
  console.log('\n✅ Logger is properly configured with redaction');
  if (warnings.length > 0) {
    console.log(`   (${warnings.length} warning(s) - see above)`);
  }
}

