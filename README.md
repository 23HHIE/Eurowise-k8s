# Eurowise — Personal Finance Tracker

A personal project I built to learn Kubernetes and cloud deployment. The app itself is a finance tracker where users can log in, manage their expenses, check currency exchange rates, and read the latest financial news. The main goal was to take an existing Docker Compose setup and deploy it properly on Azure AKS with a real domain, TLS, and automated CI/CD.

**Live:** https://eurowise.online

---

## What the app does

- User registration and login with JWT authentication
- Add, edit, and delete personal expense records
- Live currency exchange rates
- Financial news feed

**Stack:** React + Spring Boot (Java 17) + MySQL 8.0

---

## Architecture

```
GitHub push
    │
    ▼
Azure DevOps Pipeline
(self-hosted agent on Vultr Ubuntu)
    │
    ├── docker buildx build --platform linux/amd64
    ├── docker push → ACR (eurowiseacr)
    └── kubectl apply → AKS
            │
            ▼
    ┌───────────────────────────────────────┐
    │          Azure AKS Cluster            │
    │  namespace: eurowise                  │
    │                                       │
    │  Ingress (nginx)                      │
    │  ├── /api/* → backend-service:8080    │
    │  └── /*    → frontend-service:80      │
    │                                       │
    │  Frontend (React, nginx)              │
    │  Backend  (Spring Boot)               │
    │  MySQL    (StatefulSet + Azure Disk)  │
    └───────────────────────────────────────┘
            │
            ▼
    eurowise.online (TLS via cert-manager + Let's Encrypt)
```

---

## Infrastructure

| Component          | Detail                                                  |
| ------------------ | ------------------------------------------------------- |
| Cloud              | Microsoft Azure (North Europe — Ireland)                |
| Kubernetes         | AKS (1 node, Standard_B2s_v2)                           |
| Container Registry | Azure Container Registry (eurowiseacr)                  |
| CI/CD              | Azure DevOps Pipeline                                   |
| CI/CD Agent        | Self-hosted on Vultr Ubuntu VPS (systemd service)       |
| Domain             | eurowise.online (Namecheap)                             |
| TLS                | cert-manager + Let's Encrypt (auto-renew)               |
| Ingress            | nginx ingress controller                                |
| Secret Management  | Azure Key Vault + CSI driver + Workload Identity        |
| Monitoring         | Prometheus + Grafana (JVM Micrometer dashboard)         |
| Alerting           | Prometheus AlertManager + Slack webhook                 |
| Network Security   | NetworkPolicy (MySQL access restricted to backend only) |
| Deployment         | Helm chart (templated manifests, values-driven config)  |
| Infrastructure     | Terraform (AKS, ACR, Key Vault, Managed Identity as code) |

---

## What I set up

**MySQL** runs as a `StatefulSet` so it gets a stable identity (`mysql-0`) and its data persists through restarts via a `PersistentVolumeClaim` backed by Azure Disk. Using a regular `Deployment` for a database is a bad idea — if the pod restarts with a different name, things break.

**Backend and Frontend** run as `Deployments` with rolling updates. Both have liveness and readiness probes — the backend uses Spring Boot Actuator's `/actuator/health` endpoint.

**HPA** is set up for both backend and frontend, scaling from 1 to 3 replicas when CPU goes above 70%.

**Ingress** routes all traffic through a single nginx controller — `/api/*` goes to the backend, everything else goes to the frontend. Path rewriting strips the `/api` prefix before forwarding to the backend.

**TLS** — cert-manager watches the Ingress annotation `cert-manager.io/cluster-issuer: letsencrypt-prod` and automatically issues and renews Let's Encrypt certificates.

**CI/CD** — Azure DevOps pipeline triggers on every push to `main`. A self-hosted agent on a Vultr Ubuntu server (running as a systemd service) builds `linux/amd64` images, pushes to ACR with a unique BuildId tag, and deploys to AKS. Using BuildId instead of `latest` ensures Kubernetes detects the image change and restarts pods automatically.

**Secret Management** — Grafana admin credentials are stored in Azure Key Vault. AKS retrieves them at pod startup via the Secrets Store CSI driver, authenticated through Workload Identity (no credentials stored in the cluster).

**NetworkPolicy** — MySQL access is restricted to the backend pod only. Any other pod (frontend, prometheus, grafana) attempting to connect to MySQL will time out. Requires enabling `--network-policy azure` on the AKS cluster.

**Monitoring** — Prometheus scrapes JVM and HTTP metrics from the Spring Boot backend every 15 seconds via `/actuator/prometheus` (exposed through Micrometer). Grafana is pre-configured with Prometheus as a datasource via ConfigMap provisioning, with a JVM Micrometer dashboard (ID 4701) for visualising heap memory, GC activity, and thread counts.

**Alerting** — Alert rules are defined in Prometheus (PromQL, stored as a ConfigMap) and evaluated every 15 seconds. When JVM heap memory exceeds 80% for more than 5 minutes, Prometheus forwards the alert to AlertManager, which routes it to Slack via webhook. AlertManager handles deduplication and grouping — repeated alerts are not re-sent until the repeat interval (1 hour). All alerting configuration is code, git-managed, and survives redeployment.

**Helm** — All Kubernetes manifests are templated as a Helm chart under `helm/`. Variable values (image tags, replica counts, resource limits, ingress host) are centralised in `values.yaml`. The CI/CD pipeline passes the build-specific image tag at deploy time via `--set`, removing the need to modify files on every release. `helm template | kubectl apply --dry-run` is used to validate all manifests before deploying.

**Terraform** — All Azure infrastructure (Resource Group, AKS, ACR, Key Vault, Managed Identity, role assignments) is defined as code under `terraform/`. Running `terraform apply` rebuilds the entire cloud infrastructure from scratch. No manual `az` CLI commands needed. Uses the `azurerm` provider with `features {}` block and `data.azurerm_client_config.current` to get the current subscription and tenant IDs.

---

## Things I ran into

**AKS doesn't support Ed25519 SSH keys** — switched to RSA 4096.

**ARM vs amd64 mismatch** — Mac Apple Silicon builds `linux/arm64` images by default. AKS nodes are `linux/amd64`. Fixed with `docker buildx build --platform linux/amd64`.

**Invalid or corrupt jarfile** — the original Dockerfile copied a locally-compiled jar into the image. Cross-platform builds broke the jar. Fixed by switching to `Dockerfile.multistage`, which compiles inside Docker using Maven, with no dependency on local build artifacts.

**ClusterIssuer http01 solver field** — cert-manager v1 changed the field from `class: nginx` to `ingressClassName: nginx`. The old field is silently ignored, causing certificate issuance to hang.

**Submodule vs regular directory** — Backend and Frontend directories were accidentally registered as git submodules (mode `160000`), so their files weren't tracked in the main repo. Azure DevOps cloned the repo and found empty directories. Fixed with `git rm --cached` and re-adding as regular files.

**Azure DevOps no hosted parallelism** — new accounts have no free parallel job quota by default. Used a self-hosted agent on a Vultr Ubuntu VPS instead of waiting for the grant approval.

**NetworkPolicy not enforcing** — applied the manifest but MySQL was still accessible from all pods. The AKS cluster was created without `--network-policy`, so the policy existed but had no effect. Fixed by running `az aks update --network-policy azure`, which triggers a node restart.

**Prometheus DNS resolution failure across namespaces** — Prometheus (in `monitoring` namespace) couldn't resolve `backend-service.eurowise.svc.cluster.local`, causing it to use a stale IP. Fixed by switching the scrape target in the ConfigMap to the backend Service's ClusterIP directly.

**Grafana datasource provisioned via ConfigMap is read-only in UI** — cannot edit the URL in the Grafana interface. Must update the ConfigMap and rollout restart the deployment.

**Grafana Workload Identity federated credential subject mismatch** — created the federated credential with subject `monitoring:grafana` but the pod runs under `monitoring:default` (the default service account). CSI driver silently failed to authenticate. Fixed by recreating the federated credential with the correct subject `system:serviceaccount:monitoring:default`.

**Prometheus rules subPath mount conflict** — mounting a single rules file using `subPath` into a directory already mounted by another volume (`/etc/prometheus`) caused a `not a directory` error at container init. Fixed by mounting the rules ConfigMap to a separate subdirectory (`/etc/prometheus/rules`) without `subPath`.

**Prometheus rule_files glob not matching symlinks** — ConfigMap-mounted files are symlinks (`alerts.yml -> ..data/alerts.yml`). Using an exact path like `/etc/prometheus/rules/alerts.yml` caused Prometheus to silently skip the file. Fixed by using a glob pattern `/etc/prometheus/rules/*.yml`.

**Insufficient CPU after adding AlertManager** — single-node cluster hit 99% CPU requests with AlertManager added. New Prometheus pod stayed Pending. Fixed by reducing Prometheus CPU requests from 100m to 10m (actual usage is minimal on a low-traffic app).

**kubectl port-forward connected to old pod after rollout restart** — changes appeared not to take effect even after restarting the deployment. Root cause was the port-forward was still tunnelling to the old pod. Fixed by restarting the port-forward after rollout.

**Helm cannot import existing resources** — resources created with `kubectl apply` cannot be taken over by Helm directly. Results in `invalid ownership metadata` error. Fixed by deleting the existing resources and reinstalling with Helm.

**Helm upgrade does not restart pods on ConfigMap change** — updating a ConfigMap via `helm upgrade` does not trigger a pod restart automatically. Fixed by running `kubectl rollout restart deployment/<name>` after the upgrade.

**image field with double quotes causes InvalidImageName** — wrapping the image value in quotes (`"{{ .Values.image }}:{{ .Values.tag }}"`) renders the quotes into the image name. Fixed by removing the surrounding quotes from the image field in the template.

**Terraform `skip_service_principle_add_check` typo** — AKS resource had a misspelled argument. Terraform silently ignored it on `plan` but failed on `apply`. Fixed by correcting to `skip_service_principal_aad_check`.

**Terraform `data.azurerm_client_config.current.object_id` returns wrong ID** — when running Terraform locally with `az login`, `current.object_id` returns the service principal object ID used by the Azure CLI, not the actual user object ID. Key Vault role assignment was created for the wrong principal, causing `403 Forbidden`. Fixed by hardcoding the correct user object ID (`az ad signed-in-user show --query id`) as a variable in `variables.tf`.

**Key Vault `403 Forbidden` after Terraform apply** — role assignments take 2–3 minutes to propagate in Azure AD after creation. Attempting to access Key Vault immediately after `terraform apply` results in a permissions error. Fixed by waiting before running `az keyvault secret set`.

**New AKS cluster gets a new ingress IP** — when the cluster was torn down and rebuilt with Terraform, the nginx ingress controller received a different public IP (20.93.50.74). The old DNS A record pointed to the previous IP. Fixed by updating the Namecheap DNS A record to the new IP and waiting for propagation.

**Monitoring pods Pending after Terraform rebuild** — the rebuilt cluster had CSI driver (DaemonSet) and Workload Identity webhook (2 replicas × 100m) that didn't exist in the original cluster. Combined with the existing pods, the single node hit 1892m/1900m CPU requests, leaving only 8m free — not enough to schedule AlertManager (10m) or Grafana (10m). Fixed by reducing Grafana requests from 100m to 10m and backend requests from 200m to 100m. Low-traffic apps use negligible actual CPU; only the scheduler cares about requests.

**Helm upgrade conflict with kubectl-applied resources** — running `helm upgrade` after using `kubectl patch` to fix CPU requests caused a `conflict with "kubectl-client-side-apply"` error. Helm uses server-side apply and refuses to take ownership of fields originally set by kubectl. Fixed by using `kubectl patch` directly for the specific field, or `helm upgrade --force` to force Helm to take full ownership.

**Grafana dashboard lost after cluster rebuild** — Grafana has no PVC, so all dashboard data lives inside the pod. After a Terraform destroy + apply, the pod is recreated and all manually-imported dashboards are gone. The Prometheus datasource is restored automatically via ConfigMap provisioning, but the JVM Micrometer dashboard (ID 4701) must be re-imported manually each time.

---

## Structure

```
├── Backend/Eurowise-rest-api-code/   # Spring Boot API
│   ├── Dockerfile.multistage         # Multi-stage build (Maven inside Docker)
│   └── src/
├── Frontend/Expends/expenditure-app/ # React app
│   ├── Dockerfile
│   └── src/
├── k8s/
│   ├── namespace.yaml
│   ├── clusterissuer.yaml            # Let's Encrypt ClusterIssuer
│   ├── mysql/                        # StatefulSet + Secret + Service + NetworkPolicy
│   ├── backend/                      # Deployment + ConfigMap + Service + HPA
│   ├── frontend/                     # Deployment + Service + HPA
│   ├── ingress/                      # nginx Ingress with TLS
│   └── monitoring/
│       ├── prometheus/               # Deployment + ConfigMap + Service + AlertRules
│       ├── alertmanager/             # Deployment + Service + Secret (Slack webhook)
│       └── grafana/                  # Deployment + ConfigMap + Service + SecretProviderClass
├── helm/                             # Helm chart (templated version of k8s/)
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── backend/                  # Deployment + ConfigMap + Service + HPA
│       ├── frontend/                 # Deployment + Service + HPA
│       ├── mysql/                    # StatefulSet + Service + NetworkPolicy
│       └── ingress/
├── terraform/                        # Azure infrastructure as code
│   ├── main.tf                       # AKS, ACR, Key Vault, Managed Identity, role assignments
│   └── variables.tf                  # Input variables (resource names, location, VM size)
└── AZURE_DEPLOYMENT.md               # Full deployment walkthrough and troubleshooting
```
