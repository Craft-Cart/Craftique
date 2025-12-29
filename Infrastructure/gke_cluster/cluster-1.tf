resource "google_container_cluster" "cluster_1" {
  in_transit_encryption_config = "IN_TRANSIT_ENCRYPTION_DISABLED"
  addons_config {
    cloudrun_config {
      disabled = true
    }

    config_connector_config {
      enabled = false
    }

    dns_cache_config {
      enabled = false
    }

    gce_persistent_disk_csi_driver_config {
      enabled = true
    }

    gcp_filestore_csi_driver_config {
      enabled = false
    }

    gcs_fuse_csi_driver_config {
      enabled = false
    }

    gke_backup_agent_config {
      enabled = false
    }

    http_load_balancing {
      disabled = false
    }

    network_policy_config {
      disabled = true
    }
  }

  binary_authorization {
    evaluation_mode = "DISABLED"
  }

  cluster_autoscaling {
    autoscaling_profile = "BALANCED"
  }

  control_plane_endpoints_config {
    ip_endpoints_config {
      enabled = true
    }
  }

  cost_management_config {
    enabled = false
  }

  database_encryption {
    state = "DECRYPTED"
  }

  datapath_provider         = "ADVANCED_DATAPATH"
  default_max_pods_per_node = 110

  default_snat_status {
    disabled = false
  }

  dns_config {
    cluster_dns = "KUBE_DNS"
  }

  enable_shielded_nodes = true

  ip_allocation_policy {
    cluster_secondary_range_name = "gke-cluster-1-pods-ee3cb748"
  }

  location = "us-central1-a"

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  monitoring_config {
    advanced_datapath_observability_config {
      enable_metrics = false
      enable_relay = false
    }

    enable_components = ["SYSTEM_COMPONENTS", "STORAGE", "POD", "DEPLOYMENT", "STATEFULSET", "DAEMONSET", "HPA", "JOBSET", "CADVISOR", "KUBELET", "DCGM"]

    managed_prometheus {
      enabled = true
    }
  }

  name    = "cluster-1"
  network = "projects/craftique-482022/global/networks/default"

  network_policy {
    enabled  = false
    provider = "PROVIDER_UNSPECIFIED"
  }

  networking_mode = "VPC_NATIVE"

  node_config {
    advanced_machine_features {
      threads_per_core = 0
    }

    disk_size_gb = 50
    disk_type    = "pd-balanced"

    ephemeral_storage_local_ssd_config {
      local_ssd_count = 0
    }

    image_type      = "COS_CONTAINERD"
    logging_variant = "DEFAULT"
    machine_type    = "e2-standard-2"

    metadata = {
      disable-legacy-endpoints = "true"
    }

    oauth_scopes = ["https://www.googleapis.com/auth/devstorage.read_only", "https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring", "https://www.googleapis.com/auth/service.management.readonly", "https://www.googleapis.com/auth/servicecontrol", "https://www.googleapis.com/auth/trace.append"]

    resource_labels = {
      goog-gke-node-pool-provisioning-model = "on-demand"
    }

    service_account = "default"

    shielded_instance_config {
      enable_integrity_monitoring = true
    }

    workload_metadata_config {
      mode          = "GKE_METADATA"
    }
  }

  node_pool_defaults {
    node_config_defaults {
      gcfs_config {
        enabled = false
      }

      logging_variant = "DEFAULT"
    }
  }

  node_version = "1.33.5-gke.1308000"

  notification_config {
    pubsub {
      enabled = false
    }
  }


  private_cluster_config {
    master_global_access_config {
      enabled = false
    }
  }

  project = "craftique-482022"

  release_channel {
    channel = "REGULAR"
  }

  resource_labels = {
    managed-by-cnrm = "true"
  }

  security_posture_config {
    mode               = "BASIC"
    vulnerability_mode = "VULNERABILITY_DISABLED"
  }

  service_external_ips_config {
    enabled = false
  }

  subnetwork = "projects/craftique-482022/regions/us-central1/subnetworks/default"

  vertical_pod_autoscaling {
    enabled = false
  }

  workload_identity_config {
    workload_pool = "craftique-482022.svc.id.goog"
  }
}
# terraform import google_container_cluster.cluster_1 craftique-482022/us-central1-a/cluster-1
