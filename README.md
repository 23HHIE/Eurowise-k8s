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

| Component | Detail |
|---|---|
| Cloud | Microsoft Azure (North Europe — Ireland) |
| Kubernetes | AKS (1 node, Standard_B2s_v2) |
| Container Registry | Azure Container Registry (eurowiseacr) |
| CI/CD | Azure DevOps Pipeline |
| CI/CD Agent | Self-hosted on Vultr Ubuntu VPS |
| Domain | eurowise.online (Namecheap) |
| TLS | cert-manager + Let's Encrypt (auto-renew) |
| Ingress | nginx ingress controller |

---

## What I set up

**MySQL** runs as a `StatefulSet` so it gets a stable identity (`mysql-0`) and its data persists through restarts via a `PersistentVolumeClaim` backed by Azure Disk. Using a regular `Deployment` for a database is a bad idea — if the pod restarts with a different name, things break.

**Backend and Frontend** run as `Deployments` with rolling updates so there's no downtime during redeploys (`maxUnavailable: 0`). Both have liveness and readiness probes — the backend uses Spring Boot Actuator's `/actuator/health` endpoint.

**HPA** is set up for both backend and frontend, scaling from 1 to 3 replicas when CPU goes above 70%.

**Ingress** routes all traffic through a single nginx controller — `/api/*` goes to the backend, everything else goes to the frontend. Path rewriting strips the `/api` prefix before forwarding to the backend.

**TLS** — cert-manager watches the Ingress annotation `cert-manager.io/cluster-issuer: letsencrypt-prod` and automatically issues and renews Let's Encrypt certificates.

**CI/CD** — Azure DevOps pipeline triggers on every push to `main`. A self-hosted agent on a Vultr Ubuntu server builds `linux/amd64` images (required because the dev machine is Apple Silicon), pushes to ACR, and deploys to AKS via `kubectl apply`.

---

## Things I ran into

**AKS doesn't support Ed25519 SSH keys** — switched to RSA 4096.

**ARM vs amd64 mismatch** — Mac Apple Silicon builds `linux/arm64` images by default. AKS nodes are `linux/amd64`. Fixed with `docker buildx build --platform linux/amd64`.

**Invalid or corrupt jarfile** — the original Dockerfile copied a locally-compiled jar into the image. Cross-platform builds broke the jar. Fixed by switching to `Dockerfile.multistage`, which compiles inside Docker using Maven, with no dependency on local build artifacts.

**Dockerfile inline comments** — `FROM` lines with inline comments (`FROM image # comment`) cause a parse error. Comments must be on their own line.

**ClusterIssuer http01 solver field** — cert-manager v1 changed the field from `class: nginx` to `ingressClassName: nginx`. The old field is silently ignored, causing certificate issuance to hang.

**Submodule vs regular directory** — Backend and Frontend directories were accidentally registered as git submodules (mode `160000`), so their files weren't tracked in the main repo. Azure DevOps cloned the repo and found empty directories. Fixed with `git rm --cached` and re-adding as regular files.

**Azure DevOps no hosted parallelism** — new accounts have no free parallel job quota by default. Used a self-hosted agent on a Vultr Ubuntu VPS instead of waiting for the grant approval.

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
│   ├── mysql/                        # StatefulSet + Secret + Service
│   ├── backend/                      # Deployment + ConfigMap + Service + HPA
│   ├── frontend/                     # Deployment + Service + HPA
│   ├── ingress/                      # nginx Ingress with TLS
│   └── monitoring/
│       ├── prometheus/
│       └── grafana/
└── AZURE_DEPLOYMENT.md               # Full deployment walkthrough and troubleshooting
```
