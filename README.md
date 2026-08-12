# JSON Tools

JSON 校验、格式化、树形浏览和请求日志查看工具。

技术栈：React、React Router、Zustand、Vite、TypeScript、Tailwind CSS、Base UI（shadcn 风格封装）。

页面按业务路由放在 `src/pages`，可复用交互组件位于 `src/components/ui`，其中 Button、Tooltip 与 Select 均基于 `@base-ui/react`。

## 开发

```sh
pnpm install
pnpm dev
```

默认访问地址为 `http://localhost:5173`。JSON 工具位于 `/json-tools`，日志查看器位于 `/log-viewer`。

## 验证

```sh
pnpm test:unit
pnpm build
pnpm test:e2e
```

## GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，GitHub Actions 会构建并发布应用到仓库 Pages 地址，例如 `https://<用户名>.github.io/<仓库名>/`。

首次启用时，在 GitHub 仓库的 **Settings > Pages > Build and deployment** 中选择 **GitHub Actions** 作为 Source。工作流会根据仓库名设置资源前缀，根路径和 `/log-viewer` 的直接访问都会正常工作。

默认发布分支为 `main`。若使用自定义域名，在工作流的构建步骤将 `BASE_PATH` 改为 `/`；若使用其他分支，同步修改工作流的 `on.push.branches`。
