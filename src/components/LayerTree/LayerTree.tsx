import React, { useState } from 'react';
import { LayerTreeNode, Layer } from '../../types';
import './LayerTree.css';

interface LayerTreeProps {
    tree: LayerTreeNode[];
    selectedIndexes: Set<number>;
    fullPsdLayer?: Layer;
    onToggleSelection: (node: LayerTreeNode, multi?: boolean) => void;
    onPreview: (layer: Layer) => void;
    onExport: (layer: Layer) => void;
}

const LayerTreeNodeItem = ({
    node,
    selectedIndexes,
    onToggleSelection,
    onPreview,
    onExport,
    level = 0
}: {
    node: LayerTreeNode;
    selectedIndexes: Set<number>;
    onToggleSelection: (node: LayerTreeNode, multi?: boolean) => void;
    onPreview: (layer: Layer) => void;
    onExport: (layer: Layer) => void;
    level?: number;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 对于叶子节点和合成组节点，通过 index 判断选中状态
    const isSelected = node.index !== undefined && selectedIndexes.has(node.index);

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // 处理选中 (Ctrl/Cmd 实现多选)
        const multi = e.ctrlKey || e.metaKey;
        onToggleSelection(node, multi);

        // 处理预览
        if (node.layer) {
            onPreview(node.layer);
        } else if (node.isGroup && node.index !== undefined) {
            // 如果是组且有合成预览，则预览该组内容
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
    };

    return (
        <div className="tree-node-container" style={{ marginLeft: `${level === 0 ? 0 : 16}px` }}>
            <div
                className={`tree-node-content ${isSelected ? 'active' : ''}`}
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
                            onToggleSelection={onToggleSelection}
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
    fullPsdLayer,
    onToggleSelection,
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
                        onToggleSelection={onToggleSelection}
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
                    onToggleSelection={onToggleSelection}
                    onPreview={onPreview}
                    onExport={onExport}
                />
            ))}
        </div>
    );
};

export default LayerTree;
