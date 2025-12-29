#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check that all write routes (POST, PUT, PATCH) in routes files have validateBody middleware
 */

const routesDir = path.join(__dirname, '..', 'src', 'routes');
const writeMethods = ['post', 'put', 'patch'];

function checkRoutesFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isWriteRoute = writeMethods.some(method => line.includes(`router.${method}(`));

    if (isWriteRoute) {
      // Check current line and next 20 lines for validateBody
      let hasValidateBody = false;
      for (let j = 0; j <= 20 && i + j < lines.length; j++) {
        if (lines[i + j].includes('validateBody(')) {
          hasValidateBody = true;
          break;
        }
      }

      if (!hasValidateBody) {
        errors.push(`Line ${i + 1}: ${line} - Missing validateBody middleware`);
      }
    }
  }

  return errors;
}

function main() {
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.routes.ts'));
  let allErrors = [];

  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const errors = checkRoutesFile(filePath);
    if (errors.length > 0) {
      console.error(`Errors in ${file}:`);
      errors.forEach(error => console.error(`  ${error}`));
      allErrors = allErrors.concat(errors);
    }
  });

  if (allErrors.length > 0) {
    console.error(`\n❌ Found ${allErrors.length} write routes without validateBody middleware`);
    process.exit(1);
  } else {
    console.log('✅ All write routes have validateBody middleware');
  }
}

main();