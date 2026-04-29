#!/bin/bash
set -e

echo "=== Eurowise K8s Deploy ==="

# 1. Switch context
echo "[1/7] Setting kubectl context..."
kubectl config use-context docker-desktop

# 2. Install metrics-server
echo "[2/7] Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]' 2>/dev/null || true

# 3. Install nginx ingress controller
echo "[3/7] Installing nginx ingress controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
kubectl label node docker-desktop ingress-ready=true --overwrite
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# 4. Create namespaces
echo "[4/7] Creating namespaces..."
kubectl apply -f k8s/namespace.yaml

# 5. Deploy MySQL
echo "[5/7] Deploying MySQL..."
kubectl apply -f k8s/mysql/
kubectl rollout status statefulset/mysql -n eurowise --timeout=120s

# 6. Deploy Backend + Frontend
echo "[6/7] Deploying Backend and Frontend..."
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
kubectl rollout status deployment/backend -n eurowise --timeout=180s
kubectl rollout status deployment/frontend -n eurowise --timeout=60s

# 7. Deploy Monitoring
echo "[7/7] Deploying Prometheus and Grafana..."
kubectl apply -f k8s/monitoring/prometheus/
kubectl apply -f k8s/monitoring/grafana/
kubectl rollout status deployment/prometheus -n monitoring --timeout=60s
kubectl rollout status deployment/grafana -n monitoring --timeout=60s

echo ""
echo "=== Deploy Complete ==="
echo "Frontend:   http://eurowise.local"
echo "Backend:    http://eurowise.local/api/"
echo "Prometheus: http://localhost:9090"
echo "Grafana:    http://localhost:3000  (admin / admin123)"
echo ""
echo "Tip: Make sure /etc/hosts has: 127.0.0.1 eurowise.local"
