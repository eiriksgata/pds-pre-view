# PSD 解析与导出工具

## 简介
是一个基于 Tauri 和 React 构建的高性能 PSD 文件查看与导出工具。它利用 `ag-psd` 库在本地快速解析 PSD 文件，无需上传到服务器，确保数据安全。用户可以方便地浏览图层结构、查看图层详情，并进行多种形式的资源导出。

## 主要功能

- **⚡ 高速解析**: 支持拖拽上传并快速解析 PSD 文件，包含图层和目录结构。
- **👁️ 图层预览**: 
  - 完整的图层树状视图。
  - 支持图层显示/隐藏切换。
  - 选中图层的实时预览。
- **📤 强大的导出能力**:
  - **单图层导出**: 右键或通过操作栏导出单个图层。
  - **批量导出**: 支持多选图层后批量导出。
  - **结构化导出**: 能够按照 PSD 内部的目录层级结构，完整导出整个项目资源。
- **🔍 属性查看**: 右侧面板展示选中图层的详细信息（尺寸、坐标等）。
- **🖥️ 跨平台体验**: 基于 Tauri 构建，提供原生应用般的性能与体验。

## 技术栈

- **Core**: [Tauri v2](https://tauri.app/) (Rust)
- **UI Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **PSD Processing**: [ag-psd](https://github.com/AgPsd/ag-psd)

## 开发指南

### 环境准备
确保你的系统已安装：
- [Node.js](https://nodejs.org/) (推荐 LTS 版本)
- [Rust](https://www.rust-lang.org/tools/install) (Tauri 开发依赖)

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 启动前端开发服务器和 Tauri 窗口
npm run tauri:dev
```

### 构建应用

```bash
# 构建生产环境版本
npm run tauri:build
```

## 目录结构

```
src/
├── components/      # React 组件 (LayerTree, PreviewArea, etc.)
├── hooks/           # 自定义 Hooks (usePsdParser, useFileUpload, etc.)
├── utils/           # 工具函数 (exportUtils, hierarchicalExport)
├── config/          # 应用配置
└── types/           # TypeScript 类型定义
src-tauri/           # Rust 后端代码
```

## 贡献
欢迎提交 Issue 或 Pull Request 来改进。

## 许可证
[MIT](LICENSE)
