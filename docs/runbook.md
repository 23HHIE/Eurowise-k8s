# Eurowise K8s 操作手册

> 记录从零部署到监控的完整流程，包含踩坑记录和面试要点。

---

## 环境信息

| 项目 | 值 |
|---|---|
| 集群 | Docker Desktop 内置 Kubernetes |
| kubectl context | `docker-desktop` |
| 远程 repo | `git@github.com:23HHIE/Eurowise-k8s.git` |
| Backend 镜像 | `eurowise-backend:latest`（本地构建） |
| Frontend 镜像 | `eurowise-frontend:latest`（本地构建） |

---

## 访问地址

| 服务 | 地址 | 凭据 |
|---|---|---|
| Frontend | http://eurowise.local | — |
| Backend API | http://eurowise.local/api/ | — |
| Actuator Health | http://eurowise.local/api/actuator/health | — |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3000 | admin / admin123 |

---

## 一键部署

Docker Desktop 重启后所有资源丢失，运行以下命令恢复：

```bash
cd /Users/alex/Documents/eurowise
./deploy.sh
```

`deploy.sh` 执行顺序：
1. 切换 kubectl context → `docker-desktop`
2. 安装 metrics-server（HPA 依赖）
3. 安装 nginx ingress controller，打 `ingress-ready=true` node label
4. 创建 namespace（eurowise / monitoring）
5. 部署 MySQL StatefulSet
6. 部署 Backend + Frontend + Ingress
7. 部署 Prometheus + Grafana

**完整耗时约 3-5 分钟。**

---

## 分步部署（手动）

```bash
# 0. 确认 context
kubectl config use-context docker-desktop

# 1. 前置依赖
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
kubectl label node docker-desktop ingress-ready=true --overwrite
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# 2. 应用资源
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/monitoring/prometheus/
kubectl apply -f k8s/monitoring/grafana/

# 3. 验证
kubectl get pods -n eurowise
kubectl get pods -n monitoring
```

---

## 构建镜像

只有代码变更时才需要重新构建。

```bash
# Backend（含 actuator + prometheus metrics）
cd Backend/Eurowise-rest-api-code
docker build -f Dockerfile.multistage -t eurowise-backend:latest .

# Frontend
cd Frontend/Expends/expenditure-app
docker build -t eurowise-frontend:latest .
```

**注意：** Spring Boot 版本为 `3.0.0-M4`，只兼容 Java 17。Dockerfile 固定使用 `maven:3.9-amazoncorretto-17`，pom.xml 里的 `java.version=21` 被 `-Dmaven.compiler.source=17` 覆盖。

---

## Grafana 配置

### 登录
- URL: http://localhost:3000
- 账号: `admin` / `admin123`

### Datasource
自动通过 ConfigMap provisioning 加载，无需手动配置。
路径：`k8s/monitoring/grafana/configmap.yaml`

### 导入 Dashboard

| Dashboard | ID | 用途 |
|---|---|---|
| JVM Micrometer | `4701` | JVM 堆内存、GC、线程 |
| Kubernetes Cluster | `6417` | 集群整体资源概览 |

**导入步骤：**
1. Dashboards → New → Import
2. 输入 ID → Load
3. 选择 Prometheus datasource → Import

---

## 踩坑记录

### 1. ingress-nginx controller 调度失败
**现象：** `FailedScheduling: 0/1 nodes didn't match node affinity`
**原因：** Cloud 版 manifest 要求节点有 `ingress-ready=true` label
**解决：**
```bash
kubectl label node docker-desktop ingress-ready=true --overwrite
```

### 2. ingress-nginx service 是 NodePort 而非 LoadBalancer
**现象：** `curl http://eurowise.local` 无响应
**解决：**
```bash
kubectl patch svc ingress-nginx-controller -n ingress-nginx -p '{"spec":{"type":"LoadBalancer"}}'
```

### 3. port 80 冲突返回空响应
**现象：** `curl: (52) Empty reply from server`
**原因：** `default` namespace 有 18 天前残留的 `frontend-service` LoadBalancer 占用 port 80
**解决：** 删除 default namespace 的旧资源

### 4. Spring Boot 构建失败（Java 版本冲突）
**现象：** `Unsupported class file major version 65`
**原因：** 尝试用 Java 21 构建，但 Spring Boot 3.0.0-M4 Maven 插件只支持 Java 17
**解决：** Dockerfile 固定使用 `maven:3.9-amazoncorretto-17`

### 5. Docker Desktop 重启丢失所有 K8s 资源
**原因：** Docker Desktop 内置 K8s 不持久化资源（仅 PVC 数据保留）
**解决：** 使用 `./deploy.sh` 一键恢复

---

## K8s 资源结构

```
k8s/
├── namespace.yaml              # eurowise + monitoring
├── mysql/
│   ├── secret.yaml             # DB 凭据（base64 编码）
│   ├── statefulset.yaml        # MySQL，含 volumeClaimTemplates
│   └── service.yaml            # Headless Service（clusterIP: None）
├── backend/
│   ├── configmap.yaml          # DB URL、actuator 配置
│   ├── deployment.yaml         # 含 liveness/readiness probe、prometheus annotations
│   ├── service.yaml            # ClusterIP
│   └── hpa.yaml                # CPU 70% 触发扩缩容，1-3 副本
├── frontend/
│   ├── deployment.yaml         # 含 liveness/readiness probe
│   ├── service.yaml            # ClusterIP（通过 Ingress 对外）
│   └── hpa.yaml                # CPU 70% 触发扩缩容，1-3 副本
├── ingress/
│   └── ingress.yaml            # /api/* → backend，/* → frontend
└── monitoring/
    ├── prometheus/
    │   ├── configmap.yaml      # scrape_configs（静态抓取 backend:8080）
    │   ├── deployment.yaml
    │   └── service.yaml        # LoadBalancer:9090
    └── grafana/
        ├── configmap.yaml      # datasource auto-provisioning
        ├── deployment.yaml
        └── service.yaml        # LoadBalancer:3000
```

---

## 待完成

- [ ] GitHub Actions CI/CD（构建镜像 → push Docker Hub → 通知）
- [ ] Grafana Dashboard 截图放 README
- [ ] 写项目 README.md
- [ ] 投 SRE 职位

---

## SRE 面试要点

| 问题 | 回答思路 |
|---|---|
| 为什么 MySQL 用 StatefulSet？ | 有状态应用需要稳定 Pod 身份（`mysql-0`）和持久化存储，Deployment 无法保证 Pod 名称稳定 |
| Secret vs ConfigMap 区别？ | Secret 存敏感数据（base64 编码，可对接 Vault），ConfigMap 存非敏感配置 |
| HPA 怎么工作的？ | metrics-server 采集 CPU，HPA controller 每 15s 评估，按 averageUtilization 决定副本数 |
| 滚动更新如何零停机？ | `maxUnavailable: 0` 旧 Pod 不提前终止，`maxSurge: 1` 允许多启动一个新 Pod，readiness probe 通过后才切流量 |
| Prometheus 为什么静态 scrape？ | 简单清晰，生产环境改为 kubernetes_sd_configs + annotation 过滤实现动态发现 |
| Ingress 作用？ | L7 路由，一个 LoadBalancer 入口分发多个服务，节省云费用，支持 path/host 路由和 TLS 终止 |
