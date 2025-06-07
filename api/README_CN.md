# Dify 后端 API

## 使用说明

> [!重要提示]
> 
> 在 v1.3.0 版本中，我们将包管理器从 `poetry` 更换为
> [`uv`](https://docs.astral.sh/uv/)。

1. 启动 docker-compose 服务栈

   后端需要一些中间件服务，包括 PostgreSQL、Redis 和 Weaviate，这些可以通过 `docker-compose` 一起启动。

   ```bash
   cd ../docker
   cp middleware.env.example middleware.env
   # 如果你不使用 weaviate，请将配置文件更改为其他向量数据库
   docker compose -f docker-compose.middleware.yaml --profile weaviate -p dify up -d
   cd ../api
   ```

2. 复制 `.env.example` 到 `.env`

   ```bash
   cp .env.example .env 
   ```

3. 在 `.env` 文件中生成 `SECRET_KEY`

   Linux 系统：
   ```bash
   sed -i "/^SECRET_KEY=/c\SECRET_KEY=$(openssl rand -base64 42)" .env
   ```
   Mac 系统：
   ```bash
   secret_key=$(openssl rand -base64 42)
   sed -i '' "/^SECRET_KEY=/c\\
   SECRET_KEY=${secret_key}" .env
   ```
   Windows 系统：
   ```powershell
   # 使用 PowerShell
   $bytes = New-Object Byte[] 42
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   $secret_key = [Convert]::ToBase64String($bytes)
   (Get-Content .env) -replace '^SECRET_KEY=.*', "SECRET_KEY=$secret_key" | Set-Content .env
   ```

4. 创建环境

   Dify API 服务使用 [UV](https://docs.astral.sh/uv/) 来管理依赖。
   首先，如果你还没有安装 uv 包管理器，需要先安装它。

   ```bash
   pip install uv
   # 或者在 macOS 上
   brew install uv
   ```

5. 安装依赖

   ```bash
   uv sync --dev
   ```

6. 运行数据库迁移

   在首次启动之前，需要将数据库迁移到最新版本。

   ```bash
   uv run flask db upgrade
   ```

7. 启动后端服务

   ```bash
   uv run flask run --host 0.0.0.0 --port=5001 --debug
   ```

8. 启动 Dify [web](../web) 服务。
9. 访问 `http://localhost:3000` 设置你的应用。
10. 如果你需要处理和调试异步任务（例如数据集导入和文档索引），请启动 worker 服务。

   ```bash
   uv run celery -A app.celery worker -P gevent -c 1 --loglevel INFO -Q dataset,generation,mail,ops_trace,app_deletion
   ```

## 测试

1. 安装后端和测试环境的依赖

   ```bash
   uv sync --dev
   ```

2. 使用 `pyproject.toml` 中 `tool.pytest_env` 部分配置的模拟系统环境变量在本地运行测试

   ```bash
   uv run -P api bash dev/pytest/pytest_all_tests.sh
   ``` 