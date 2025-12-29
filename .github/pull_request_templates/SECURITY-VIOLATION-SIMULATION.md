# SECURITY-VIOLATION: Attempt to Disable Automated Security Gates in CI/CD

This PR template is a safe simulation for demo purposes only. Do NOT apply
these changes to active workflows in `.github/workflows/`.

---

Description:

Temporarily disabling slow security scans to meet the Friday deployment deadline.

Rationale (simulated):

- Developer claim: "Scans are slowing us down; we need to ship by Friday."

Requested change (simulated):

- Comment out or delete steps related to `SAST Scanning`, `Snyk Vulnerability Scan`, and `Secrets Detection` in CI workflows.

Security / Governance notes (for reviewers):

- This is a simulation of a "Shadow DevOps" attempt. Per our Governed Change Management,
  changes to CI/CD workflows require explicit approval from Code Owners and Security.
- Do NOT merge without Security/DevOps approval. This PR demonstrates that branch protection
  and CODEOWNERS review are required to accept such changes.
