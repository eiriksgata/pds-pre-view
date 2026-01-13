# PSD Pre-View - AI Coding Agent Instructions

## Project Overview
Tauri v2 + React 19 desktop application for parsing, viewing, and exporting PSD files. Uses `ag-psd` for client-side parsing (no server uploads), providing layer tree navigation, preview, and hierarchical export functionality.

## Architecture & Data Flow

### Core Components
- **[src/App.tsx](../src/App.tsx)**: Root component orchestrating file upload, layer selection, and export flows
- **[src/psd-parser.ts](../src/psd-parser.ts)**: PSD parsing engine that flattens layers, composites groups, and generates preview URLs
- **[src/hooks/usePsdParser.ts](../src/hooks/usePsdParser.ts)**: State management hook wrapping parser logic
- **[src/components/LayerTree/LayerTree.tsx](../src/components/LayerTree/LayerTree.tsx)**: Hierarchical tree view with expand/collapse and multi-select (Ctrl/Cmd)
- **[src/components/PreviewArea/](../src/components/PreviewArea/)**: Layer preview canvas and action toolbar
- **[src/utils/exportUtils.ts](../src/utils/exportUtils.ts)**: Single/batch export via Tauri file system APIs
- **[src/utils/hierarchicalExport.ts](../src/utils/hierarchicalExport.ts)**: Structure-preserving export (groups → folders)

### Data Flow Pattern
```
File Upload → psd-parser.ts (ag-psd) → extractLayerTree() 
  → {layers[], tree[], psdImageUrl} → usePsdParser hook 
  → App.tsx state → LayerTree + PreviewArea components
```

**Critical**: `psd-parser.ts` generates TWO representations:
1. `layers[]` - Flat array with composited groups (for quick indexing)
2. `tree[]` - Hierarchical `LayerTreeNode[]` (for TreeView rendering)

Both share `index` property for cross-referencing selected layers.

## Development Workflows

### Build & Run
```bash
# Dev mode (Vite + Tauri hot-reload)
npm run tauri:dev  # or yarn tauri:dev

# Production build
npm run tauri:build

# Debug build (with logs)
npm run tauri:build:debug
```

**Port Configuration**: Vite locked to `1420` (see [vite.config.ts](../vite.config.ts)), HMR on `1421`.

### Debugging
- **Frontend**: Chrome DevTools (F12 in Tauri window)
- **Rust**: `console.log` statements appear in terminal running `tauri:dev`
- **PSD Parsing**: Check `[Parser]` prefixed logs in browser console

## Project-Specific Conventions

### File Naming & Structure
- **TSX files**: Named exports for components (e.g., `LayerTree.tsx` exports `LayerTree`)
- **Utility files**: Named exports for functions, centralized in `index.ts` barrels
- **Types**: Single [src/types/index.ts](../src/types/index.ts) for all shared interfaces
- **Config**: [src/config/index.ts](../src/config/index.ts) exports `APP_CONFIG` constant

### State Management Pattern
Custom hooks pattern (no Redux/Zustand):
- `useAlert()` - Modal notifications
- `usePsdParser()` - PSD parsing & layer state
- `useFileUpload()` - File input handling
- `useLayerSelection()` - Multi-select logic

State flows: Hook → Component → Child components via props (unidirectional).

### Layer Selection Logic
Multi-select implemented in [App.tsx](../src/App.tsx#L93-L106):
- **Single click**: Select only clicked layer (`Set<number>` reset)
- **Ctrl/Cmd + click**: Toggle selection (add/remove from Set)
- Selection state stored as `Set<number>` of layer indices

### Layer Visibility Control (Selective Export)
Users can toggle layer visibility for selective export:
- **State**: `hiddenLayers: Set<number>` in [App.tsx](../src/App.tsx) tracks hidden layers
- **UI**: Eye icon (👁️/👁️‍🗨️) in [LayerTree](../src/components/LayerTree/LayerTree.tsx) toggles visibility
- **Export**: Both batch export and hierarchical export filter out hidden layers
- **Reset**: Hidden layers reset when new file is loaded

When implementing export features, always check `hiddenLayers` Set before exporting.

### Export Formats & Encoders
Supports PNG, JPG, TGA, BLP via custom encoders:
- **PNG/JPG**: Canvas API + `convertImageFormat()` in [imageUtils.ts](../src/utils/imageUtils.ts)
- **TGA/BLP**: Custom encoders in [src/utils/encoders/](../src/utils/encoders/) (pixel-level binary encoding)

Format selection in [ExportModal.tsx](../src/components/ExportModal/ExportModal.tsx).

## Tauri Integration Points

### File System Operations
Uses `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-dialog`:
```typescript
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';

// Single file save
const filePath = await save({ defaultPath: 'layer.png', filters: [...] });
await writeFile(filePath, uint8Array);

// Folder picker
const folderPath = await open({ directory: true });
```

**Security**: Tauri v2 requires explicit file system permissions. Check [src-tauri/capabilities/default.json](../src-tauri/capabilities/default.json) for allowed APIs.

### Backend Commands
Currently **no custom Rust commands**. All logic is frontend TypeScript. If adding Rust commands:
1. Define in [src-tauri/src/lib.rs](../src-tauri/src/lib.rs)
2. Invoke via `import { invoke } from '@tauri-apps/api/core'`

## Critical Implementation Details

### Group Layer Compositing
[psd-parser.ts](../src/psd-parser.ts#L20-L90) uses custom logic to composite group layers:
- **Hidden layers**: Skipped via `hidden === true || visible === false` checks
- **Group canvas generation**: Calculates bounding box from visible leaf layers, renders onto temporary canvas
- **Single-child optimization**: Skips group preview if only one visible child (avoid duplicate previews)

When modifying: Test with nested groups containing text layers (common edge case).

### Base64 Image Handling
All layer previews stored as `data:image/png;base64,...` URLs:
- Generated in `psd-parser.ts` via `canvasToDataURL()`
- Converted to `Uint8Array` for file writes in [exportUtils.ts](../src/utils/exportUtils.ts#L16)

### Hierarchical Export Recursion
[hierarchicalExport.ts](../src/utils/hierarchicalExport.ts) mirrors PSD structure to file system:
- Groups → Folders (`mkdir` recursively)
- Layers → Files (sanitized names via `sanitizeFileName()`)
- Error handling: Continues on individual failures, returns `{success, failed}` counts

## Common Pitfalls

1. **Layer indices out of sync**: If modifying `psd-parser.ts`, ensure `layers[]` and `tree[]` indices match
2. **File path separators**: Always use `/` (not `\`), Tauri normalizes internally
3. **Async errors**: Wrap Tauri file ops in try-catch, show alerts via `useAlert()`
4. **Type imports**: Import from `'./types'` barrel, not individual files
5. **CSS modules**: This project uses plain CSS, not CSS modules (no `.module.css`)

## Key Dependencies
- `ag-psd@^29.0.0` - PSD parsing (see docs: https://github.com/Agamnentzar/ag-psd)
- `@tauri-apps/api@^2.9.1` - Tauri frontend APIs
- `react@^19.1.0` - React 19 (new JSX transform, no React import needed)

## Chinese Localization
All UI text configured in [src/config/index.ts](../src/config/index.ts) `APP_CONFIG.TEXT`. Console logs use Chinese for user-facing messages, English for debug logs.
