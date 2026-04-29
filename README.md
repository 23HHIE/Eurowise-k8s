# Eurowise — Expenditure Tracker on Kubernetes

A full-stack personal finance application deployed on Kubernetes, built as an SRE portfolio project.

Users can log in to track their expenses with full CRUD support, view real-time currency exchange rates, and browse the latest financial news — all backed by a production-grade K8s setup with monitoring.

---

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │           Kubernetes Cluster             │
                        │                                          │
  Browser               │  ┌──────────┐    ┌──────────────────┐  │
    │                   │  │  Ingress │    │   Namespace:      │  │
    │ eurowise.local     │  │  (nginx) │    │   monitoring      │  │
    └──────────────────►│  │          │    │                  │  │
                        │  │ /        │    │  ┌────────────┐  │  │
                        │  │ /api/*   │    │  │ Prometheus │  │  │
                        │  └────┬─────┘    │  └─────┬──────┘  │  │
                        │       │          │        │          │  │
                        │  ┌────▼──────┐  │  ┌─────▼──────┐  │  │
                        │  │ Frontend  │  │  │  Grafana   │  │  │
                        │  │  (React)  │  │  └────────────┘  │  │
                        │  └───────────┘  └──────────────────┘  │
                        │                                          │
                        │  ┌────────────┐   ┌─────────────────┐  │
                        │  │  Backend   │──►│  MySQL          │  │
                        │  │ (Spring    │   │  StatefulSet    │  │
                        │  │  Boot)     │   │  + PVC          │  │
                        │  └────────────┘   └─────────────────┘  │
                        └─────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Nginx |
| Backend | Spring Boot 3 (Java 17), REST API |
| Database | MySQL 8.0 |
| Auth | JWT + Spring Security |
| External APIs | Currency Exchange API, Financial News API |
| Container Runtime | Docker |
| Orchestration | Kubernetes (Docker Desktop) |
| Ingress | nginx ingress controller |
| Monitoring | Prometheus + Grafana |

---

## Kubernetes Setup

### Namespace Structure

| Namespace | Contents |
|---|---|
| `eurowise` | Frontend, Backend, MySQL |
| `monitoring` | Prometheus, Grafana |

### Resources per Component

**MySQL**
- `StatefulSet` — stable Pod identity (`mysql-0`), guaranteed restart behaviour
- `PersistentVolumeClaim` — data survives Pod restarts (via `volumeClaimTemplates`)
- `Secret` — database credentials
- `Service` (Headless) — stable DNS for StatefulSet

**Backend**
- `Deployment` with rolling update (`maxUnavailable: 0`, `maxSurge: 1`)
- `liveness` + `readiness` probes on `/actuator/health`
- `HorizontalPodAutoscaler` — scales 1→3 replicas at 70% CPU
- Prometheus annotations for automatic scraping of `/actuator/prometheus`
- `ConfigMap` for non-sensitive config, `Secret` for DB password

**Frontend**
- `Deployment` with rolling update
- `liveness` + `readiness` probes
- `HorizontalPodAutoscaler` — scales 1→3 replicas at 70% CPU

**Ingress**
- Single entry point on port 80
- `/api/*` → Backend (with path rewrite)
- `/*` → Frontend

**Monitoring**
- Prometheus scrapes backend JVM + HTTP metrics every 15s
- Grafana auto-provisions Prometheus as default datasource via ConfigMap

---

## Monitoring

Grafana dashboards:

| Dashboard | ID | Metrics |
|---|---|---|
| JVM Micrometer | 4701 | Heap/Non-heap memory, GC pause, Threads |
| Kubernetes Cluster | 6417 | Node CPU, Memory, Pod count |

<!-- Add Grafana screenshots here -->

---

## Quick Start

### Prerequisites

- Docker Desktop with Kubernetes enabled
- `kubectl` configured

### 1. Build Images

```bash
# Backend
cd Backend/Eurowise-rest-api-code
docker build -f Dockerfile.multistage -t eurowise-backend:latest .

# Frontend
cd Frontend/Expends/expenditure-app
docker build -t eurowise-frontend:latest .
```

### 2. Deploy

```bash
./deploy.sh
```

The script installs metrics-server, nginx ingress controller, and deploys all services in the correct order.

### 3. Add hosts entry

```bash
echo "127.0.0.1 eurowise.local" | sudo tee -a /etc/hosts
```

### 4. Access

| Service | URL |
|---|---|
| Application | http://eurowise.local |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

---

## Project Structure

```
├── Backend/
│   └── Eurowise-rest-api-code/     # Spring Boot REST API
├── Frontend/
│   └── Expends/expenditure-app/    # React app
├── k8s/
│   ├── namespace.yaml
│   ├── mysql/                      # StatefulSet, Secret, Service
│   ├── backend/                    # Deployment, ConfigMap, HPA
│   ├── frontend/                   # Deployment, HPA
│   ├── ingress/                    # nginx Ingress rules
│   └── monitoring/
│       ├── prometheus/             # Deployment, ConfigMap (scrape config)
│       └── grafana/                # Deployment, ConfigMap (datasource)
├── deploy.sh                       # One-command full deployment
└── docs/
    └── superpowers/
        ├── specs/                  # Architecture design doc
        └── plans/                  # Implementation plan
```

---

## SRE Highlights

- **Zero-downtime deployments** — rolling update strategy with `maxUnavailable: 0`
- **Auto-scaling** — HPA scales backend and frontend based on CPU utilisation
- **Health checks** — liveness and readiness probes prevent traffic to unhealthy pods
- **Stateful data management** — MySQL on StatefulSet with persistent storage
- **Config/secret separation** — ConfigMaps for app config, Secrets for credentials
- **Observability** — Prometheus metrics + Grafana dashboards out of the box
- **Single ingress entry point** — path-based routing, cloud-ready for TLS termination
