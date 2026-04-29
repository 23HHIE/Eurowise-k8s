# Eurowise K8s 部署设计文档

**日期**: 2026-04-29  
**目标**: 将 Eurowise 项目迁移至 Kubernetes，作为 SRE 职位作品集

---

## 项目背景

Eurowise 是一个全栈支出管理应用，原有 Docker Compose 部署方案，现迁移至 Kubernetes。

### 技术栈
| 层级 | 技术 |
|---|---|
| Frontend | React + Nginx (Node 18) |
| Backend | Spring Boot 3 (Java 17) REST API |
| Database | MySQL 8.0 |
| 原部署 | Docker Compose |

---

## 部署环境

- **集群**: Docker Desktop 内置 Kubernetes
- **Manifest 格式**: 纯 YAML（不使用 Helm）
- **现有 Namespace**: default, kube-node-lease, kube-public, kube-system

---

## 架构设计

### Namespace 划分

| Namespace | 用途 |
|---|---|
| `eurowise` | 应用层（MySQL、Backend、Frontend） |
| `monitoring` | 可观测性（Prometheus、Grafana） |

---

### 应用层（eurowise namespace）

#### MySQL
- **资源类型**: StatefulSet（有状态，保证 Pod 身份稳定）
- **存储**: PersistentVolumeClaim 持久化 `/var/lib/mysql`
- **凭据**: Secret 存储数据库密码
- **网络**: ClusterIP Service（仅内部访问）

#### Backend（Spring Boot）
- **资源类型**: Deployment
- **配置**: ConfigMap 存 DB URL 等环境变量，Secret 存密码
- **健康检查**:
  - `livenessProbe`: `/actuator/health` (HTTP GET)
  - `readinessProbe`: `/actuator/health` (HTTP GET)
- **弹性**: HPA（水平自动扩缩容，基于 CPU 使用率）
- **网络**: ClusterIP Service（内部访问）
- **指标暴露**: `/actuator/prometheus`（供 Prometheus 抓取）

#### Frontend（React/Nginx）
- **资源类型**: Deployment
- **健康检查**: `readinessProbe` HTTP GET `/`
- **弹性**: HPA
- **网络**: LoadBalancer Service（对外暴露，Docker Desktop 原生支持）

#### Ingress
- 路由 `/` → Frontend Service
- 路由 `/api` → Backend Service

---

### 监控层（monitoring namespace）

#### Prometheus
- **部署**: Deployment + ConfigMap（scrape config）
- **抓取目标**: Backend `/actuator/prometheus`
- **网络**: ClusterIP Service

#### Grafana
- **部署**: Deployment + ConfigMap（datasource 配置指向 Prometheus）
- **网络**: LoadBalancer Service（浏览器直接访问）

---

## 文件结构

```
k8s/
├── namespace.yaml              # eurowise + monitoring namespace
├── mysql/
│   ├── secret.yaml             # DB 凭据
│   ├── pvc.yaml                # 持久化存储
│   ├── statefulset.yaml
│   └── service.yaml
├── backend/
│   ├── configmap.yaml          # DB URL 等配置
│   ├── deployment.yaml         # 含 liveness/readiness probe
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
    │   ├── configmap.yaml      # scrape_configs
    │   ├── deployment.yaml
    │   └── service.yaml
    └── grafana/
        ├── configmap.yaml      # datasource.yaml
        ├── deployment.yaml
        └── service.yaml
```

---

## 关键设计决策

| 决策 | 原因 |
|---|---|
| MySQL 用 StatefulSet | 有状态应用，保证 Pod 名稳定，便于数据恢复 |
| 不用 Helm | 原始 YAML 面试时更好解释每个资源的作用 |
| 两个 Namespace | 关注点分离，监控与业务解耦 |
| Prometheus 手写 YAML | 清晰展示配置细节，面试友好 |
| Docker Desktop K8s | LoadBalancer 开箱即用，无需额外配置 |

---

## SRE 能力展示点

- [ ] Namespace 隔离
- [ ] StatefulSet + PVC（有状态服务管理）
- [ ] ConfigMap / Secret 配置分离
- [ ] Liveness / Readiness Probe（健康检查）
- [ ] HPA（弹性伸缩）
- [ ] 滚动更新策略（rollingUpdate）
- [ ] Prometheus 指标采集
- [ ] Grafana 可视化监控

---

## 部署命令（规划）

```bash
# 创建 namespace
kubectl apply -f k8s/namespace.yaml

# 部署数据库
kubectl apply -f k8s/mysql/

# 部署后端
kubectl apply -f k8s/backend/

# 部署前端
kubectl apply -f k8s/frontend/

# 配置 Ingress
kubectl apply -f k8s/ingress/

# 部署监控
kubectl apply -f k8s/monitoring/
```
