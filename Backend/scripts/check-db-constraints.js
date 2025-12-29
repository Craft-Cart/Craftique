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

function checkMigrationFiles(migrationFiles) {
  const errors = [];
  const warnings = [];
  
  // Read all migration files content
  const allMigrationsContent = migrationFiles.map(file => ({
    path: file,
    content: fs.readFileSync(file, 'utf8')
  }));
  
  // Combine all migration content to check if constraints exist anywhere
  const allContent = allMigrationsContent.map(f => f.content).join('\n');
  
  // Check each expected table
  for (const [tableName, expected] of Object.entries(expectedConstraints)) {
    // Find the migration file where the table is created
    const createTableFile = allMigrationsContent.find(f => 
      new RegExp(`CREATE TABLE\\s+"${tableName}"`, 'i').test(f.content)
    );
    
    if (!createTableFile) {
      continue; // Table doesn't exist, skip
    }
    
    // Check if quantity column exists in the CREATE TABLE
    const createTableMatch = createTableFile.content.match(
      new RegExp(`CREATE TABLE\\s+"${tableName}"\\s*\\(([\\s\\S]*?)\\)`, 'i')
    );
    
    if (!createTableMatch || !/\"quantity\"\s+INTEGER/i.test(createTableMatch[1])) {
      continue; // No quantity column, skip
    }
    
    // Check for CHECK constraint in CREATE TABLE (inline)
    // For OrderItem, check for > 0, for others check for >= 0
    const checkOperator = tableName === 'OrderItem' ? '>' : '>=';
    const inlineCheckPattern = new RegExp(
      `CREATE TABLE\\s+"${tableName}"[\\s\\S]*?"quantity"[\\s\\S]*?CHECK\\s*\\(quantity\\s*${checkOperator}\\s*0\\)`,
      'i'
    );
    
    // Check for ALTER TABLE ADD CONSTRAINT in ANY migration file
    // For OrderItem, must check for > 0, for others >= 0 is acceptable
    let alterCheckPattern;
    if (tableName === 'OrderItem') {
      // OrderItem must have > 0, but also accept >= 0 as it's stricter
      alterCheckPattern = new RegExp(
        `ALTER TABLE\\s+"${tableName}"[\\s\\S]*?ADD CONSTRAINT[\\s\\S]*?CHECK\\s*\\(quantity\\s*[>=]\\s*0\\)`,
        'i'
      );
    } else {
      // Other tables need >= 0
      alterCheckPattern = new RegExp(
        `ALTER TABLE\\s+"${tableName}"[\\s\\S]*?ADD CONSTRAINT[\\s\\S]*?CHECK\\s*\\(quantity\\s*>=\\s*0\\)`,
        'i'
      );
    }
    
    // Check for constraint name pattern in ANY migration file
    const constraintNamePattern = new RegExp(
      `"${tableName}_quantity_check"|"${tableName.toLowerCase()}_quantity_check"`,
      'i'
    );
    
    const hasInlineCheck = inlineCheckPattern.test(createTableFile.content);
    const hasAlterCheck = alterCheckPattern.test(allContent); // Check in all migrations
    const hasConstraintName = constraintNamePattern.test(allContent); // Check in all migrations
    
    if (!hasInlineCheck && !hasAlterCheck) {
      errors.push({
        table: tableName,
        file: path.relative(process.cwd(), createTableFile.path),
        message: `Missing CHECK constraint: ${expected.description}. Add: ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_quantity_check" ${expected.constraint};`,
        expected: expected.constraint
      });
    } else if (!hasConstraintName && (hasInlineCheck || hasAlterCheck)) {
      warnings.push({
        table: tableName,
        file: path.relative(process.cwd(), createTableFile.path),
        message: `CHECK constraint exists but should be named: "${tableName}_quantity_check" for better maintainability`
      });
    }
  }
  
  return { errors, warnings };
}

function checkGenericQuantityColumns(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const warnings = [];
  
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
  
  return { warnings };
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
  
  // Check all migration files together to see if constraints exist in any migration
  const { errors: allErrors, warnings: allWarnings } = checkMigrationFiles(migrationFiles);
  
  // Also check for generic quantity columns in individual files
  let genericWarnings = [];
  migrationFiles.forEach(file => {
    const { warnings } = checkGenericQuantityColumns(file);
    genericWarnings = genericWarnings.concat(warnings);
  });
  
  const allWarningsCombined = [...allWarnings, ...genericWarnings];
  
  // Print warnings first
  if (allWarningsCombined.length > 0) {
    console.log('\n⚠️  Warnings:');
    allWarningsCombined.forEach(w => {
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
    if (allWarningsCombined.length > 0) {
      console.log(`   (${allWarningsCombined.length} warning(s) - see above)`);
    }
  }
}

main();

