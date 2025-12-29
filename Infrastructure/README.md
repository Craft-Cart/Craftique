# 🏗️ Craftique Infrastructure

This folder contains the **Infrastructure as Code (IaC)** required to provision the GKE cluster and the core services (Ingress, Security, and Database).

## 📂 Folder Structure
* `cluster-1.tf`: GKE Control Plane configuration.
* `nodepool.tf`: Worker node definitions (Managed Node Pools).
* `Chart.yaml`: Helm dependency list for Ingress-Nginx, Cert-Manager, and PostgreSQL.


## 🛠️ Step 1: Provision the GKE Cluster (Terraform)

### Prerequisites
1. [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed.
2. [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) authenticated.
3. Proper IAM permissions (Project Editor or Owner).

### Execution
```bash
# Initialize Terraform and download Google Provider
terraform init

# Preview changes (The Governance Check)
terraform plan

# Apply changes to Google Cloud
terraform apply

```

> **💡 Tip:** Always check the `plan` output for any "Destroy" actions before typing `yes`.


## ☸️ Step 2: Configure Cluster Services (Helm)

Once the cluster is running, we need to install the core dependencies listed in `Chart.yaml`.

### Prerequisites

1. [Helm CLI](https://helm.sh/docs/intro/install/) installed.
2. Connect to your cluster:
`gcloud container clusters get-credentials cluster-1 --region us-central1-a`

### Execution

```bash
# 1. Add required repositories
helm repo add ingress-nginx [https://kubernetes.github.io/ingress-nginx](https://kubernetes.github.io/ingress-nginx)
helm repo add jetstack [https://charts.jetstack.io](https://charts.jetstack.io)
helm repo add bitnami [https://charts.bitnami.com/bitnami](https://charts.bitnami.com/bitnami)
helm repo update

# 2. Download/Build chart dependencies
helm dependency build

# 3. Install the services
helm install core-services . --namespace default

```

---

## 🛡️ Governance & Security Tips

* **No Manual Changes:** Never modify the GKE cluster via the Google Cloud Console. Always update the `.tf` files and run `terraform apply` to prevent "Configuration Drift."
* **Secrets Management:** The `terraform.tfstate` file contains sensitive info. It is ignored by git. In a team environment, we use a **Remote Backend** (GCS Bucket).
* **Workload Identity:** This cluster uses GKE Workload Identity. Ensure your application Kubernetes Service Accounts (KSA) are linked to Google Service Accounts (GSA) for secure API access.

```

---

### 💡 Pro-Tips for Your Project



1.  **The `.gitignore` is your best friend:** Ensure `.terraform/` and `*.tfstate` are definitely in your `.gitignore`. If you accidentally push the state file to a public repo, anyone can see your internal network IPs and resource IDs.
2.  **Versioning:** In your `Chart.yaml`, you locked the versions (e.g., `version: 4.10.1`). This is excellent for **Governance**. It ensures that if a new, buggy version of Nginx is released, your project won't break automatically.
3.  **Namespace Isolation:** Even though I put `default` in the README example, for real governance, you might want to install `cert-manager` in its own namespace:
    ```bash
    kubectl create namespace cert-manager
    helm install cert-manager jetstack/cert-manager --namespace cert-manager --set installCRDs=true
    ```

**Would you like me to show you how to add "Outputs" to your Terraform code so it automatically prints the command to connect to your cluster after it's built?**

```