#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check that global error handler is properly configured to prevent
 * database schema leaks in error responses
 */

const errorHandlerPath = path.join(__dirname, '..', 'src', 'utils', 'errors.ts');
const serverPath = path.join(__dirname, '..', 'src', 'server.ts');

let errors = [];
let warnings = [];

// Check error handler file
if (!fs.existsSync(errorHandlerPath)) {
  errors.push({
    file: 'Backend/src/utils/errors.ts',
    message: 'Error handler file not found'
  });
} else {
  const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');
  
  // Check for global error handler function
  const hasErrorHandler = /export\s+(const|function)\s+errorHandler/i.test(errorHandlerContent);
  if (!hasErrorHandler) {
    errors.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Missing errorHandler function. Global error handler is required to catch all errors.',
      fix: 'Export an errorHandler function that catches all errors'
    });
  }
  
  // Check for Prisma error handling
  const hasPrismaErrorHandling = /PrismaClientKnownRequestError|PrismaClientUnknownRequestError|PrismaClientValidationError/i.test(errorHandlerContent);
  if (!hasPrismaErrorHandling) {
    errors.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Missing Prisma error handling. Error handler should catch all Prisma error types to prevent schema leaks.',
      fix: 'Add handling for PrismaClientKnownRequestError, PrismaClientUnknownRequestError, and PrismaClientValidationError'
    });
  }
  
  // Check for production environment check
  const hasProductionCheck = /config\.nodeEnv\s*===\s*['"]production['"]/i.test(errorHandlerContent) ||
                             /process\.env\.NODE_ENV\s*===\s*['"]production['"]/i.test(errorHandlerContent);
  if (!hasProductionCheck) {
    warnings.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Error handler should check NODE_ENV to prevent error details in production'
    });
  }
  
  // Check for generic error messages in production
  const hasGenericMessage = /['"]Internal Server Error['"]|['"]An unexpected error occurred['"]/i.test(errorHandlerContent);
  if (!hasGenericMessage) {
    warnings.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Error handler should return generic error messages in production (e.g., "Internal Server Error")'
    });
  }
  
  // Check if Prisma errors return generic messages (not error.message)
  const hasPrismaGenericResponse = /PrismaClient.*Error[\s\S]*?res\.status\(500\)[\s\S]*?['"]Internal Server Error['"]/i.test(errorHandlerContent);
  const hasPrismaErrorMessage = /PrismaClient.*Error[\s\S]*?err\.message|error\.message/i.test(errorHandlerContent);
  
  if (hasPrismaErrorHandling && hasPrismaErrorMessage && !hasPrismaGenericResponse) {
    errors.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Prisma errors may leak schema information. Ensure Prisma errors return generic messages, not err.message which may contain table/column names.',
      fix: 'Return generic error message for Prisma errors: { error: "Internal Server Error", message: "An unexpected error occurred" }'
    });
  }
  
  // Check for database-related error keywords that should be sanitized
  const dbKeywords = ['relation', 'column', 'constraint', 'syntax error', 'SQL', 'database'];
  const hasDbErrorHandling = dbKeywords.some(keyword => 
    new RegExp(`['"]${keyword}['"]|${keyword}`, 'i').test(errorHandlerContent)
  );
  
  if (!hasDbErrorHandling) {
    warnings.push({
      file: 'Backend/src/utils/errors.ts',
      message: 'Consider adding handling for database connection errors (ECONNREFUSED, ETIMEDOUT, etc.) to prevent schema leaks'
    });
  }
}

// Check server.ts for global error handler registration
if (!fs.existsSync(serverPath)) {
  errors.push({
    file: 'Backend/src/server.ts',
    message: 'Server file not found'
  });
} else {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check if error handler is imported
  const hasErrorHandlerImport = /import.*errorHandler/i.test(serverContent);
  if (!hasErrorHandlerImport) {
    errors.push({
      file: 'Backend/src/server.ts',
      message: 'Error handler not imported. Import errorHandler from utils/errors',
      fix: 'Add: import { errorHandler } from \'./utils/errors\';'
    });
  }
  
  // Check if error handler is registered as last middleware
  const hasErrorHandlerUse = /app\.use\(errorHandler\)/i.test(serverContent);
  if (!hasErrorHandlerUse) {
    errors.push({
      file: 'Backend/src/server.ts',
      message: 'Error handler not registered. Error handler must be registered as the last middleware with app.use(errorHandler)',
      fix: 'Add: app.use(errorHandler); as the last middleware before app.listen()'
    });
  }
  
  // Check if error handler is after routes
  const routePattern = /app\.use\(['"]\/api/i;
  const errorHandlerPattern = /app\.use\(errorHandler\)/i;
  const routeMatches = [...serverContent.matchAll(new RegExp(routePattern, 'g'))];
  const errorHandlerMatch = serverContent.match(errorHandlerPattern);
  
  if (routeMatches.length > 0 && errorHandlerMatch) {
    const lastRouteIndex = routeMatches[routeMatches.length - 1].index;
    const errorHandlerIndex = errorHandlerMatch.index;
    
    if (errorHandlerIndex < lastRouteIndex) {
      errors.push({
        file: 'Backend/src/server.ts',
        message: 'Error handler must be registered AFTER all routes. Move app.use(errorHandler) to after all route definitions.',
        fix: 'Move app.use(errorHandler) to be the last middleware before app.listen()'
      });
    }
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
  console.error('\n❌ Error handler configuration issues:');
  errors.forEach(e => {
    console.error(`  ${e.file}: ${e.message}`);
    if (e.fix) {
      console.error(`    Fix: ${e.fix}`);
    }
  });
  console.error(`\n❌ Found ${errors.length} error handler issue(s)`);
  process.exit(1);
} else {
  console.log('\n✅ Global error handler is properly configured to prevent schema leaks');
  if (warnings.length > 0) {
    console.log(`   (${warnings.length} warning(s) - see above)`);
  }
}

