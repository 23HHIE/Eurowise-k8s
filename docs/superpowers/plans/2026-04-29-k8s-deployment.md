# Eurowise K8s Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Eurowise 全栈应用（Spring Boot + React + MySQL）部署到 Docker Desktop Kubernetes，包含 HPA、健康检查、滚动更新和 Prometheus/Grafana 监控。

**Architecture:** 两个 Namespace（`eurowise` 应用层 + `monitoring` 监控层），纯 YAML 无 Helm。MySQL 用 StatefulSet 保证数据持久化，Backend/Frontend 用 Deployment + HPA 弹性伸缩，Prometheus 静态抓取 Backend 指标，Grafana 可视化。

**Tech Stack:** Kubernetes 1.29+（Docker Desktop 内置）、Spring Boot 3、React/Nginx、MySQL 8.0、Prometheus v2.51、Grafana 10.4

---

## 文件结构总览

```
Backend/Eurowise-rest-api-code/
├── pom.xml                          # 修改：添加 actuator + micrometer
├── Dockerfile.multistage            # 修改：Java 17 → Java 21
└── src/main/resources/
    └── application.properties       # 保持不变（K8s 用环境变量覆盖）

k8s/
├── namespace.yaml
├── mysql/
│   ├── secret.yaml
│   ├── statefulset.yaml
│   └── service.yaml
├── backend/
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── frontend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── ingress/
│   └── ingress.yaml
└── monitoring/
    ├── prometheus/
    │   ├── configmap.yaml
    │   ├── deployment.yaml
    │   └── service.yaml
    └── grafana/
        ├── configmap.yaml
        ├── deployment.yaml
        └── service.yaml
```

---

## Task 1: 修复 Backend — 添加 Actuator & Micrometer，修复 Dockerfile

**Files:**
- Modify: `Backend/Eurowise-rest-api-code/pom.xml`
- Modify: `Backend/Eurowise-rest-api-code/Dockerfile.multistage`

### 为什么需要这步
- `/actuator/health` → K8s liveness/readiness probe 端点
- `/actuator/prometheus` → Prometheus 抓取指标端点
- Dockerfile 当前用 Java 17 镜像，但 pom.xml 指定 Java 21，不一致

- [ ] **Step 1: 在 pom.xml 的 `<dependencies>` 块末尾添加两个依赖**

在 `</dependencies>` 前插入：

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>io.micrometer</groupId>
			<artifactId>micrometer-registry-prometheus</artifactId>
		</dependency>
```

- [ ] **Step 2: 修复 Dockerfile.multistage，改为 Java 21**

将文件内容替换为：

```dockerfile
# Stage 1: Build
FROM maven:3.9-amazoncorretto-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 3: 验证 pom.xml 语法正确**

```bash
cd Backend/Eurowise-rest-api-code && mvn validate
```

Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add Backend/Eurowise-rest-api-code/pom.xml Backend/Eurowise-rest-api-code/Dockerfile.multistage
git commit -m "feat: add actuator and prometheus metrics, fix Dockerfile to Java 21"
```

---

## Task 2: 构建 Docker 镜像

**Files:** 无新文件，使用现有 Dockerfile

Docker Desktop K8s 与本地 Docker daemon 共享，所以本地构建的镜像可直接在 K8s 中使用（无需推送 Registry），配合 `imagePullPolicy: Never`。

- [ ] **Step 1: 构建 Backend 镜像**

```bash
cd Backend/Eurowise-rest-api-code
docker build -f Dockerfile.multistage -t eurowise-backend:latest .
```

Expected: `Successfully tagged eurowise-backend:latest`

- [ ] **Step 2: 构建 Frontend 镜像**

```bash
cd Frontend/Expends/expenditure-app
docker build -t eurowise-frontend:latest .
```

Expected: `Successfully tagged eurowise-frontend:latest`

- [ ] **Step 3: 验证镜像存在**

```bash
docker images | grep eurowise
```

Expected:
```
eurowise-frontend   latest   ...
eurowise-backend    latest   ...
```

---

## Task 3: 安装集群前置依赖

**Files:** 无

HPA 依赖 metrics-server 提供 CPU/Memory 数据；Ingress 依赖 nginx ingress controller。

- [ ] **Step 1: 安装 metrics-server**

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

- [ ] **Step 2: 为 metrics-server 禁用 TLS 验证（Docker Desktop 需要）**

```bash
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

- [ ] **Step 3: 安装 nginx ingress controller**

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

- [ ] **Step 4: 等待 ingress controller 就绪**

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

Expected: `pod/ingress-nginx-controller-xxx condition met`

- [ ] **Step 5: 验证 metrics-server 就绪**

```bash
kubectl get deployment metrics-server -n kube-system
```

Expected: `READY 1/1`

---

## Task 4: 创建 Namespace

**Files:**
- Create: `k8s/namespace.yaml`

- [ ] **Step 1: 创建 namespace.yaml**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eurowise
---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
```

- [ ] **Step 2: Dry-run 验证**

```bash
kubectl apply --dry-run=client -f k8s/namespace.yaml
```

Expected:
```
namespace/eurowise created (dry run)
namespace/monitoring created (dry run)
```

- [ ] **Step 3: 应用**

```bash
kubectl apply -f k8s/namespace.yaml
```

- [ ] **Step 4: 验证**

```bash
kubectl get namespaces | grep -E "eurowise|monitoring"
```

Expected:
```
eurowise     Active   ...
monitoring   Active   ...
```

- [ ] **Step 5: Commit**

```bash
git add k8s/namespace.yaml
git commit -m "feat: add k8s namespaces for eurowise and monitoring"
```

---

## Task 5: 部署 MySQL（StatefulSet）

**Files:**
- Create: `k8s/mysql/secret.yaml`
- Create: `k8s/mysql/statefulset.yaml`
- Create: `k8s/mysql/service.yaml`

- [ ] **Step 1: 创建 secret.yaml**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: eurowise
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: rootpassword
  MYSQL_DATABASE: eurowise
  MYSQL_USER: eurowise
  MYSQL_PASSWORD: eurowise123
```

- [ ] **Step 2: 创建 statefulset.yaml**

StatefulSet 的 `volumeClaimTemplates` 会自动创建 PVC，无需单独 pvc.yaml。

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: eurowise
spec:
  selector:
    matchLabels:
      app: mysql
  serviceName: mysql
  replicas: 1
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          ports:
            - containerPort: 3306
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_ROOT_PASSWORD
            - name: MYSQL_DATABASE
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_DATABASE
            - name: MYSQL_USER
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_USER
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_PASSWORD
          livenessProbe:
            exec:
              command:
                - mysqladmin
                - ping
                - -h
                - localhost
                - -u
                - root
                - -prootpassword
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command:
                - mysqladmin
                - ping
                - -h
                - localhost
                - -u
                - root
                - -prootpassword
            initialDelaySeconds: 15
            periodSeconds: 5
          volumeMounts:
            - name: mysql-storage
              mountPath: /var/lib/mysql
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 500m
              memory: 1Gi
  volumeClaimTemplates:
    - metadata:
        name: mysql-storage
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
```

- [ ] **Step 3: 创建 service.yaml**

Headless Service（`clusterIP: None`）是 StatefulSet 的标准配置，让 Pod 可以通过 `mysql-0.mysql.eurowise.svc.cluster.local` 寻址。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: eurowise
spec:
  selector:
    app: mysql
  clusterIP: None
  ports:
    - port: 3306
      targetPort: 3306
```

- [ ] **Step 4: Dry-run 验证**

```bash
kubectl apply --dry-run=client -f k8s/mysql/
```

Expected: 3 行 `created (dry run)`，无错误

- [ ] **Step 5: 应用**

```bash
kubectl apply -f k8s/mysql/
```

- [ ] **Step 6: 等待 MySQL 就绪**

```bash
kubectl rollout status statefulset/mysql -n eurowise --timeout=120s
```

Expected: `statefulset rolling update complete 1 pods at revision mysql-xxx`

- [ ] **Step 7: 验证 Pod 状态**

```bash
kubectl get pods -n eurowise
```

Expected: `mysql-0   2/2   Running   0   ...`（或 `1/1`）

- [ ] **Step 8: Commit**

```bash
git add k8s/mysql/
git commit -m "feat: deploy MySQL StatefulSet with PVC and Secret"
```

---

## Task 6: 部署 Backend（Spring Boot）

**Files:**
- Create: `k8s/backend/configmap.yaml`
- Create: `k8s/backend/deployment.yaml`
- Create: `k8s/backend/service.yaml`
- Create: `k8s/backend/hpa.yaml`

- [ ] **Step 1: 创建 configmap.yaml**

Spring Boot 会将 `SPRING_DATASOURCE_URL` 等环境变量自动映射到对应属性，覆盖 application.properties 中的值。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: eurowise
data:
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql.eurowise.svc.cluster.local:3306/eurowise
  SPRING_DATASOURCE_USERNAME: eurowise
  SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT: org.hibernate.dialect.MySQL8Dialect
  SPRING_JPA_HIBERNATE_DDL_AUTO: update
  MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE: health,prometheus
  MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED: "true"
```

- [ ] **Step 2: 创建 deployment.yaml**

`prometheus.io/*` annotations 让 Prometheus 知道如何抓取该 Pod 的指标。`imagePullPolicy: Never` 使用本地构建的镜像。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: eurowise
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/actuator/prometheus"
        prometheus.io/port: "8080"
    spec:
      containers:
        - name: backend
          image: eurowise-backend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: backend-config
          env:
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_PASSWORD
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 90
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 5
            failureThreshold: 3
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 500m
              memory: 1Gi
```

- [ ] **Step 3: 创建 service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: eurowise
spec:
  selector:
    app: backend
  ports:
    - port: 8080
      targetPort: 8080
```

- [ ] **Step 4: 创建 hpa.yaml**

`autoscaling/v2` 是当前推荐版本，支持多指标。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: eurowise
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

- [ ] **Step 5: Dry-run 验证**

```bash
kubectl apply --dry-run=client -f k8s/backend/
```

Expected: 4 行 `created (dry run)`，无错误

- [ ] **Step 6: 应用**

```bash
kubectl apply -f k8s/backend/
```

- [ ] **Step 7: 等待 Backend 就绪**

```bash
kubectl rollout status deployment/backend -n eurowise --timeout=180s
```

Expected: `deployment "backend" successfully rolled out`

- [ ] **Step 8: 验证 HPA**

```bash
kubectl get hpa -n eurowise
```

Expected: `backend-hpa   Deployment/backend   cpu: <unknown>/70%   1   3   1   ...`（指标需等 metrics-server 收集约 1 分钟）

- [ ] **Step 9: 验证 actuator 端点可达**

```bash
kubectl port-forward deployment/backend 8080:8080 -n eurowise &
curl http://localhost:8080/actuator/health
```

Expected: `{"status":"UP",...}`

```bash
kill %1
```

- [ ] **Step 10: Commit**

```bash
git add k8s/backend/
git commit -m "feat: deploy backend with HPA, health probes, and prometheus annotations"
```

---

## Task 7: 部署 Frontend（React/Nginx）

**Files:**
- Create: `k8s/frontend/deployment.yaml`
- Create: `k8s/frontend/service.yaml`
- Create: `k8s/frontend/hpa.yaml`

- [ ] **Step 1: 创建 deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: eurowise
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: eurowise-frontend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 80
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
```

- [ ] **Step 2: 创建 service.yaml**

ClusterIP（通过 Ingress 对外暴露），不直接 LoadBalancer 以演示 Ingress 路由能力。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: eurowise
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
```

- [ ] **Step 3: 创建 hpa.yaml**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: eurowise
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

- [ ] **Step 4: Dry-run 验证**

```bash
kubectl apply --dry-run=client -f k8s/frontend/
```

Expected: 3 行 `created (dry run)`，无错误

- [ ] **Step 5: 应用并验证**

```bash
kubectl apply -f k8s/frontend/
kubectl rollout status deployment/frontend -n eurowise --timeout=60s
```

Expected: `deployment "frontend" successfully rolled out`

- [ ] **Step 6: Commit**

```bash
git add k8s/frontend/
git commit -m "feat: deploy frontend with HPA and health probes"
```

---

## Task 8: 配置 Ingress

**Files:**
- Create: `k8s/ingress/ingress.yaml`

- [ ] **Step 1: 创建 ingress.yaml**

`rewrite-target` 将 `/api/xxx` 重写为 `/xxx` 再转发给 backend。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eurowise-ingress
  namespace: eurowise
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
    - host: eurowise.local
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend-service
                port:
                  number: 8080
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

- [ ] **Step 2: 添加本地 hosts 记录**

```bash
echo "127.0.0.1 eurowise.local" | sudo tee -a /etc/hosts
```

- [ ] **Step 3: 应用并验证**

```bash
kubectl apply -f k8s/ingress/ingress.yaml
kubectl get ingress -n eurowise
```

Expected: `eurowise-ingress ... eurowise.local ... 80`

- [ ] **Step 4: 测试路由**

```bash
curl http://eurowise.local/api/actuator/health
```

Expected: `{"status":"UP"}`

```bash
curl -I http://eurowise.local/
```

Expected: `HTTP/1.1 200 OK`

- [ ] **Step 5: Commit**

```bash
git add k8s/ingress/
git commit -m "feat: add nginx ingress routing for frontend and backend"
```

---

## Task 9: 部署 Prometheus

**Files:**
- Create: `k8s/monitoring/prometheus/configmap.yaml`
- Create: `k8s/monitoring/prometheus/deployment.yaml`
- Create: `k8s/monitoring/prometheus/service.yaml`

- [ ] **Step 1: 创建 configmap.yaml**

静态 scrape config，直接指向 backend Service 的 FQDN。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'eurowise-backend'
        metrics_path: '/actuator/prometheus'
        static_configs:
          - targets:
              - 'backend-service.eurowise.svc.cluster.local:8080'
```

- [ ] **Step 2: 创建 deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.51.0
          args:
            - --config.file=/etc/prometheus/prometheus.yml
            - --storage.tsdb.retention.time=7d
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 200m
              memory: 512Mi
      volumes:
        - name: config
          configMap:
            name: prometheus-config
```

- [ ] **Step 3: 创建 service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus-service
  namespace: monitoring
spec:
  type: LoadBalancer
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
```

- [ ] **Step 4: 应用并验证**

```bash
kubectl apply -f k8s/monitoring/prometheus/
kubectl rollout status deployment/prometheus -n monitoring --timeout=60s
```

Expected: `deployment "prometheus" successfully rolled out`

- [ ] **Step 5: 验证 Prometheus 可以抓到 backend 指标**

```bash
kubectl port-forward svc/prometheus-service 9090:9090 -n monitoring &
```

打开浏览器 `http://localhost:9090/targets`，应看到 `eurowise-backend` 状态为 `UP`。

```bash
kill %1
```

- [ ] **Step 6: Commit**

```bash
git add k8s/monitoring/prometheus/
git commit -m "feat: deploy Prometheus with static scrape config for backend metrics"
```

---

## Task 10: 部署 Grafana

**Files:**
- Create: `k8s/monitoring/grafana/configmap.yaml`
- Create: `k8s/monitoring/grafana/deployment.yaml`
- Create: `k8s/monitoring/grafana/service.yaml`

- [ ] **Step 1: 创建 configmap.yaml**

`provisioning/datasources` 目录下的文件会被 Grafana 自动加载，免去手动配置。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasource
  namespace: monitoring
data:
  datasource.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-service.monitoring.svc.cluster.local:9090
        isDefault: true
        access: proxy
```

- [ ] **Step 2: 创建 deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.4.0
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_USER
              value: admin
            - name: GF_SECURITY_ADMIN_PASSWORD
              value: admin123
          volumeMounts:
            - name: datasource
              mountPath: /etc/grafana/provisioning/datasources
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      volumes:
        - name: datasource
          configMap:
            name: grafana-datasource
```

- [ ] **Step 3: 创建 service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: grafana-service
  namespace: monitoring
spec:
  type: LoadBalancer
  selector:
    app: grafana
  ports:
    - port: 3000
      targetPort: 3000
```

- [ ] **Step 4: 应用并验证**

```bash
kubectl apply -f k8s/monitoring/grafana/
kubectl rollout status deployment/grafana -n monitoring --timeout=60s
```

Expected: `deployment "grafana" successfully rolled out`

- [ ] **Step 5: 验证 Grafana 登录**

打开浏览器 `http://localhost:3000`，用 `admin / admin123` 登录。

进入 **Connections → Data sources**，应看到 `Prometheus` 已配置为默认数据源，点击 **Test** 显示 `Data source is working`。

- [ ] **Step 6: 导入 JVM 监控 Dashboard**

在 Grafana 中：**Dashboards → Import → Dashboard ID: `4701`**（JVM Micrometer Dashboard），选择 Prometheus 数据源，点击 Import。

应看到 JVM 堆内存、GC、线程等指标图表。

- [ ] **Step 7: Commit**

```bash
git add k8s/monitoring/grafana/
git commit -m "feat: deploy Grafana with Prometheus datasource auto-provisioning"
```

---

## Task 11: 端到端验证

- [ ] **Step 1: 检查所有 Pod 状态**

```bash
kubectl get pods -n eurowise
kubectl get pods -n monitoring
```

Expected: 所有 Pod 状态为 `Running`，无 `CrashLoopBackOff`

- [ ] **Step 2: 检查所有 Service**

```bash
kubectl get svc -n eurowise
kubectl get svc -n monitoring
```

- [ ] **Step 3: 检查 HPA 状态**

```bash
kubectl get hpa -n eurowise
```

Expected: `backend-hpa` 和 `frontend-hpa` 都显示当前副本数和目标值

- [ ] **Step 4: 验证滚动更新（演示用）**

```bash
# 触发一次滚动更新（重新部署同镜像）
kubectl rollout restart deployment/backend -n eurowise
kubectl rollout status deployment/backend -n eurowise
```

Expected: 无停机，新 Pod 就绪后旧 Pod 才退出

- [ ] **Step 5: 最终目录结构确认**

```bash
find k8s/ -name "*.yaml" | sort
```

Expected 输出：
```
k8s/backend/configmap.yaml
k8s/backend/deployment.yaml
k8s/backend/hpa.yaml
k8s/backend/service.yaml
k8s/frontend/deployment.yaml
k8s/frontend/hpa.yaml
k8s/frontend/service.yaml
k8s/ingress/ingress.yaml
k8s/monitoring/grafana/configmap.yaml
k8s/monitoring/grafana/deployment.yaml
k8s/monitoring/grafana/service.yaml
k8s/monitoring/prometheus/configmap.yaml
k8s/monitoring/prometheus/deployment.yaml
k8s/monitoring/prometheus/service.yaml
k8s/mysql/secret.yaml
k8s/mysql/service.yaml
k8s/mysql/statefulset.yaml
k8s/namespace.yaml
```

---

## 访问地址汇总

| 服务 | 地址 | 说明 |
|---|---|---|
| Frontend | http://eurowise.local | 通过 Ingress |
| Backend API | http://eurowise.local/api/ | 通过 Ingress |
| Prometheus | http://localhost:9090 | LoadBalancer |
| Grafana | http://localhost:3000 | LoadBalancer，admin/admin123 |

---

## SRE 面试问答提示

| 问题 | 关键点 |
|---|---|
| 为什么 MySQL 用 StatefulSet？ | 有状态应用需要稳定的 Pod 身份（`mysql-0`）和持久化存储，Deployment 无法保证 |
| Secret 和 ConfigMap 区别？ | Secret base64 编码敏感数据（密码），ConfigMap 存非敏感配置（URL、参数） |
| HPA 怎么工作的？ | metrics-server 采集 CPU，HPA controller 按 averageUtilization 决定扩缩容 |
| 滚动更新如何保证零停机？ | `maxUnavailable: 0` 确保旧 Pod 不提前停止，`maxSurge: 1` 允许多启动一个新 Pod |
| Prometheus 为什么用静态 scrape？ | 简单清晰，生产环境可改为 kubernetes_sd_configs 动态发现 |
