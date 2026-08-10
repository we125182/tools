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
