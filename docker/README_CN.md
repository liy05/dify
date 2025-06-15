# Dify Docker 部署指南

## 前置条件

在开始之前，请确保您的系统已安装以下软件：
- Docker（版本 20.10.0 或更高）
- Docker Compose（版本 2.0.0 或更高）

## 快速开始

1. **克隆代码仓库**
```bash
git clone https://github.com/langgenius/dify.git
cd dify
```

2. **配置环境变量**
```bash
cd docker
cp .env.example .env
```
编辑 `.env` 文件配置环境变量。主要配置项包括：
- 数据库设置
- Redis 设置
- 向量数据库设置
- 存储设置
- API 和 Web 服务 URL

3. **启动服务**
```bash
docker compose up -d
```

4. **访问应用**
- Web 控制台：http://localhost
- API 服务：http://localhost/api

## Docker 镜像构建

如果需要自定义构建过程，可以本地构建 Docker 镜像：

1. **构建 Web 镜像**
```bash
cd web
docker build -t rayfire/dify-web:rayfire1.4.2 .
```

2. **构建 API 镜像**
```bash
cd api
docker build -t rayfire/dify-api:rayfire1.4.2 .
```

## Docker 镜像导出和导入

### 导出镜像

**推荐使用 -o 参数的方式导出镜像，避免文件格式问题**

1. **导出 Web 镜像**
```bash
# 推荐方式：使用 -o 参数导出镜像到文件
docker save rayfire/dify-web:rayfire1.4.2 -o dify-web-rayfire1.4.2.tar

# 压缩导出（推荐，文件更小）
docker save rayfire/dify-web:rayfire1.4.2 | gzip > dify-web-rayfire1.4.2.tar.gz

# 验证导出文件
tar -tf dify-web-rayfire1.4.2.tar | head -5
```

2. **导出 API 镜像**
```bash
# 推荐方式：使用 -o 参数导出镜像到文件
docker save rayfire/dify-api:rayfire1.4.2 -o dify-api-rayfire1.4.2.tar

# 压缩导出（推荐，文件更小）
docker save rayfire/dify-api:rayfire1.4.2 | gzip > dify-api-rayfire1.4.2.tar.gz

# 验证导出文件
tar -tf dify-api-rayfire1.4.2.tar | head -5
```

3. **导出所有相关镜像**
```bash
# 一次性导出多个镜像
docker save rayfire/dify-web:rayfire1.4.2 rayfire/dify-api:rayfire1.4.2 -o dify-complete-rayfire1.4.2.tar
```

### 导入镜像

1. **导入 Web 镜像**
```bash
# 方式1：使用 -i 参数导入
docker load -i dify-web-rayfire1.4.2.tar

# 方式2：使用重定向导入
docker load < dify-web-rayfire1.4.2.tar

# 导入压缩的镜像文件
gunzip -c dify-web-rayfire1.4.2.tar.gz | docker load
```

2. **导入 API 镜像**
```bash
# 方式1：使用 -i 参数导入
docker load -i dify-api-rayfire1.4.2.tar

# 方式2：使用重定向导入
docker load < dify-api-rayfire1.4.2.tar

# 导入压缩的镜像文件
gunzip -c dify-api-rayfire1.4.2.tar.gz | docker load
```

### 验证镜像

导入完成后，可以使用以下命令验证镜像是否成功导入：

```bash
# 查看所有镜像
docker images | grep rayfire

# 应该能看到类似输出：
# rayfire/dify-web    rayfire1.4.2    xxxxxxxx    xxxx MB    xxxx ago
# rayfire/dify-api    rayfire1.4.2    xxxxxxxx    xxxx MB    xxxx ago
```

### 注意事项

1. **存储空间**
   - 导出镜像前确保有足够的磁盘空间
   - 建议使用 gzip 压缩以节省空间
   - 导出完成后及时清理不需要的镜像文件

2. **网络传输**
   - 如果需要在不同机器间传输，建议使用压缩格式
   - 可以使用 scp、rsync 等工具传输镜像文件
   - 确保传输过程中文件完整性

3. **版本管理**
   - 建议在文件名中包含版本号
   - 保留重要版本的镜像备份
   - 定期清理旧版本的镜像文件

4. **安全考虑**
   - 镜像文件可能包含敏感信息
   - 传输时注意网络安全
   - 存储时注意访问权限控制

## Docker Compose 服务说明

`docker-compose.yaml` 文件包含以下服务：

1. **Web 服务**
   - 前端应用
   - Nginx 服务器
   - 静态文件服务

2. **API 服务**
   - 后端 API 服务器
   - Celery 工作进程
   - 任务队列管理

3. **数据库服务**
   - PostgreSQL（带 pgvector 扩展）
   - Redis 缓存
   - 向量数据库（Weaviate/Milvus/OpenSearch）

4. **其他服务**
   - Certbot（SSL 证书管理）
   - OpenTelemetry 收集器
   - SSRF 代理

## 环境变量配置

`.env` 文件中的关键环境变量：

```bash
# API 配置
CONSOLE_API_URL=http://localhost/api
SERVICE_API_URL=http://localhost/api
APP_WEB_URL=http://localhost

# 数据库配置
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_HOST=db
DB_PORT=5432
DB_DATABASE=dify

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# 向量数据库配置
VECTOR_STORE=weaviate  # 选项：weaviate, milvus, opensearch
WEAVIATE_ENDPOINT=http://weaviate:8080

# 存储配置
STORAGE_TYPE=local  # 选项：local, s3, azure, gcs
```

## 生产环境部署建议

在生产环境部署时，请注意以下几点：

1. **安全性**
   - 使用强密码
   - 启用 SSL/TLS
   - 配置适当的防火墙规则
   - 设置正确的访问控制

2. **性能优化**
   - 配置适当的资源限制
   - 设置合适的缓存策略
   - 优化数据库设置

3. **监控**
   - 启用 OpenTelemetry
   - 设置日志记录
   - 配置健康检查

4. **备份**
   - 定期数据库备份
   - 卷备份
   - 配置文件备份

## 常见问题排查

1. **容器启动问题**
```bash
# 查看容器日志
docker compose logs [服务名称]

# 查看容器状态
docker compose ps
```

2. **数据库连接问题**
```bash
# 查看数据库日志
docker compose logs db

# 测试数据库连接
docker compose exec db psql -U postgres -d dify
```

3. **API 服务问题**
```bash
# 查看 API 日志
docker compose logs api

# 重启 API 服务
docker compose restart api
```

## 其他资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Dify 官方文档](https://docs.dify.ai)

## 注意事项

1. **数据持久化**
   - 确保重要数据存储在 Docker 卷中
   - 定期备份数据
   - 监控存储空间使用情况

2. **网络配置**
   - 确保容器间网络通信正常
   - 配置适当的端口映射
   - 考虑使用 Docker 网络隔离

3. **资源管理**
   - 监控容器资源使用情况
   - 设置合理的资源限制
   - 定期清理未使用的镜像和容器

4. **安全建议**
   - 定期更新 Docker 和镜像
   - 使用非 root 用户运行容器
   - 限制容器权限
   - 启用 Docker 安全特性

## 更新和维护

1. **更新服务**
```bash
# 拉取最新代码
git pull

# 重新构建并启动服务
docker compose down
docker compose up -d --build
```

2. **清理系统**
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理未使用的网络
docker network prune
```

3. **日志管理**
```bash
# 查看所有服务的日志
docker compose logs -f

# 查看特定服务的日志
docker compose logs -f [服务名称]

# 清理日志
docker compose logs --tail=1000 > logs.txt
```

## 故障排除指南

1. **服务无法启动**
   - 检查环境变量配置
   - 验证端口占用情况
   - 检查日志输出

2. **性能问题**
   - 检查资源使用情况
   - 优化数据库查询
   - 调整缓存配置

3. **连接问题**
   - 检查网络配置
   - 验证防火墙设置
   - 测试服务连通性

4. **数据问题**
   - 检查数据库连接
   - 验证数据备份
   - 检查存储权限

## 最佳实践

1. **开发环境**
   - 使用 docker-compose.override.yml 进行本地开发配置
   - 启用调试模式
   - 使用开发工具和插件

2. **测试环境**
   - 使用独立的测试数据库
   - 配置自动化测试
   - 模拟生产环境配置

3. **生产环境**
   - 使用生产级别的配置
   - 启用所有安全特性
   - 配置监控和告警
   - 实施备份策略

## 贡献指南

如果您发现任何问题或有改进建议，请：

1. 在 GitHub 上提交 Issue
2. 提交 Pull Request
3. 更新文档
4. 添加测试用例

## 支持

如果您需要帮助，可以：

1. 查看官方文档
2. 在 GitHub 上提交 Issue
3. 加入社区讨论
4. 联系技术支持 