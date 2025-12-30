#resource "google_container_node_pool" "test-pool"{
#  name       = "test-pool"      # Unique name in GCP
#  cluster    = google_container_cluster.cluster_1.name 
#  location   = "us-central1-a" 
#
#  management {
#    auto_repair  = true
#    auto_upgrade = true
#  }
#
#  max_pods_per_node = 110
#
#  network_config {
#    pod_range           = "gke-cluster-1-pods-ee3cb748"
#  }
#
#  node_config {
#    advanced_machine_features {
#      threads_per_core = 0
#    }
#
#    disk_size_gb = 50
#    disk_type    = "pd-balanced"
#
#    ephemeral_storage_local_ssd_config {
#      local_ssd_count = 0
#    }
#
#    image_type      = "COS_CONTAINERD"
#    logging_variant = "DEFAULT"
#    machine_type    = "e2-medium"
#
#    metadata = {
#      disable-legacy-endpoints = "true"
#    }
#
#    oauth_scopes = ["https://www.googleapis.com/auth/devstorage.read_only", "https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring", "https://www.googleapis.com/auth/service.management.readonly", "https://www.googleapis.com/auth/servicecontrol", "https://www.googleapis.com/auth/trace.append"]
#
#    resource_labels = {
#      goog-gke-node-pool-provisioning-model = "on-demand"
#    }
#
#    service_account = "default"
#
#    shielded_instance_config {
#      enable_integrity_monitoring = true
#    }
#
#    workload_metadata_config {
#      mode          = "GKE_METADATA"
#    }
#  }
#
#  node_count     = 1
#  node_locations = ["us-central1-a"]
#  project        = "craftique-482022"
#
#  upgrade_settings {
#    max_surge = 1
#    strategy  = "SURGE"
#  }
#
#  version = "1.33.5-gke.1308000"
#}
# terraform import google_container_node_pool.default_pool craftique-482022/us-central1-a/cluster-1/default-pool
