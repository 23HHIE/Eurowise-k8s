# Eurowise AKS 云部署文档

## 整体架构思路

### 目标
把本地 K8s 部署迁移到 Azure AKS，实现完全自动化 CI/CD，GitHub push 后无需手动操作。

### 架构
```
GitHub push
   ↓
GitHub Actions（构建镜像 + 推送 Docker Hub + 自动部署到 AKS）
   ↓
Azure AKS 集群
   ├── Frontend（React）
   ├── Backend（Spring Boot）
   └── MySQL（StatefulSet）
   ↓
Azure Ingress → 用户访问
```

### 对比本地部署
| | 本地 Docker Desktop | Azure AKS |
|---|---|---|
| 镜像来源 | 本地构建 | ACR（Azure Container Registry） |
| 部署触发 | 手动 kubectl rollout | GitHub Actions 自动 |
| 数据库 | SQLite/本地 PVC | MySQL StatefulSet + Azure Disk |
| 访问方式 | /etc/hosts 本地域名 | 公网 IP / 域名 |

---

## 环境说明

- 云平台：Microsoft Azure（北欧数据中心 - 爱尔兰）
- K8s 服务：AKS（Azure Kubernetes Service）
- 镜像仓库：Azure Container Registry（eurowiseacr）
- CI/CD：GitHub Actions
- 资源组：expense-rg

---

## 部署步骤

### 1. 安装 Azure CLI

```bash
brew install azure-cli
```

### 2. 登录 Azure

```bash
az login
# 浏览器会打开，登录 Azure 账号
# 选择默认订阅，按 Enter
```

验证登录：
```bash
az account show
```

### 3. 创建资源组

```bash
az group create --name expense-rg --location northeurope
```

- `expense-rg` — 资源组名字，用来管理所有相关 Azure 资源
- `northeurope` — 爱尔兰数据中心，延迟最低

### 4. 生成 SSH 密钥

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/eurowise-aks -C "eurowise-aks"
```

> 注意：AKS 目前只支持 RSA 格式，不支持 Ed25519。
> 生产环境私钥应存入 Azure Key Vault，不存本地。

### 5. 注册 Azure 服务

```bash
# 注册 AKS
az provider register --namespace Microsoft.ContainerService
az provider show --namespace Microsoft.ContainerService --query registrationState

# 注册 ACR
az provider register --namespace Microsoft.ContainerRegistry
az provider show --namespace Microsoft.ContainerRegistry --query registrationState
```

等到输出 `"Registered"` 再继续。

### 6. 创建 AKS 集群

```bash
az aks create \
  --resource-group expense-rg \
  --name eurowise-aks \
  --node-count 1 \
  --node-vm-size Standard_B2s_v2 \
  --ssh-key-value ~/.ssh/eurowise-aks.pub
```

> `Standard_B2s` 在免费订阅不可用，用 `Standard_B2s_v2`。

### 7. 连接 kubectl 到 AKS

```bash
az aks get-credentials --resource-group expense-rg --name eurowise-aks
```

验证：
```bash
kubectl get nodes
```

### 8. 创建 ACR 并关联 AKS

```bash
# 创建 ACR
az acr create --resource-group expense-rg --name eurowiseacr --sku Basic

# 关联 AKS，让 AKS 可以直接拉 ACR 镜像，无需 imagePullSecret
az aks update --resource-group expense-rg --name eurowise-aks --attach-acr eurowiseacr
```

### 9. K8s Manifests 说明

#### namespace.yaml
```
k8s/namespace.yaml
```
创建两个 namespace：
- `eurowise` — 应用所有资源（frontend、backend、mysql）
- `monitoring` — Prometheus + Grafana

#### mysql/secret.yaml
```
k8s/mysql/secret.yaml
```
存储 MySQL 敏感配置：ROOT_PASSWORD、DATABASE、USER、PASSWORD。
Pod 启动时通过 `secretKeyRef` 注入为环境变量。

#### mysql/service.yaml + mysql/statefulset.yaml
```
k8s/mysql/
```
- `statefulset.yaml` — 用 StatefulSet 部署 MySQL，保证 Pod 名字固定（`mysql-0`），配合 PVC 持久化数据
- `service.yaml` — ClusterIP Service，内部域名 `mysql.eurowise.svc.cluster.local:3306`，backend 通过这个地址连接数据库

#### backend/configmap.yaml
```
k8s/backend/configmap.yaml
```
存储 backend 非敏感配置：
- `SPRING_DATASOURCE_URL` — MySQL 连接地址
- `SPRING_DATASOURCE_USERNAME` — 数据库用户名
- `SPRING_JPA_HIBERNATE_DDL_AUTO: update` — 自动更新数据库 schema
- `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE: health,prometheus` — 暴露健康检查和 Prometheus 监控端点

#### backend/deployment.yaml
```
k8s/backend/deployment.yaml
```
- 从 ACR 拉取 `eurowiseacr.azurecr.io/eurowise-backend:latest`
- 注入 ConfigMap 和 Secret 环境变量
- livenessProbe：90 秒后开始检查（Spring Boot 启动慢）
- readinessProbe：60 秒后开始检查
- resources：requests 250m/512Mi，limits 500m/1Gi

#### backend/service.yaml
```
k8s/backend/service.yaml
```
ClusterIP Service，端口 8080，供 Ingress 转发 `/api` 路由。

#### backend/hpa.yaml
```
k8s/backend/hpa.yaml
```
CPU 超过 70% 自动扩容，1-3 个副本。

#### frontend/deployment.yaml
```
k8s/frontend/deployment.yaml
```
从 ACR 拉取 `eurowiseacr.azurecr.io/eurowise-frontend:latest`，nginx 服务静态文件，端口 80。

#### frontend/service.yaml
```
k8s/frontend/service.yaml
```
ClusterIP Service，端口 80，供 Ingress 转发根路径 `/`。

#### frontend/hpa.yaml
```
k8s/frontend/hpa.yaml
```
CPU 超过 70% 自动扩容，1-3 个副本。

#### ingress/ingress.yaml
```
k8s/ingress/ingress.yaml
```
统一入口，路由规则：
- `/api/*` → backend-service:8080
- `/*` → frontend-service:80

`rewrite-target: /$2` 把路径重写，去掉 `/api` 前缀再转发给 backend。

#### 部署顺序
```
namespace.yaml
→ mysql/（secret → statefulset → service）
→ backend/（configmap → deployment → service → hpa）
→ frontend/（deployment → service → hpa）
→ ingress/
```

### 10. 构建并推送镜像到 ACR

```bash
# 登录 ACR
az acr login --name eurowiseacr

# Backend（指定 amd64 平台，Mac ARM 上构建必须）
cd Backend/Eurowise-rest-api-code
docker buildx build --platform linux/amd64 \
  -t eurowiseacr.azurecr.io/eurowise-backend:latest --push .

# Frontend
cd Frontend
docker buildx build --platform linux/amd64 \
  -t eurowiseacr.azurecr.io/eurowise-frontend:latest --push .
```

> **重要：** Mac Apple Silicon 是 ARM 架构，AKS 节点是 amd64，必须用 `--platform linux/amd64` 指定平台，否则镜像不兼容，报 `no match for platform in manifest`。
> 行业最佳实践是用多阶段构建（multistage build），在 Docker 内编译，不依赖本地 jar 文件。

---

## Troubleshooting 记录

### 问题 1：AKS 不支持 Ed25519 SSH 密钥
**现象：** `az aks create --ssh-key-value` 报错 `The SSH key provided is not a valid RSA public key`
**原因：** AKS 目前只支持 RSA 格式 SSH 密钥
**解决：** 改用 `ssh-keygen -t rsa -b 4096` 生成 RSA 密钥

---

### 问题 2：VM 规格不在免费订阅允许列表
**现象：** `Standard_B2s is not allowed in your subscription`
**原因：** Azure 免费订阅可用的 VM 规格受限
**解决：** 改用 `Standard_B2s_v2`

---

### 问题 3：平台架构不匹配（ARM vs amd64）
**现象：** `no match for platform in manifest: not found`
**原因：** Mac Apple Silicon 是 ARM 架构，本地 build 的镜像是 `linux/arm64`，AKS 节点是 `linux/amd64`
**解决：** 构建时指定平台 `docker buildx build --platform linux/amd64`

---

### 问题 4：jar 文件损坏（Invalid or corrupt jarfile）
**现象：** backend Pod 启动后立即崩溃，日志显示 `Error: Invalid or corrupt jarfile app.jar`
**原因：** 原 Dockerfile 直接 `COPY target/*.jar`，依赖本地编译的 jar，跨平台构建时 jar 文件不兼容
**解决：** 改用 `Dockerfile.multistage`，在 Docker 内部完成编译，不依赖本地 jar

---

### 问题 5：Dockerfile 行内注释导致解析失败
**现象：** `dockerfile parse error on line 3: FROM requires either one or three arguments`
**原因：** `FROM` 指令后面加了行内注释（`# 注释`），Dockerfile 不支持行内注释，注释必须单独一行
**解决：** 删除 `FROM` 和 `RUN` 行末的行内注释

---

### 常用 AKS 命令

```bash
# 查看集群状态
az aks show --resource-group expense-rg --name <cluster-name>

# 获取 kubectl 凭证
az aks get-credentials --resource-group expense-rg --name <cluster-name>

# 查看 Pod 状态
kubectl get pods -n <namespace>

# 查看 Pod 日志
kubectl logs <pod-name> -n <namespace>

# 查看事件
kubectl describe pod <pod-name> -n <namespace>
```

---

## 待完善

- [x] 安装 Azure CLI
- [x] 登录 Azure
- [x] 创建资源组（expense-rg，northeurope）
- [x] 生成 RSA 4096 SSH 密钥（~/.ssh/eurowise-aks）
- [x] 注册 Microsoft.ContainerService
- [x] 创建 AKS 集群（eurowise-aks，Standard_B2s_v2，1 node）
- [x] 连接 kubectl 到 AKS（az aks get-credentials）
- [x] 创建 ACR（eurowiseacr）并关联 AKS
- [x] 构建 backend 镜像推送到 ACR（linux/amd64）
- [x] 构建 frontend 镜像推送到 ACR（linux/amd64）
- [x] 部署 MySQL StatefulSet
- [x] 修复 backend 启动失败（Invalid or corrupt jarfile）→ 改用多阶段构建 Dockerfile.multistage
- [x] 部署 MySQL StatefulSet
- [x] 部署 Backend
- [x] 部署 Frontend
- [x] 安装 ingress-nginx（kubectl apply）
- [x] 配置 Ingress，公网 IP：52.146.152.128
- [x] 购买域名 eurowise.online（Namecheap，关闭 Auto-renew）
- [x] 配置 DNS A 记录指向 AKS IP（52.146.152.128）
- [x] 更新 Ingress host 为 eurowise.online，浏览器可访问

## 下一步路径（按优先级）

1. **TLS/HTTPS** — cert-manager + Let's Encrypt，安全必须
2. **CI/CD** — GitHub Actions 自动部署到 AKS
3. **监控** — 部署 Prometheus + Grafana（项目已有配置）
4. **安全加固** — NetworkPolicy、RBAC、Azure Key Vault
5. **用 Helm 替换 ingress-nginx** — 更接近行业做法

- [x] 配置 TLS/HTTPS（cert-manager + Let's Encrypt，证书自动申请和续期）
- [x] 配置 Azure DevOps CI/CD 自动部署到 AKS（使用 self-hosted agent on Vultr Ubuntu，pipeline 全流程跑通）
- [ ] 部署 Prometheus + Grafana 监控
- [ ] NetworkPolicy、RBAC、Azure Key Vault
- [ ] 用 Helm 替换 ingress-nginx 安装方式

---

## CI/CD — Azure DevOps Pipeline

### Agent 选型：Self-hosted Agent（自用服务器）

**选择原因：**
Azure DevOps 新账户默认没有 Microsoft-hosted agent 并发配额，需要申请免费 grant（等待 1-3 天审核）。
为了立即可用，选择在独立服务器上部署 self-hosted agent。

**行业背景：**
Self-hosted agent 是行业标准做法，常见于：
- 需要访问内网资源的企业环境
- 对构建性能有要求的团队（自控 CPU/内存）
- 大规模 CI/CD 场景（比按分钟付费更经济）

**Agent 服务器信息：**
- 服务器：Vultr VPS（45.77.90.185）
- 系统：Ubuntu
- 角色：执行 pipeline 任务（构建镜像、推送 ACR、kubectl 部署到 AKS）
- 应用仍运行在 AKS，服务器只是"工人"

**Pipeline 流程：**
```
push 代码到 GitHub
    ↓
Azure DevOps 触发 pipeline
    ↓
Vultr 服务器（self-hosted agent）执行：
  - docker buildx build --platform linux/amd64
  - docker push 到 ACR（eurowiseacr）
  - kubectl apply 部署到 AKS
    ↓
应用运行在 Azure AKS（eurowise.online）
```

### Self-hosted Agent 配置步骤

#### 1. 安装依赖
```bash
sudo apt-get update && sudo apt-get install -y docker.io curl

# 安装 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 安装 Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### 2. 下载并配置 Agent
```bash
mkdir ~/azagent && cd ~/azagent
curl -O https://vstsagentpackage.azureedge.net/agent/3.236.1/vsts-agent-linux-x64-3.236.1.tar.gz
tar zxvf vsts-agent-linux-x64-3.236.1.tar.gz
./config.sh
# 填写：Azure DevOps URL、PAT token、Agent pool（Default）、Agent name
```

#### 3. 启动 Agent（后台服务）
```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

#### 4. Pipeline YAML 修改
```yaml
# 使用 self-hosted agent，不用 Microsoft-hosted
pool:
  name: Default   # 而非 vmImage: 'ubuntu-latest'
```
