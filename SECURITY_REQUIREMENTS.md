# DevSecOps: Secure Cloud Architecture & Automated Delivery

## 🛡️ Project Overview
This project demonstrates a comprehensive **DevSecOps lifecycle** for a cloud-native application. The goal is to bridge the gap between rapid development and robust security by integrating automated guardrails, infrastructure governance, and a "Shift-Left" security suite into the CI/CD pipeline.

---

## 🏗️ 1. Architecture & Change Management

### Secure Cloud Architecture
Our design utilizes cloud-native security principles to ensure an agile yet governed release cycle. 
* **Agile Release Management:** Supports multi-release weekly cadences through automated validation.
* **Governed Change Management:** Every change is tracked via version control, requiring peer reviews and automated status checks before merging.

### Branching & Merging Guardrails
To prevent unauthorized or insecure code from reaching production, the following repository rules are enforced:
* **Main Branch Protection:** Direct pushes are disabled; all changes require a Pull Request (PR).
* **Mandatory Reviews:** At least one "Code Owner" must approve changes.
* **Status Check Requirements:** All CI security scans (SAST, SCA, etc.) must pass before the "Merge" button is enabled.

---

## 📜 2. Infrastructure as Code (IaC) Governance

Security is baked into our infrastructure through standardized templates and automated checks.

### Security Templating
We provide hardened, pre-approved templates to minimize the attack surface:
* **Dockerfile Templates:** Non-root user execution, multi-stage builds, and minimal base images.
* **Kubernetes Manifests:** Strictly defined ResourceQuotas and NetworkPolicies.
* **Helm Charts:** Standardized security contexts and encrypted secret management.

### Infrastructure Guardrails
* **Automated Validation:** Every IaC change triggers a security linting and configuration scan.
* **Drift Detection:** Automated monitoring to ensure the live environment matches the version-controlled state.

### Infrastructure Security Governance ✅ **IMPLEMENTED**
Comprehensive governance controls enforce least-privilege execution and resource limits:

**Resource Management:**
* **ResourceQuota:** Prevents resource exhaustion with namespace-level CPU/memory limits
  - Default: 4 CPU / 8Gi memory requests, 8 CPU / 16Gi limits
  - Production: 8 CPU / 16Gi requests, 16 CPU / 32Gi limits
  - Limits expensive resources (LoadBalancers, PVCs, pods)

* **LimitRange:** Enforces default resource constraints on all containers
  - Default requests: 100m CPU / 128Mi memory
  - Default limits: 500m CPU / 512Mi memory
  - Maximum allowed: 2 CPU / 4Gi per container
  - Prevents unbounded resource requests

**Security Contexts (CIS Kubernetes Benchmark & NIST 800-190):**
* **Pod-level security:**
  - `runAsNonRoot: true` - Enforces non-root execution (CIS 5.2.5)
  - `runAsUser: 1001` - Explicit non-privileged UID
  - `seccompProfile: RuntimeDefault` - Linux syscall filtering (CIS 5.7.2)

* **Container-level security:**
  - `readOnlyRootFilesystem: true` - Immutable container filesystem (NIST 800-190 4.4.2)
  - `allowPrivilegeEscalation: false` - Blocks setuid binaries (CIS 5.2.1)
  - `capabilities.drop: [ALL]` - Removes all Linux capabilities (CIS 5.2.6)
  - emptyDir volumes for writable directories (/tmp, /app/.cache)

**High Availability:**
* **PodDisruptionBudget:** Maintains minimum replicas during voluntary disruptions
  - Backend/Frontend: `minAvailable: 1` (default), `minAvailable: 2` (production)
  - PostgreSQL: `minAvailable: 1` (ensures database availability)
  - Prevents all pods from being evicted simultaneously during node drains

**Policy Enforcement:**
* **Kyverno ClusterPolicies:** Validates all workloads against security best practices
  - Enforces runAsNonRoot, allowPrivilegeEscalation=false, drop ALL capabilities
  - Blocks privileged containers, hostPath volumes, hostNetwork
  - Requires resource limits and seccomp profiles
  - Audit mode for readOnlyRootFilesystem (warns but doesn't block)

See: `craftique-gitops-manifests/infrastructure/governance/`

---

## 🏷️ 3. Asset Management & Cloud Strategy ✅ **IMPLEMENTED**

Comprehensive **Kubernetes Asset Tagging Strategy** with automated enforcement and cost tracking:

### Standard Kubernetes Labels (app.kubernetes.io/*)
| Label | Description | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `app.kubernetes.io/name` | Application name | `craftique`, `postgres` | Resource grouping |
| `app.kubernetes.io/component` | Component role | `backend`, `frontend`, `database` | Architecture mapping |
| `app.kubernetes.io/part-of` | Parent application | `craftique-ecommerce` | Portfolio management |
| `app.kubernetes.io/managed-by` | Management tool | `argocd`, `helm`, `kubectl` | Automation tracking |
| `app.kubernetes.io/version` | Application version | `1.0.0` | Version tracking |
| `app.kubernetes.io/instance` | Unique instance | `craftique-prod` | Multi-tenancy |

### Governance Labels (craftique.io/*)
| Label | Description | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `craftique.io/owner` | Owning team | `platform-team`, `backend-team` | Accountability |
| `craftique.io/environment` | Deployment stage | `production`, `staging`, `development` | Cost allocation |
| `craftique.io/cost-center` | Financial tracking | `eng-platform`, `eng-backend` | Billing/chargeback |
| `craftique.io/criticality` | Business impact | `critical`, `high`, `medium`, `low` | SLA priority |
| `craftique.io/data-classification` | Data sensitivity | `public`, `internal`, `confidential`, `restricted` | Compliance |
| `craftique.io/compliance` | Regulatory requirements | `pci-dss`, `gdpr`, `hipaa` | Audit trails |
| `craftique.io/backup-policy` | Backup retention | `daily`, `weekly`, `never` | Disaster recovery |
| `craftique.io/monitoring` | Observability status | `enabled`, `disabled` | Prometheus scraping |
| `craftique.io/public-facing` | Internet exposure | `true`, `false` | Security posture |
| `craftique.io/auto-shutdown` | Cost optimization | `enabled`, `disabled` | FinOps automation |

### Policy Enforcement (Kyverno)
**Required labels validated at admission time:**
- All Deployments/StatefulSets MUST have: `app.kubernetes.io/name`, `app.kubernetes.io/component`, `craftique.io/owner`, `craftique.io/environment`, `craftique.io/cost-center`
- Environment values restricted to: `production`, `staging`, `development`
- Owner values restricted to: `platform-team`, `backend-team`, `frontend-team`, `devops-team`, `data-team`
- Cost center values restricted to: `eng-platform`, `eng-backend`, `eng-frontend`, `product-alpha`, `shared-services`
- Database StatefulSets and Secrets MUST specify `craftique.io/data-classification`
- StatefulSets MUST specify `craftique.io/backup-policy`

**Auto-mutation policies:**
- Automatically adds `app.kubernetes.io/part-of: craftique-ecommerce` if missing
- Adds `app.kubernetes.io/managed-by: argocd` for resources in default/production/staging namespaces
- Propagates namespace labels to resources

**Audit policies (warnings only):**
- Recommends `app.kubernetes.io/version` label for version tracking
- Recommends `craftique.io/criticality` for SLA management
- Recommends `craftique.io/public-facing` for LoadBalancer/NodePort services
- Recommends `craftique.io/description` annotation for documentation

### Cost Allocation Reports
**Automated scripts for cost tracking:**
- `validate-labels.sh` - Validates all resources have required labels
- `cost-report.sh` - Generates cost allocation by environment/cost-center/owner (text/CSV/JSON formats)
- `apply-labels.sh` - Emergency label application to existing resources

**Cost tracking queries:**
```bash
# Resources by environment
kubectl get all -A -l craftique.io/environment=production

# Resources by cost center
kubectl get all -A -l craftique.io/cost-center=eng-backend

# Public-facing resources (higher security scrutiny)
kubectl get all -A -l craftique.io/public-facing=true

# Resources requiring daily backups
kubectl get statefulsets,pvc -A -l craftique.io/backup-policy=daily
```

### Secure Decommissioning
* **Automated data wipeout:** Resources with `craftique.io/data-classification=confidential|restricted` trigger secure deletion on removal
* **Access revocation:** Owner teams notified on resource deletion via Kubernetes events
* **Audit trail:** All label changes logged to centralized audit system

See: `craftique-gitops-manifests/infrastructure/governance/ASSET_TAGGING_STRATEGY.md`

---

## 🚀 4. Security Automation Suite (CI/CD)

The pipeline integrates a "Defense in Depth" strategy using the following automated tools:

### Code & Dependency Analysis
* **SAST (Static Analysis Security Testing):** Scans source code for vulnerabilities (e.g., SQL Injection, XSS).
* **SCA (Software Composition Analysis):** Checks for vulnerable third-party libraries and open-source license compliance.
* **License Compliance Scanning:** ✅ **IMPLEMENTED** - Trivy license scanner checks all dependencies against approved license policy. Detects and blocks prohibited licenses (GPL, AGPL, SSPL). See `LICENSE_COMPLIANCE_POLICY.md`.
* **Secrets & PII Scanner:** Prevents hardcoded API keys, passwords, or Personally Identifiable Information from entering the repo.

### Infrastructure & Cloud Scanning
* **IaC Security Scanner:** Analyzes Terraform/CloudFormation for misconfigurations (e.g., open S3 buckets).
* **Cloud Configuration Scanner:** Audits the live cloud environment against CIS Benchmarks.

### Deployment & Runtime
* **DAST (Dynamic Analysis Security Testing):** Performs automated web crawling and attack simulation on the running staging environment.
* **SBOM (Software Bill of Materials):** Dynamically constructs and publishes a `cyclonedx` or `spdx` inventory of all components for every release.

---

## 🎥 5. Live Demonstration Checklist

The following components will be showcased during the live project demonstration:
- [ ] **Pipeline Execution:** A full "git push" to "deploy" flow showing security gate failures and successes.
- [ ] **IaC Hardening:** Evidence of blocked deployments due to insecure K8s/Terraform templates.
- [ ] **Cloud Dashboard:** A view of tagged assets and current security posture/compliance scores.
- [ ] **Security Reports:** Walkthrough of generated SAST, DAST, and SBOM artifacts.

---

## 🛠️ Tech Stack (Suggested)
* **CI/CD:** GitHub Actions / GitLab CI / Jenkins
* **IaC:** Terraform / OpenTofu
* **Security Tools:** * *SAST:* SonarQube / Semgrep
    * *SCA/SBOM:* Snyk / Trivy
    * *Secrets:* Gitleaks / TruffleHog
    * *DAST:* OWASP ZAP