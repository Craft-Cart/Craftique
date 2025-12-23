# 1. Provider & Project Setup
terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "google" {
  project = "craftique"
  region  = "us-east1"
}

# 2. Asset Tagging Strategy (Requirement: Asset Management)
locals {
  common_labels = {
    project     = "craftique"
    environment = "production"
    managed_by  = "terraform"
    owner       = "security-team"
  }
}

# 3. Secure VPC Networking
resource "google_compute_network" "vpc" {
  name                    = "craftique-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "craftique-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-east1"
  network       = google_compute_network.vpc.id
  
  # Requirement: Private Google Access for secure internal communication
  private_ip_google_access = true
}

# 4. Governed Secrets Management (Requirement: Secret Management)
resource "google_secret_manager_secret" "db_password" {
  secret_id = "postgres-db-password"
  labels    = local.common_labels

  replication {
    user_managed {
      replicas { location = "us-east1" }
    }
  }
}

# Generate secure random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secret Manager
resource "google_secret_manager_secret_version" "db_password_version" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# 5. Managed PostgreSQL (Cloud SQL)
resource "google_sql_database_instance" "postgres" {
  name             = "craftique-db-instance"
  database_version = "POSTGRES_15"
  region           = "us-east1"
  root_password    = random_password.db_password.result

  settings {
    tier = "db-f1-micro" # Free tier friendly
    ip_configuration {
      ipv4_enabled    = false # No Public IP
      private_network = google_compute_network.vpc.id
    }
    user_labels = local.common_labels
  }
  deletion_protection = false # Set to true for Production
}

# 6. GKE Autopilot Cluster (Requirement: Cloud-Native Security)
resource "google_container_cluster" "primary" {
  name     = "craftique-cluster"
  location = "us-east1"

  enable_autopilot = true
  network          = google_compute_network.vpc.name
  subnetwork       = google_compute_subnetwork.subnet.name

  # Requirement: Guard rails / Infrastructure Governance
  release_channel {
    channel = "REGULAR"
  }

  resource_labels = local.common_labels
}

# 7. IAM: Least Privilege Service Account for GitHub Actions
resource "google_service_account" "github_actions_sa" {
  account_id   = "github-actions-deployer"
  display_name = "Service Account for CI/CD Pipeline"
}