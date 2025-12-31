import { useMemo } from 'react';
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
    /** 切换图层选中状态 */
    onToggleSelection: (node: number | LayerTreeNode, multi?: boolean) => void;
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
    onToggleSelection,
    onExportLayer,
    onExportSelected,
    onExportWithStructure,
    onFileSelect,
    onLayerCardClick,
    fileInputRef,
    psdPreviewUrl,
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

    return (
        <div className={`preview-area ${!hasFile ? 'empty' : ''}`}>
            {loading && <div className="loading">{APP_CONFIG.TEXT.LOADING}</div>}

            {error && <div className="error">{error}</div>}

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
                        fullPsdLayer={fullPsdLayer}
                        onToggleSelection={onToggleSelection}
                        onPreview={onLayerCardClick}
                        onExport={onExportLayer}
                    />
                </>
            )}
        </div>
    );
};

export default PreviewArea;
