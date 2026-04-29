# Eurowise — Personal Finance Tracker

A personal project I built to learn Kubernetes. The app itself is a finance tracker where users can log in, manage their expenses, check currency exchange rates, and read the latest financial news. The main goal was to take an existing Docker Compose setup and figure out how to run it properly on Kubernetes with real monitoring.

---

## What the app does

- User registration and login with JWT authentication
- Add, edit, and delete personal expense records
- Live currency exchange rates
- Financial news feed

**Stack:** React + Spring Boot (Java 17) + MySQL 8.0

---

## Why Kubernetes

The app originally ran with `docker-compose up`. I wanted to understand what it actually takes to run something on K8s — not just apply a few YAML files, but think about how different components should be deployed, how to handle config and secrets properly, how to set up health checks, and how to get some visibility into what's running.

---

## What I set up

```
                   ┌─────────────────────────────────────────┐
                   │           Kubernetes Cluster             │
                   │                                          │
 Browser           │  ┌──────────┐    ┌──────────────────┐  │
   │               │  │  Ingress │    │   monitoring      │  │
   │ eurowise.local│  │  (nginx) │    │                  │  │
   └──────────────►│  │ /        │    │  ┌────────────┐  │  │
                   │  │ /api/*   │    │  │ Prometheus │  │  │
                   │  └────┬─────┘    │  └─────┬──────┘  │  │
                   │       │          │        │          │  │
                   │  ┌────▼──────┐  │  ┌─────▼──────┐  │  │
                   │  │ Frontend  │  │  │  Grafana   │  │  │
                   │  │  React    │  │  └────────────┘  │  │
                   │  └───────────┘  └──────────────────┘  │
                   │  ┌────────────┐   ┌─────────────────┐  │
                   │  │  Backend   │──►│  MySQL          │  │
                   │  │ Spring Boot│   │  StatefulSet    │  │
                   │  └────────────┘   └─────────────────┘  │
                   └─────────────────────────────────────────┘
```

**Namespaces:** `eurowise` (app) and `monitoring` (Prometheus + Grafana)

**MySQL** runs as a `StatefulSet` so it gets a stable identity (`mysql-0`) and its data persists through restarts via a `PersistentVolumeClaim`. I learned that using a regular `Deployment` for a database is a bad idea — if the pod restarts with a different name, things break.

**Backend and Frontend** run as `Deployments` with rolling updates configured so there's no downtime during redeploys (`maxUnavailable: 0`). Both have liveness and readiness probes — the backend uses Spring Boot Actuator's `/actuator/health` endpoint.

**HPA** is set up for both backend and frontend, scaling from 1 to 3 replicas when CPU goes above 70%. This required installing `metrics-server` separately since Docker Desktop doesn't include it.

**Ingress** routes all traffic through a single nginx controller — `/api/*` goes to the backend, everything else goes to the frontend.

**Monitoring** — Prometheus scrapes JVM and HTTP metrics from the backend every 15 seconds via `/actuator/prometheus`. Grafana is pre-configured with Prometheus as a datasource through a ConfigMap so there's no manual setup needed after deploy.

*(Grafana screenshots — add after first run)*

---

## Things I ran into

**Java version mismatch** — the pom.xml said Java 21 but the Spring Boot 3.0.0-M4 Maven plugin doesn't support it. Spent a while figuring out why the Docker build kept failing with `Unsupported class file major version 65`. Fixed by keeping the Dockerfile on Java 17.

**Ingress controller not scheduling** — the nginx ingress cloud manifest requires a node label `ingress-ready=true` that Docker Desktop doesn't add automatically. The pod sat in `Pending` with a node affinity error until I figured that out.

**Port 80 conflict** — after getting ingress working, requests still returned an empty response. Eventually found that a `frontend-service` LoadBalancer from an older deployment in the `default` namespace was already holding port 80, so the ingress controller couldn't bind to it.

**Everything disappears on restart** — Docker Desktop's built-in Kubernetes doesn't persist resources across restarts. Wrote `deploy.sh` to bring the whole stack back up in one command.

---

## Running it locally

**Requirements:** Docker Desktop with Kubernetes enabled

```bash
# 1. Add hosts entry (one-time setup)
echo "127.0.0.1 eurowise.local" | sudo tee -a /etc/hosts

# 2. Build images
cd Backend/Eurowise-rest-api-code
docker build -f Dockerfile.multistage -t eurowise-backend:latest .

cd Frontend/Expends/expenditure-app
docker build -t eurowise-frontend:latest .

# 3. Deploy everything
cd eurowise
./deploy.sh
```

| Service | URL |
|---|---|
| App | http://eurowise.local |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (credentials in `k8s/monitoring/grafana/deployment.yaml`) |

---

## Structure

```
├── Backend/Eurowise-rest-api-code/   # Spring Boot API
├── Frontend/Expends/expenditure-app/ # React app
├── k8s/
│   ├── namespace.yaml
│   ├── mysql/          # StatefulSet + Secret + Headless Service
│   ├── backend/        # Deployment + ConfigMap + HPA
│   ├── frontend/       # Deployment + HPA
│   ├── ingress/        # nginx routing rules
│   └── monitoring/
│       ├── prometheus/ # Deployment + scrape config
│       └── grafana/    # Deployment + datasource provisioning
└── deploy.sh           # Full stack deployment script
```
