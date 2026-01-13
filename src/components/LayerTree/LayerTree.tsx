import React, { useState } from 'react';
import { LayerTreeNode, Layer } from '../../types';
import { generateGroupPreview } from '../../utils/layerUtils';
import './LayerTree.css';

interface LayerTreeProps {
    tree: LayerTreeNode[];
    selectedIndexes: Set<number>;
    hiddenLayers: Set<number>;
    fullPsdLayer?: Layer;
    onToggleSelection: (node: LayerTreeNode, multi?: boolean) => void;
    onToggleVisibility: (index: number) => void;
    onPreview: (layer: Layer) => void;
    onExport: (layer: Layer) => void;
}

const LayerTreeNodeItem = ({
    node,
    selectedIndexes,
    hiddenLayers,
    onToggleSelection,
    onToggleVisibility,
    onPreview,
    onExport,
    level = 0
}: {
    node: LayerTreeNode;
    selectedIndexes: Set<number>;
    hiddenLayers: Set<number>;
    onToggleSelection: (node: LayerTreeNode, multi?: boolean) => void;
    onToggleVisibility: (index: number) => void;
    onPreview: (layer: Layer) => void;
    onExport: (layer: Layer) => void;
    level?: number;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 对于叶子节点和合成组节点，通过 index 判断选中状态
    const isSelected = node.index !== undefined && selectedIndexes.has(node.index);
    const isHidden = node.index !== undefined && hiddenLayers.has(node.index);

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleToggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.index !== undefined) {
            onToggleVisibility(node.index);
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // 处理选中 (Ctrl/Cmd 实现多选)
        const multi = e.ctrlKey || e.metaKey;
        onToggleSelection(node, multi);

        // 处理预览
        if (node.layer) {
            // 叶子节点，直接预览
            onPreview(node.layer);
        } else if (node.isGroup) {
            // 如果是组，动态生成预览图（考虑隐藏状态）
            try {
                const dynamicPreviewUrl = await generateGroupPreview(node, hiddenLayers);
                
                if (dynamicPreviewUrl) {
                    // 使用动态生成的预览图
                    onPreview({
                        name: node.name,
                        imageUrl: dynamicPreviewUrl,
                        width: node.width || 0,
                        height: node.height || 0,
                        type: 'group',
                        visible: true,
                        opacity: 255,
                        blendMode: 'normal',
                        left: 0, top: 0, right: 0, bottom: 0
                    } as Layer);
                } else if (node.imageUrl) {
                    // 如果动态生成失败，使用原始预览图
                    onPreview({
                        name: node.name,
                        imageUrl: node.imageUrl,
                        width: node.width || 0,
                        height: node.height || 0,
                        type: 'group',
                        visible: true,
                        opacity: 255,
                        blendMode: 'normal',
                        left: 0, top: 0, right: 0, bottom: 0
                    } as Layer);
                }
            } catch (error) {
                console.error('生成组预览图失败:', error);
                // 如果出错，尝试使用原始预览图
                if (node.imageUrl) {
                    onPreview({
                        name: node.name,
                        imageUrl: node.imageUrl,
                        width: node.width || 0,
                        height: node.height || 0,
                        type: 'group',
                        visible: true,
                        opacity: 255,
                        blendMode: 'normal',
                        left: 0, top: 0, right: 0, bottom: 0
                    } as Layer);
                }
            }
        }
    };

    return (
        <div className="tree-node-container" style={{ marginLeft: `${level === 0 ? 0 : 16}px` }}>
            <div
                className={`tree-node-content ${isSelected ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                onClick={handleClick}
            >
                <div className="node-left">
                    {node.isGroup ? (
                        <span
                            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                            onClick={toggleExpand}
                        >
                            ▶
                        </span>
                    ) : (
                        <span className="indent-spacer" />
                    )}

                    {node.index !== undefined && (
                        <button
                            className={`visibility-toggle ${isHidden ? 'hidden' : ''}`}
                            onClick={handleToggleVisibility}
                            title={isHidden ? '显示图层' : '隐藏图层'}
                        >
                            {isHidden ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    )}

                    <div className="node-thumbnail">
                        {node.imageUrl ? (
                            <img src={node.imageUrl} alt={node.name} />
                        ) : (
                            <span className="type-icon">{node.isGroup ? '📁' : '🖼️'}</span>
                        )}
                    </div>

                    <span className="node-name" title={node.name}>{node.name}</span>
                </div>

                <div className="node-actions" onClick={e => e.stopPropagation()}>
                    <div className="node-info-tags">
                        {node.width !== undefined && <span className="node-size">{node.width} × {node.height}</span>}
                    </div>
                </div>
            </div>

            {node.isGroup && isExpanded && node.children && (
                <div className="tree-node-children">
                    {node.children.map((child, idx) => (
                        <LayerTreeNodeItem
                            key={`${node.path}-${idx}`}
                            node={child}
                            selectedIndexes={selectedIndexes}
                            hiddenLayers={hiddenLayers}
                            onToggleSelection={onToggleSelection}
                            onToggleVisibility={onToggleVisibility}
                            onPreview={onPreview}
                            onExport={onExport}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const LayerTree = ({
    tree,
    selectedIndexes,
    hiddenLayers,
    fullPsdLayer,
    onToggleSelection,
    onToggleVisibility,
    onPreview,
    onExport
}: LayerTreeProps) => {
    if (!tree || tree.length === 0) {
        // If there's a fullPsdLayer, we still want to render it even if tree is empty
        if (!fullPsdLayer) {
            return <div className="tree-empty">暂无图层数据</div>;
        }
    }

    // 构造 PSD 全图的树节点
    const fullPsdNode: LayerTreeNode | null = fullPsdLayer ? {
        name: fullPsdLayer.name,
        path: 'psd-full-preview',
        isGroup: false,
        width: fullPsdLayer.width,
        height: fullPsdLayer.height,
        index: -1, // 特殊索引，用于选中判断
        layer: fullPsdLayer,
        imageUrl: fullPsdLayer.imageUrl,
        children: []
    } : null;

    return (
        <div className="layer-tree-viewport">
            {/* PSD 全图节点 */}
            {fullPsdNode && (
                <div className="psd-full-node-wrapper">
                    <LayerTreeNodeItem
                        node={fullPsdNode}
                        selectedIndexes={selectedIndexes}
                        hiddenLayers={hiddenLayers}
                        onToggleSelection={onToggleSelection}
                        onToggleVisibility={onToggleVisibility}
                        onPreview={onPreview}
                        onExport={onExport}
                    />
                    <div className="tree-divider" />
                </div>
            )}

            {tree.map((node, idx) => (
                <LayerTreeNodeItem
                    key={idx}
                    node={node}
                    selectedIndexes={selectedIndexes}
                    hiddenLayers={hiddenLayers}
                    onToggleSelection={onToggleSelection}
                    onToggleVisibility={onToggleVisibility}
                    onPreview={onPreview}
                    onExport={onExport}
                />
            ))}
        </div>
    );
};

export default LayerTree;
