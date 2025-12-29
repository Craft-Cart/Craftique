# Workflow Simulation Folder

Purpose:

- This folder contains safe, non-executable simulation artifacts used for demos.

Guidance:

- Files here are intentionally kept outside of `.github/workflows/` so they
  cannot run as GitHub Actions. They are for demonstration and training only.
- To demo a "shadow devops" attempt in a safe way:
  1. Create a branch and commit these simulation files.
  2. Open a Pull Request targeting `main` and attach the `SECURITY-VIOLATION-SIMULATION` PR template.
  3. Observe branch protection and CODEOWNERS rules prevent merging without proper approval.

DO NOT move or copy commented steps from these files into `.github/workflows/`.
