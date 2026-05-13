terraform{
    required_providers {
        azurerm = {
            source = "hashicorp/azurerm"
            version = "~> 3.0"
        }
    }
}

provider "azurerm" {
    features {}
}

resource "azurerm_resource_group" "eurowise" {
    name = var.resource_group_name
    location = var.location
}

resource "azurerm_container_registry" "eurowise" {
    name = var.acr_name
    resource_group_name = azurerm_resource_group.eurowise.name
    location = azurerm_resource_group.eurowise.location
    sku = "Basic"
}

resource "azurerm_kubernetes_cluster" "eurowise" {
    name = var.cluster_name
    location = azurerm_resource_group.eurowise.location
    resource_group_name = azurerm_resource_group.eurowise.name
    dns_prefix = "eurowise"

    default_node_pool {
        name = "default"
        node_count = 1
        vm_size = var.node_vm_size
    }

    identity {
        type = "SystemAssigned"
    }

    oidc_issuer_enabled = true
    workload_identity_enabled = true

    network_profile {
        network_plugin = "azure"
        network_policy = "azure"
    }
}

resource "azurerm_role_assignment" "aks_acr" {
    principal_id = azurerm_kubernetes_cluster.eurowise.kubelet_identity[0].object_id
    role_definition_name = "AcrPull"
    scope = azurerm_container_registry.eurowise.id
    skip_service_principal_aad_check = true
}

data "azurerm_client_config" "current"{}

resource "azurerm_key_vault" "eurowise" {
    name = var.keyvault_name
    location = azurerm_resource_group.eurowise.location
    resource_group_name = azurerm_resource_group.eurowise.name
    tenant_id = data.azurerm_client_config.current.tenant_id
    sku_name = "standard"

    enable_rbac_authorization = true
}

resource "azurerm_user_assigned_identity" "eurowise" {
    name = "eurowise-identity"
    location = azurerm_resource_group.eurowise.location
    resource_group_name = azurerm_resource_group.eurowise.name
}

resource "azurerm_role_assignment" "current_user_keyvault" {
    principal_id = azurerm_user_assigned_identity.eurowise.principal_id
    role_definition_name = "Key Vault Secrets Officer"
    scope = azurerm_key_vault.eurowise.id
}