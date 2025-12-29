#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check that all quantity columns in database migrations have CHECK constraints
 * to prevent negative values (business logic error prevention)
 */

const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

// Expected CHECK constraints for quantity fields
const expectedConstraints = {
  'Item': { constraint: 'CHECK (quantity >= 0)', description: 'Item.quantity should be >= 0' },
  'OrderItem': { constraint: 'CHECK (quantity > 0)', description: 'OrderItem.quantity should be > 0' },
  'ProductVariant': { constraint: 'CHECK (quantity >= 0)', description: 'ProductVariant.quantity should be >= 0' },
  // InventoryLog.quantity can be negative for adjustments, so we skip it
};

function findMigrationFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Look for migration.sql in subdirectories
      const sqlFile = path.join(fullPath, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        files.push(sqlFile);
      }
    } else if (entry.name.endsWith('.sql')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkMigrationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];
  
  // Check each expected table
  for (const [tableName, expected] of Object.entries(expectedConstraints)) {
    // Check if table is created
    const tablePattern = new RegExp(`CREATE TABLE\\s+"${tableName}"`, 'i');
    if (!tablePattern.test(content)) {
      continue; // Table doesn't exist in this migration, skip
    }
    
    // Check if quantity column exists
    const quantityPattern = new RegExp(`"quantity"\\s+INTEGER`, 'i');
    if (!quantityPattern.test(content)) {
      continue; // No quantity column, skip
    }
    
    // Check for CHECK constraint in CREATE TABLE
    const inlineCheckPattern = new RegExp(
      `CREATE TABLE\\s+"${tableName}"[\\s\\S]*?"quantity"[\\s\\S]*?CHECK\\s*\\(quantity\\s*[>=]\\s*0\\)`,
      'i'
    );
    
    // Check for ALTER TABLE ADD CONSTRAINT
    const alterCheckPattern = new RegExp(
      `ALTER TABLE\\s+"${tableName}"[\\s\\S]*?ADD CONSTRAINT[\\s\\S]*?CHECK\\s*\\(quantity\\s*[>=]\\s*0\\)`,
      'i'
    );
    
    // Check for constraint name pattern
    const constraintNamePattern = new RegExp(
      `"${tableName}_quantity_check"|"${tableName.toLowerCase()}_quantity_check"`,
      'i'
    );
    
    const hasInlineCheck = inlineCheckPattern.test(content);
    const hasAlterCheck = alterCheckPattern.test(content);
    const hasConstraintName = constraintNamePattern.test(content);
    
    if (!hasInlineCheck && !hasAlterCheck) {
      errors.push({
        table: tableName,
        file: path.relative(process.cwd(), filePath),
        message: `Missing CHECK constraint: ${expected.description}. Add: ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_quantity_check" ${expected.constraint};`,
        expected: expected.constraint
      });
    } else if (!hasConstraintName) {
      warnings.push({
        table: tableName,
        file: path.relative(process.cwd(), filePath),
        message: `CHECK constraint exists but should be named: "${tableName}_quantity_check" for better maintainability`
      });
    }
  }
  
  // Generic check for any other quantity columns without constraints
  // Parse each CREATE TABLE statement separately to avoid cross-table matching
  const createTablePattern = /CREATE TABLE\s+"(\w+)"\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = createTablePattern.exec(content)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];
    
    // Skip if we already checked this table
    if (expectedConstraints[tableName]) {
      continue;
    }
    
    // Skip InventoryLog as it can have negative quantities for adjustments
    if (tableName === 'InventoryLog') {
      continue;
    }
    
    // Check if this table has a quantity column
    const hasQuantityColumn = /"quantity"\s+INTEGER/i.test(tableBody);
    if (!hasQuantityColumn) {
      continue;
    }
    
    // Check if this table has a CHECK constraint in CREATE TABLE
    const hasCheck = /CHECK\s*\(quantity\s*[>=]\s*0\)/i.test(tableBody);
    
    // Check for ALTER TABLE ADD CONSTRAINT
    const hasAlterCheck = new RegExp(
      `ALTER TABLE\\s+"${tableName}"[\\s\\S]*?ADD CONSTRAINT[\\s\\S]*?CHECK\\s*\\(quantity\\s*[>=]\\s*0\\)`,
      'i'
    ).test(content);
    
    if (!hasCheck && !hasAlterCheck) {
      warnings.push({
        table: tableName,
        file: path.relative(process.cwd(), filePath),
        message: `Table "${tableName}" has quantity column without CHECK constraint. Consider adding: ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_quantity_check" CHECK (quantity >= 0);`
      });
    }
  }
  
  return { errors, warnings };
}

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  Migrations directory not found, skipping constraint check');
    return;
  }
  
  const migrationFiles = findMigrationFiles(migrationsDir);
  
  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }
  
  let allErrors = [];
  let allWarnings = [];
  
  migrationFiles.forEach(file => {
    const { errors, warnings } = checkMigrationFile(file);
    allErrors = allErrors.concat(errors);
    allWarnings = allWarnings.concat(warnings);
  });
  
  // Print warnings first
  if (allWarnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    allWarnings.forEach(w => {
      console.log(`  ${w.file} - ${w.message}`);
    });
  }
  
  // Print errors
  if (allErrors.length > 0) {
    console.error('\n❌ Missing CHECK constraints:');
    allErrors.forEach(e => {
      console.error(`  ${e.file} - Table "${e.table}": ${e.message}`);
    });
    console.error(`\n❌ Found ${allErrors.length} missing CHECK constraint(s)`);
    process.exit(1);
  } else {
    console.log('\n✅ All quantity columns have CHECK constraints');
    if (allWarnings.length > 0) {
      console.log(`   (${allWarnings.length} warning(s) - see above)`);
    }
  }
}

main();

