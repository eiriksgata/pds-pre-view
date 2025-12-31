/**
 * 主应用组件
 * 
 * PSD 资源浏览器的根组件,负责:
 * - 文件上传和解析
 * - 图层展示和管理
 * - 图层选择和导出
 * - 提示消息显示
 */

import { useState, useRef, useEffect } from 'react';
import { useAlert, usePsdParser, useFileUpload } from './hooks';
import { Layer, LayerTreeNode, ExportOptions } from './types';
import { APP_CONFIG } from './config';
import { exportLayerImage, exportLayersToFolder } from './utils/exportUtils';
import { exportLayerTreeWithStructure } from './utils/hierarchicalExport';
import AlertModal from './components/AlertModal/AlertModal';
import PreviewArea from './components/PreviewArea';
import RightSidebar from './components/RightSidebar/RightSidebar';
import ExportModal from './components/ExportModal/ExportModal';
import './App.css';

/**
 * PSD 查看器主组件
 */
const PSDViewer = () => {
  // 使用自定义 Hooks 管理状态和逻辑
  const { showAlert, hideAlert, isAlertVisible, alertMessage, alertType } = useAlert();
  // useLayerSelection 仅用于 toggleSelectAll，selectedIndexes 和 toggleSelection 变为本地管理
  // const { toggleSelectAll } = useLayerSelection();
  // 使用 PSD 解析 Hook
  const { layers, layerTree, loading, error, psdPreviewUrl, parsePsdFile, psdInfo } = usePsdParser();
  const { fileInputRef, handleFileChange } = useFileUpload({
    acceptedExtensions: [...APP_CONFIG.FILE.ACCEPTED_EXTENSIONS],
    maxSize: APP_CONFIG.FILE.MAX_SIZE,
  });

  // 本地状态
  const [hasFile, setHasFile] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const [leftWidth, setLeftWidth] = useState(30); // 左侧宽度百分比
  const isResizingRef = useRef(false);

  // 导出模态框状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTarget, setExportTarget] = useState<'selected' | 'structure'>('selected');

  // 禁用全局右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  /**
   * 处理文件选择成功
   * @param file - 选中的文件
   */
  const handleFileSelect = async (file: File) => {
    setHasFile(true);
    setSelectedIndexes(new Set());
    setSelectedLayer(null);

    try {
      await parsePsdFile(file);
    } catch (err) {
      setHasFile(false);
      showAlert(APP_CONFIG.TEXT.PROCESS_ERROR, 'error');
    }
  };

  /**
   * 处理图层选择
   * @param indexOrNode - 图层索引或树节点
   * @param multi - 是否为多选模式 (Ctrl/Cmd 键按下)
   */
  const handleLayerSelect = (indexOrNode: number | LayerTreeNode, multi: boolean = false) => {
    const index = typeof indexOrNode === 'number' ? indexOrNode : indexOrNode.index;
    if (index === undefined) return;

    setSelectedIndexes(prev => {
      // 如果不是多选模式，直接重置为只选中当前项
      if (!multi) {
        // 如果点击的是已选中的唯一项，则不进行操作（可选：取消选中？通常是保持选中）
        // 这里设定为点击即选中当前项，放弃其他项
        return new Set([index]);
      }

      // 多选模式：切换状态
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  /**
   * 处理文件选择错误
   * @param errorMsg - 错误信息
   */
  const handleError = (errorMsg: string) => {
    showAlert(errorMsg, 'error');
  };

  /**
   * 导出单个图层
   * @param layer - 要导出的图层
   */
  const handleExportLayer = async (layer: Layer) => {
    if (!layer.imageUrl) {
      showAlert(APP_CONFIG.TEXT.NO_EXPORT_IMAGE, 'warning');
      return;
    }

    try {
      await exportLayerImage(layer.imageUrl, layer.name);
      showAlert('导出成功!', 'success');
    } catch (error) {
      showAlert('导出失败,请重试', 'error');
    }
  };

  /**
   * 打开批量导出模态框
   */
  const handleExportSelected = () => {
    if (selectedIndexes.size === 0) {
      showAlert('没有可导出的图层', 'warning');
      return;
    }
    setExportTarget('selected');
    setShowExportModal(true);
  };

  /**
   * 打开结构导出模态框
   */
  const handleExportWithStructure = () => {
    if (layerTree.length === 0) {
      showAlert('没有可导出的图层树结构', 'warning');
      return;
    }
    setExportTarget('structure');
    setShowExportModal(true);
  };

  /**
   * 执行导出操作
   */
  const handleConfirmExport = async (options: ExportOptions) => {
    if (exportTarget === 'selected') {
      // 批量导出选中
      const selectedLayers = Array.from(selectedIndexes)
        .map(i => layers[i])
        .filter(l => l.imageUrl)
        .map(l => ({
          imageUrl: l.imageUrl!,
          name: l.name
        }));

      if (selectedLayers.length === 0) {
        showAlert('选中图层中没有可导出的图片数据', 'warning');
        return;
      }

      try {
        const result = await exportLayersToFolder(selectedLayers, options);
        if (result.success === 0 && result.failed === 0) {
          // 用户取消了选择文件夹
          return;
        }
        showAlert(`导出完成! 成功: ${result.success}, 失败: ${result.failed}`, 'success');
      } catch (error) {
        console.error('批量导出失败:', error);
        showAlert('批量导出失败,请重试', 'error');
      }

    } else {
      // 按结构导出
      try {
        console.log('[App] 开始按结构导出...', options);
        const result = await exportLayerTreeWithStructure(layerTree, options);
        if (result.success === 0 && result.failed === 0) {
          // 用户取消了选择目录
          return;
        }
        showAlert(`按结构导出完成! 成功: ${result.success}, 失败: ${result.failed}`, 'success');
      } catch (error) {
        console.error('按结构导出失败:', error);
        showAlert('按结构导出失败,请重试', 'error');
      }
    }
  };

  /**
   * 处理图层卡片点击
   * @param layer - 被点击的图层
   */
  const handleLayerCardClick = (layer: Layer) => {
    setSelectedLayer(layer);
  };

  // 处理水平拖动开始
  const handleResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // 处理水平拖动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const newWidth = (e.clientX / window.innerWidth) * 100;
      // 限制在 20% 到 80% 之间
      if (newWidth >= 15 && newWidth <= 70) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="psd-viewer">
      <div className="main-layout">
        <div style={{ width: `${leftWidth}%`, minWidth: '200px', display: 'flex' }}>
          <PreviewArea
            layers={layers}
            layerTree={layerTree}
            loading={loading}
            error={error}
            hasFile={hasFile}
            selectedIndexes={selectedIndexes}
            onToggleSelection={handleLayerSelect}
            onExportLayer={handleExportLayer}
            onExportSelected={handleExportSelected}
            onExportWithStructure={handleExportWithStructure}
            onFileSelect={(e) => handleFileChange(e, handleFileSelect, handleError)}
            onLayerCardClick={handleLayerCardClick}
            fileInputRef={fileInputRef}
            psdPreviewUrl={psdPreviewUrl}
            psdInfo={psdInfo}
          />
        </div>

        <div
          className="layout-resizer"
          onMouseDown={handleResizerMouseDown}
        />

        <div style={{ flex: 1, minWidth: '300px', display: 'flex' }}>
          <RightSidebar
            selectedLayer={selectedLayer}
          />
        </div>
      </div>

      {/* 提示消息弹窗 */}
      {isAlertVisible && alertMessage && (
        <AlertModal
          message={alertMessage}
          isVisible={isAlertVisible}
          onClose={hideAlert}
          type={alertType}
        />
      )}

      {/* 导出配置模态框 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleConfirmExport}
        title={exportTarget === 'selected' ? '批量导出配置' : '结构导出配置'}
      />
    </div>
  );
};

export default PSDViewer;
