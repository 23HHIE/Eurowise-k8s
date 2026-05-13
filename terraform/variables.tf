variable "resource_group_name" {
    default = "expense-rg"
}

variable "location" {
    default = "northeurope"
}

variable "cluster_name" {
    default = "eurowise-aks"
}

variable "acr_name" {
    default = "eurowiseacr"
}

variable "keyvault_name" {
    default = "eurowise-kv"
}

variable "node_vm_size" {
    default = "Standard_B2s_v2"
}