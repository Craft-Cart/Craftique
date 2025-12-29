#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Check for known vulnerabilities in dependencies
 * Specifically checks for CVE-2025-66478 (React2Shell RCE) and other critical CVEs
 */

const rootDir = path.join(__dirname, '..', '..');
const backendDir = path.join(rootDir, 'Backend');
const frontendDir = path.join(rootDir, 'Frontend');

// Known critical CVEs to check for
const CRITICAL_CVES = [
  'CVE-2025-66478', // React2Shell RCE
  // Add other critical CVEs as needed
];

let errors = [];
let warnings = [];

function checkNpmAudit(projectDir, projectName) {
  if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
    warnings.push({
      project: projectName,
      message: `package.json not found, skipping audit`
    });
    return;
  }

  // Check if pnpm is used (check for pnpm-lock.yaml)
  const usePnpm = fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'));
  let packageManager = usePnpm ? 'pnpm' : 'npm';
  let auditCommand = usePnpm ? 'pnpm audit --json' : 'npm audit --json';

  // Check if pnpm is available
  if (usePnpm) {
    try {
      execSync('pnpm --version', { stdio: 'pipe' });
    } catch (error) {
      // pnpm not available, fall back to npm
      packageManager = 'npm';
      auditCommand = 'npm audit --json';
      warnings.push({
        project: projectName,
        message: 'pnpm-lock.yaml found but pnpm not available, using npm audit instead'
      });
    }
  }

  try {
    // Run audit and get JSON output
    const auditOutput = execSync(auditCommand, {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const audit = JSON.parse(auditOutput);

    // Check for vulnerabilities
    if (audit.vulnerabilities) {
      const vulnCount = Object.keys(audit.vulnerabilities).length;
      const criticalCount = audit.metadata?.vulnerabilities?.critical || 0;
      const highCount = audit.metadata?.vulnerabilities?.high || 0;

      if (criticalCount > 0 || highCount > 0) {
        errors.push({
          project: projectName,
          message: `Found ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
          critical: criticalCount,
          high: highCount,
          total: vulnCount
        });

        // Check for specific CVEs
        for (const [pkgName, vuln] of Object.entries(audit.vulnerabilities)) {
          if (vuln.via) {
            const viaArray = Array.isArray(vuln.via) ? vuln.via : [vuln.via];
            for (const via of viaArray) {
              if (typeof via === 'object' && via.cve) {
                if (CRITICAL_CVES.includes(via.cve)) {
                  errors.push({
                    project: projectName,
                    message: `CRITICAL: Found ${via.cve} in ${pkgName}`,
                    cve: via.cve,
                    package: pkgName,
                    severity: via.severity || 'critical'
                  });
                }
              }
            }
          }
        }
      } else if (vulnCount > 0) {
        warnings.push({
          project: projectName,
          message: `Found ${vulnCount} vulnerabilities (moderate/low severity)`
        });
      }
    }

    // Check if audit fix is available
    if (audit.actions && audit.actions.length > 0) {
      const fixableCount = audit.actions.filter(a => a.action === 'update' || a.action === 'install').length;
      if (fixableCount > 0) {
        const fixCommand = usePnpm ? 'pnpm audit --fix' : 'npm audit fix';
        warnings.push({
          project: projectName,
          message: `${fixableCount} vulnerabilities can be fixed by running '${fixCommand}'`
        });
      }
    }

  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities are found
    if (error.status === 1) {
      try {
        const auditOutput = error.stdout || error.message;
        const audit = JSON.parse(auditOutput);
        
        const criticalCount = audit.metadata?.vulnerabilities?.critical || 0;
        const highCount = audit.metadata?.vulnerabilities?.high || 0;

        if (criticalCount > 0 || highCount > 0) {
          errors.push({
            project: projectName,
            message: `npm audit found ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
            critical: criticalCount,
            high: highCount
          });
        }
      } catch (parseError) {
        errors.push({
          project: projectName,
          message: `Failed to parse ${packageManager} audit output. Run '${packageManager} audit' manually to check for vulnerabilities.`
        });
      }
    } else if (error.message && error.message.includes('not found')) {
      // Package manager not found - this is expected in some environments
      warnings.push({
        project: projectName,
        message: `${packageManager} not found in PATH. Install ${packageManager} or run audit manually.`
      });
    } else {
      errors.push({
        project: projectName,
        message: `Failed to run ${packageManager} audit: ${error.message}`
      });
    }
  }
}

// Check Backend
if (fs.existsSync(backendDir)) {
  checkNpmAudit(backendDir, 'Backend');
}

// Check Frontend
if (fs.existsSync(frontendDir)) {
  checkNpmAudit(frontendDir, 'Frontend');
}

// Print results
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => {
    console.log(`  ${w.project}: ${w.message}`);
  });
}

if (errors.length > 0) {
  console.error('\n❌ Dependency vulnerability issues:');
  errors.forEach(e => {
    console.error(`  ${e.project}: ${e.message}`);
    if (e.cve) {
      console.error(`    CVE: ${e.cve} in package: ${e.package}`);
      console.error(`    Action: Update ${e.package} to patched version or run 'npm audit fix'`);
    }
    if (e.critical || e.high) {
      console.error(`    Critical: ${e.critical || 0}, High: ${e.high || 0}`);
    }
  });
  console.error(`\n❌ Found ${errors.length} vulnerability issue(s)`);
  console.error('\nTo fix:');
  console.error('  1. Run "npm audit fix" in Backend directory');
  console.error('  2. Run "pnpm audit --fix" in Frontend directory (if using pnpm)');
  console.error('  3. If audit fix doesn\'t resolve, manually update vulnerable packages in package.json');
  console.error('  4. For CVE-2025-66478 (React2Shell RCE), ensure React and related packages are updated to patched versions');
  console.error('  5. Review and update package.json dependencies to latest secure versions');
  process.exit(1);
} else {
  console.log('\n✅ No critical or high severity vulnerabilities found');
  if (warnings.length > 0) {
    console.log(`   (${warnings.length} warning(s) - see above)`);
  }
}

