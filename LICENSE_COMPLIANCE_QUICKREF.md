# License Compliance Quick Reference

## For Developers

### Before Adding a New Dependency

1. **Check the license**:
   ```bash
   npm info <package-name> license
   # or
   pnpm info <package-name> license
   ```

2. **Verify it's approved**:
   - ✅ MIT, Apache-2.0, BSD, ISC → **Safe to use**
   - ⚠️ LGPL, MPL → **Needs review**
   - ❌ GPL, AGPL, SSPL → **NEVER use**

3. **Add the dependency**:
   ```bash
   npm install <package-name>
   ```

4. **Run local license check**:
   ```bash
   # Install trivy locally
   brew install aquasecurity/trivy/trivy  # macOS
   # or download from https://github.com/aquasecurity/trivy/releases
   
   # Scan for licenses
   trivy fs --scanners license .
   ```

### Understanding Scan Results

The pipeline generates a license report in GitHub Actions summary:

```
📋 License Compliance Report
Total Licenses Found: 523

License Types Detected:
- MIT
- Apache-2.0
- BSD-3-Clause
- ISC

⚠️ Restricted/Copyleft Licenses Check
✅ No copyleft licenses detected

License Distribution:
- MIT: 450 package(s)
- Apache-2.0: 45 package(s)
- BSD-3-Clause: 20 package(s)
- ISC: 8 package(s)
```

### Common Scenarios

#### ✅ Scenario: Adding a package with MIT license
```bash
npm install lodash
# ✅ Pipeline will pass - MIT is approved
```

#### ❌ Scenario: Package has GPL license
```bash
npm install some-gpl-package
# ❌ Pipeline will fail/warn
# Action: Find alternative with MIT/Apache-2.0 license
```

#### ⚠️ Scenario: Package has LGPL license
```bash
npm install some-lgpl-library
# ⚠️ Pipeline will warn
# Action: Create issue for compliance review
# Must use as dynamic library only (no modifications)
```

#### 🔍 Scenario: Unknown/Custom license
```bash
npm install custom-package
# 🔍 Pipeline requires manual review
# Action: Create issue with label 'compliance/license'
```

### Finding Alternatives

If a dependency has a prohibited license:

1. **Search for alternatives**:
   ```bash
   npm search <functionality>
   ```

2. **Check license before installing**:
   ```bash
   npm info <alternative-package> license
   ```

3. **Popular alternatives database**:
   - [npm.anvaka.com](https://npm.anvaka.com/) - Visualize dependencies
   - [npms.io](https://npms.io/) - Search with filters
   - [bundlephobia.com](https://bundlephobia.com/) - Check size + license

### Viewing License Reports

#### In CI/CD Pipeline
1. Go to Actions tab
2. Click on latest workflow run
3. Scroll to "📋 License Compliance Report" in summary

#### Download Artifacts
```bash
# Using GitHub CLI
gh run download --name license-compliance-report

# View report
cat license-report.json | jq
```

#### Local Scanning
```bash
# Scan current directory
trivy fs --scanners license --format json --output license.json .

# Pretty print results
cat license.json | jq '.Results[]?.Licenses'

# Count by license type
cat license.json | jq '[.Results[]?.Licenses // [] | .[] | .Name] | group_by(.) | map({license: .[0], count: length})'
```

### Fixing License Violations

If the pipeline fails due to license violations:

1. **Identify the problematic package**:
   - Check the pipeline output
   - Look for ❌ errors in license report

2. **Options**:
   - **Option A**: Remove the dependency and find alternative
   - **Option B**: Request exception (requires legal approval)
   - **Option C**: Implement functionality yourself

3. **Remove the package**:
   ```bash
   npm uninstall <problematic-package>
   ```

4. **Find and install alternative**:
   ```bash
   npm install <alternative-package>
   ```

5. **Re-run checks**:
   ```bash
   trivy fs --scanners license .
   ```

6. **Commit and push**:
   ```bash
   git add package.json package-lock.json
   git commit -m "fix: replace GPL package with MIT alternative"
   git push
   ```

### Requesting License Exception

If no alternative exists:

1. **Create issue**:
   ```
   Title: License Exception Request: <package-name>
   Labels: compliance/license, needs-review
   
   Template:
   - Package: <name>
   - License: <license-type>
   - Purpose: <why it's needed>
   - Alternatives Evaluated: <list>
   - Business Justification: <reason>
   ```

2. **Wait for approval** from compliance team

3. **If approved**, add to whitelist in pipeline:
   ```yaml
   # .github/workflows/security-pipeline.yml
   WHITELISTED_PACKAGES=(
     "package-name"
   )
   ```

### Best Practices

1. **Check licenses before adding** - Don't wait for pipeline to fail
2. **Prefer MIT/Apache-2.0** - Most permissive and compatible
3. **Avoid GPL at all costs** - Viral copyleft license
4. **Document exceptions** - Keep track of why packages were approved
5. **Review updates** - License can change between versions

### Quick Commands

```bash
# Check single package license
npm info <package> license

# List all dependencies with licenses
npm list --depth=0 --json | jq '.dependencies | to_entries[] | {name: .key, license: .value.license}'

# Find packages with specific license
npm list --depth=0 --json | jq '.dependencies | to_entries[] | select(.value.license | contains("GPL")) | .key'

# Scan with trivy
trivy fs --scanners license --format table .

# Generate JSON report
trivy fs --scanners license --format json --output licenses.json .
```

### Getting Help

- 📖 Read: [LICENSE_COMPLIANCE_POLICY.md](LICENSE_COMPLIANCE_POLICY.md)
- 💬 Ask: #security-compliance Slack channel
- 🎫 Issue: Label with `compliance/license`
- 📧 Email: compliance@craftique.com

### Approved License List (Quick Reference)

**Always OK**:
- MIT ✅
- Apache-2.0 ✅
- BSD-2-Clause ✅
- BSD-3-Clause ✅
- ISC ✅
- CC0-1.0 ✅

**Need Review**:
- LGPL-2.1 ⚠️
- LGPL-3.0 ⚠️
- MPL-2.0 ⚠️
- EPL-1.0/2.0 ⚠️

**Never Use**:
- GPL-2.0 ❌
- GPL-3.0 ❌
- AGPL-3.0 ❌
- SSPL-1.0 ❌
- Commons Clause ❌

---

*Last Updated: December 26, 2025*
