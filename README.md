# Demo Frontend Client

这是一个前端演示项目的客户端代码库。

## 项目结构

```
├── package.json       # 项目配置和依赖管理
├── README.md          # 项目说明文档
├── .gitignore         # Git忽略文件配置
├── public/            # 静态资源目录
│   └── index.html     # HTML入口文件
└── src/               # 源代码目录
    ├── components/    # 组件目录
    ├── styles/        # 样式文件目录
    └── index.js       # JavaScript入口文件
```

## 开发说明

### 安装依赖

```bash
npm install
```

### 运行项目

目前项目使用纯静态方式运行，可以直接在浏览器中打开 `public/index.html` 文件。

未来可以根据需要添加构建工具（如Webpack、Vite等）。

## Git仓库信息

本项目计划关联到以下GitHub仓库：
- 主要仓库：https://github.com/ELVPGroup/demo-repository.git
- 备用仓库：https://github.com/kevinaa76/demo-repository-fe-client.git

## 注意事项

- 确保已正确配置Git代理设置以访问GitHub
- 开发时请遵循标准的前端开发规范
- 定期提交代码到远程仓库