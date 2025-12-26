# Open Source License Compliance Policy

## Overview

This document defines the acceptable and prohibited open source licenses for the Craftique project. All dependencies must comply with this policy before being merged into the codebase.

## License Categories

### ✅ Approved Permissive Licenses

These licenses are **approved for use without restriction**:

| License | SPDX ID | Category | Notes |
|---------|---------|----------|-------|
| MIT License | MIT | Permissive | Preferred license |
| Apache License 2.0 | Apache-2.0 | Permissive | Patent grant included |
| BSD 2-Clause | BSD-2-Clause | Permissive | Simple permissive |
| BSD 3-Clause | BSD-3-Clause | Permissive | Simple permissive |
| ISC License | ISC | Permissive | Functionally equivalent to MIT |
| Creative Commons Zero | CC0-1.0 | Public Domain | Public domain dedication |
| Unlicense | Unlicense | Public Domain | Public domain dedication |
| Python Software Foundation | PSF-2.0 | Permissive | Python ecosystem |
| Boost Software License | BSL-1.0 | Permissive | C++ ecosystem |
| zlib License | Zlib | Permissive | Compression library |

### ⚠️ Conditionally Approved (Weak Copyleft)

These licenses are **approved with conditions** - must not modify:

| License | SPDX ID | Category | Conditions |
|---------|---------|----------|------------|
| Mozilla Public License 2.0 | MPL-2.0 | Weak Copyleft | File-level copyleft only |
| Eclipse Public License 1.0/2.0 | EPL-1.0, EPL-2.0 | Weak Copyleft | File-level copyleft only |
| LGPL 2.1/3.0 | LGPL-2.1, LGPL-3.0 | Weak Copyleft | Dynamic linking allowed |
| Common Development and Distribution License | CDDL-1.0 | Weak Copyleft | File-level copyleft only |

**Requirements:**
- Must use as unmodified library
- Dynamic linking only (LGPL)
- Cannot modify source files
- Legal review required for modifications

### ❌ Prohibited (Strong Copyleft)

These licenses are **strictly prohibited**:

| License | SPDX ID | Reason |
|---------|---------|--------|
| GNU GPL v2/v3 | GPL-2.0, GPL-3.0 | Strong copyleft - requires entire codebase to be GPL |
| GNU Affero GPL v3 | AGPL-3.0 | Network copyleft - requires source disclosure |
| Server Side Public License | SSPL-1.0 | Service provider restrictions |
| Commons Clause | N/A | Restricts commercial use |
| Business Source License | BSL-1.1 | Delayed open source |
| Elastic License 2.0 | Elastic-2.0 | SaaS restrictions |
| MongoDB SSPL | SSPL | Strong copyleft with cloud restrictions |

### 🔍 Requires Review

These licenses require **legal/compliance review before use**:

| License | SPDX ID | Review Reason |
|---------|---------|---------------|
| Artistic License | Artistic-2.0 | Dual licensing complexity |
| Open Software License | OSL-3.0 | Copyleft network clause |
| European Union Public License | EUPL-1.2 | Regional legal differences |
| Microsoft Public License | MS-PL | Patent clauses |
| Any "Custom" or proprietary license | N/A | Unknown terms |

## Compliance Process

### 1. Automated Scanning

Every pull request and build triggers:
- **Trivy License Scanner**: Scans source code and dependencies
- **SBOM Generation**: Creates Software Bill of Materials
- **License Report**: Lists all detected licenses
- **Compliance Check**: Flags prohibited licenses

### 2. Build Gate

The CI/CD pipeline will:
- ✅ **Pass**: Only approved licenses detected
- ⚠️ **Warning**: Conditionally approved licenses found (manual review)
- ❌ **Fail**: Prohibited licenses detected (blocks merge)

Configure in `.github/workflows/security-pipeline.yml`:
```yaml
- name: Check for Prohibited Licenses
  run: |
    # Set continue-on-error: false to enforce
    continue-on-error: true  # Change to 'false' to block builds
```

### 3. Manual Review Process

For packages requiring review:

1. **Developer**: Creates issue with license details
2. **Legal/Compliance**: Reviews license terms
3. **Decision**: Approve, reject, or request alternative
4. **Documentation**: Update this policy if approved
5. **Whitelist**: Add exception in pipeline if needed

### 4. Exception Process

To add an exception for a specific package:

```yaml
# In security-pipeline.yml, add to whitelist
WHITELISTED_PACKAGES=(
  "package-name-1"
  "package-name-2"
)
```

**Requirements for exception:**
- Documented business justification
- Legal review and approval
- Alternative evaluation completed
- Risk assessment documented

## License Compatibility Matrix

| Our License | Can Include |
|-------------|-------------|
| MIT | MIT, Apache-2.0, BSD, ISC, CC0 |
| Apache-2.0 | Apache-2.0, MIT, BSD, ISC |

## Best Practices

### 1. Choosing Dependencies

Before adding a new dependency:
1. ✅ Check license compatibility
2. ✅ Verify license in package.json/package metadata
3. ✅ Review transitive dependencies
4. ✅ Prefer MIT/Apache-2.0 licensed packages
5. ❌ Avoid GPL/AGPL at all costs

### 2. Updating Dependencies

When updating dependencies:
1. Review license changes in release notes
2. Re-run license scan
3. Check for new transitive dependencies

### 3. Custom Code

All original code must be:
- Licensed under **MIT License**
- Include SPDX identifier: `SPDX-License-Identifier: MIT`
- Include copyright notice

Example:
```javascript
/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 Craftique Team
 */
```

## Reporting

### Monthly License Audit

Generate comprehensive report:
```bash
# Generate report from latest build artifacts
gh run download --name license-compliance-report
```

Report includes:
- Total packages by license type
- New licenses introduced
- Compliance status
- Action items

### Viewing License Reports

```bash
# View latest scan results
cat license-report.json | jq '.Results[]?.Licenses'

# Count by license type
cat license-report.json | jq '[.Results[]?.Licenses // [] | .[] | .Name] | group_by(.) | map({license: .[0], count: length})'
```

## Common Scenarios

### Scenario 1: GPL dependency detected

**Action**: 
1. ❌ **Do not merge**
2. Find MIT/Apache alternative
3. If no alternative exists, escalate to legal

### Scenario 2: LGPL dependency detected

**Action**:
1. ⚠️ **Conditional approval**
2. Verify dynamic linking only
3. Document in architecture docs
4. No source modifications

### Scenario 3: Unknown/Custom license

**Action**:
1. 🔍 **Requires review**
2. Create compliance issue
3. Legal team reviews terms
4. Decision documented

### Scenario 4: Dual-licensed package

**Action**:
1. Choose approved license option
2. Document choice in package notes
3. Ensure build uses correct license

## Tools and Resources

### Scanning Tools Used

- **Trivy**: License detection in source and containers
- **SBOM Tools**: Anchore, CycloneDX
- **GitHub Dependency Graph**: License metadata

### External Resources

- [SPDX License List](https://spdx.org/licenses/)
- [Choose a License](https://choosealicense.com/)
- [OSI Approved Licenses](https://opensource.org/licenses)
- [TLDRLegal](https://tldrlegal.com/)

## Policy Updates

This policy is reviewed quarterly and updated as needed.

**Last Updated**: December 26, 2025  
**Next Review**: March 26, 2026  
**Policy Owner**: Security & Compliance Team

## Contact

For license compliance questions:
- 📧 Email: compliance@craftique.com
- 💬 Slack: #security-compliance
- 🎫 Create Issue: Label with `compliance/license`
