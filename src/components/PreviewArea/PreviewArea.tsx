import React, { useMemo } from 'react';
import { Layer, LayerTreeNode, PsdInfo } from '../../types';
import { APP_CONFIG } from '../../config';
import LayerTree from '../LayerTree/LayerTree';
import './PreviewArea.css';

/**
 * PreviewArea 组件属性接口
 */
interface PreviewAreaProps {
    /** 图层列表 */
    layers: Layer[];
    /** 图层树结构 */
    layerTree: LayerTreeNode[];
    /** PSD 文件信息 */
    psdInfo?: PsdInfo | null;
    /** 是否正在加载 */
    loading: boolean;
    /** 错误信息 */
    error: string | null;
    /** 是否已选择文件 */
    hasFile: boolean;
    /** 已选中的图层索引集合 */
    selectedIndexes: Set<number>;
    /** 隐藏的图层索引集合 */
    hiddenLayers: Set<number>;
    /** 切换图层选中状态 */
    onToggleSelection: (node: number | LayerTreeNode, multi?: boolean) => void;
    /** 切换图层可见性 */
    onToggleVisibility: (index: number) => void;
    /** 导出单个图层 */
    onExportLayer: (layer: Layer) => void;
    /** 导出选中的图层 */
    onExportSelected: () => void;
    /** 按目录结构导出所有图层 */
    onExportWithStructure: () => void;
    /** 文件选择事件处理器 */
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** 图层卡片点击事件 */
    onLayerCardClick: (layer: Layer) => void;
    /** 文件输入框引用 */
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    /** PSD 预览图 */
    psdPreviewUrl?: string | null;
    /** 是否正在拖拽 */
    isDragging?: boolean;
    /** 拖拽事件处理器 */
    dragHandlers?: {
        onDragEnter: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent, onSuccess: (file: File) => void, onError: (message: string) => void) => void;
    };
    /** 文件选择成功回调 */
    onFileSelectSuccess?: (file: File) => void;
    /** 文件选择错误回调 */
    onFileSelectError?: (message: string) => void;
}

// PreviewModal component removed

const PreviewArea = ({
    layers,
    layerTree,
    psdInfo,
    loading,
    error,
    hasFile,
    selectedIndexes,
    hiddenLayers,
    onToggleSelection,
    onToggleVisibility,
    onExportLayer,
    onExportSelected,
    onExportWithStructure,
    onFileSelect,
    onLayerCardClick,
    fileInputRef,
    psdPreviewUrl,
    isDragging = false,
    dragHandlers,
    onFileSelectSuccess,
    onFileSelectError,
}: PreviewAreaProps) => {

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFileSelect(event);
    };

    // 构造 PSD 全图的虚拟图层对象
    const fullPsdLayer = useMemo<Layer | undefined>(() => {
        if (!psdInfo || !psdPreviewUrl) return undefined;
        return {
            name: "PSD 全图",
            imageUrl: psdPreviewUrl,
            width: psdInfo.width,
            height: psdInfo.height,
            opacity: 255,
            visible: true,
            blendMode: 'normal',
            left: 0, top: 0, right: psdInfo.width, bottom: psdInfo.height
        } as Layer;
    }, [psdInfo, psdPreviewUrl]);

    // 处理拖拽放下
    const handleDrop = (e: React.DragEvent) => {
        console.log('[PreviewArea] handleDrop 被调用', {
            target: e.target,
            currentTarget: e.currentTarget,
            hasDragHandlers: !!dragHandlers,
            hasOnFileSelectSuccess: !!onFileSelectSuccess,
            hasOnFileSelectError: !!onFileSelectError,
            dataTransfer: {
                types: Array.from(e.dataTransfer?.types || []),
                files: e.dataTransfer?.files?.length,
                items: e.dataTransfer?.items?.length
            }
        });
        
        e.preventDefault();
        e.stopPropagation();
        
        if (dragHandlers && onFileSelectSuccess && onFileSelectError) {
            console.log('[PreviewArea] 调用 dragHandlers.onDrop');
            dragHandlers.onDrop(e, onFileSelectSuccess, onFileSelectError);
        } else {
            console.error('[PreviewArea] 缺少必要的回调函数或拖拽处理器', {
                dragHandlers: !!dragHandlers,
                onFileSelectSuccess: !!onFileSelectSuccess,
                onFileSelectError: !!onFileSelectError
            });
        }
    };

    // 拖拽事件处理器
    const handleDragEnter = (e: React.DragEvent) => {
        console.log('[PreviewArea] handleDragEnter 触发', {
            target: e.target,
            currentTarget: e.currentTarget,
            types: Array.from(e.dataTransfer?.types || []),
            files: e.dataTransfer?.files?.length,
            items: e.dataTransfer?.items?.length
        });
        e.preventDefault();
        e.stopPropagation();
        dragHandlers?.onDragEnter(e);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
        dragHandlers?.onDragOver(e);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        console.log('[PreviewArea] handleDragLeave 触发', {
            target: e.target,
            currentTarget: e.currentTarget,
            relatedTarget: e.relatedTarget
        });
        dragHandlers?.onDragLeave(e);
    };

    return (
        <div 
            className={`preview-area ${!hasFile ? 'empty' : ''} ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ position: 'relative' }}
        >
            {loading && <div className="loading">{APP_CONFIG.TEXT.LOADING}</div>}

            {error && <div className="error">{error}</div>}

            {/* 拖拽提示覆盖层 */}
            {isDragging && (
                <div className="drag-overlay">
                    <div className="drag-message">
                        <div className="drag-icon">📁</div>
                        <h3>松开鼠标以上传文件</h3>
                        <p>支持 PSD 文件</p>
                    </div>
                </div>
            )}

            {!hasFile && !loading && (
                <div className="welcome-message">
                    <div className="welcome-icon">PSD</div>
                    <h3>{APP_CONFIG.TEXT.PREVIEW_TITLE}</h3>
                    <p>{APP_CONFIG.TEXT.PREVIEW_HINT}</p>
                    <button
                        className="center-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {APP_CONFIG.TEXT.UPLOAD_BTN}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={APP_CONFIG.FILE.ACCEPT_TYPE}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {layers.length > 0 && (
                <>
                    {/* 隐藏图层提示 */}
                    {hiddenLayers.size > 0 && (
                        <div className="hidden-layers-tip">
                            <span className="tip-icon">💡</span>
                            <span>已隐藏 {hiddenLayers.size} 个图层，这些图层不会被导出（预览不受影响）</span>
                        </div>
                    )}
                    
                    {/* 顶部操作按钮区 */}
                    <div className="top-actions">
                        <button className="action-btn primary" onClick={onExportSelected}>
                            💾 导出选中 {selectedIndexes.size > 0 && `(${selectedIndexes.size})`}
                        </button>
                        <button className="action-btn primary" onClick={onExportWithStructure}>
                            📂 按结构导出
                        </button>

                        <button className="action-btn secondary" onClick={() => fileInputRef.current?.click()}>
                            🔄 重新选择
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={APP_CONFIG.FILE.ACCEPT_TYPE}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <LayerTree
                        tree={layerTree}
                        selectedIndexes={selectedIndexes}
                        hiddenLayers={hiddenLayers}
                        fullPsdLayer={fullPsdLayer}
                        onToggleSelection={onToggleSelection}
                        onToggleVisibility={onToggleVisibility}
                        onPreview={onLayerCardClick}
                        onExport={onExportLayer}
                    />
                </>
            )}
        </div>
    );
};

export default PreviewArea;
