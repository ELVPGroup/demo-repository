# 数据库准备工作

前置条件：本机安装PostgreSQL及psql

1. 启动psql

2. 新建用户
```sql
CREATE USER evlp_admin WITH PASSWORD 'super_secret_123';
```

3. 新建数据库
```sql
CREATE DATABASE evlp_database;
```

4. 切换到新数据库
```sql
\c evlp_database;
```

5. 为用户分配数据库权限
```sql
GRANT CREATE ON SCHEMA public TO evlp_admin; -- 允许用户在public模式下创建表
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evlp_admin; -- 允许用户对public模式下现有的所有表执行所有操作
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO evlp_admin; -- 允许用户在public模式下对未来新创建的表也有权限
ALTER USER evlp_admin CREATEDB; -- 允许用户创建新数据库，为prisma client连接数据库做准备
```

6. 复制`.env.example`到`.env`
```bash
# 在项目根目录下
cp apps/backend/.env.example apps/backend/.env
```

7. 利用Prisma ORM初始化数据库（根据schema创建数据库表）
```bash
# 在项目根目录下
cd apps/backend
npx prisma migrate dev --name init
```

8. 初始化Prisma Client
```bash
# 在apps/backend目录下
npx prisma generate
```

每次修改schema.prisma后，都需要执行以下命令
```bash
# 在apps/backend目录下
npx prisma migrate dev --name update
npx prisma generate
```

