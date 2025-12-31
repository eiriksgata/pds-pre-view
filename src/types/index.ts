/**
 * 类型定义模块
 * 
 * 定义应用中使用的所有类型接口和枚举
 */

/**
 * 图层类型定义
 * 
 * 表示 PSD 文件中的一个图层
 */
export interface Layer {
    /** 图层名称 */
    name: string;
    /** 图层类型(如 'normal', 'text', 'group' 等) */
    type: string;
    /** 是否可见 */
    visible: boolean;
    /** 透明度(0-255) */
    opacity: number;
    /** 混合模式 */
    blendMode: string;
    /** 左边界 */
    left: number;
    /** 右边界 */
    right: number;
    /** 上边界 */
    top: number;
    /** 下边界 */
    bottom: number;
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 图层预览图的 base64 URL */
    imageUrl?: string | null;
    /** 是否为图层组 */
    isGroup?: boolean;
    /** 子图层(仅图层组有) */
    children?: Layer[];
}

/**
 * PSD 文件信息类型
 * 
 * 包含 PSD 文件的基本元数据
 */
export interface PsdInfo {
    /** PSD 画布宽度 */
    width: number;
    /** PSD 画布高度 */
    height: number;
    /** 颜色通道数 */
    channels: number;
    /** PSD 文件版本 */
    version: number;
    /** 文件名 */
    name: string;
}

/**
 * 提示消息类型枚举
 */
export type AlertType = 'info' | 'success' | 'warning' | 'error';

/**
 * 图层筛选类型
 */
export type LayerFilterType = 'all' | 'group' | 'text' | 'image';

/**
 * 导出结果统计
 */
export interface ExportResult {
    /** 成功导出的数量 */
    success: number;
    /** 失败的数量 */
    failed: number;
}

/**
 * 图层选择状态
 */
export interface LayerSelectionState {
    /** 已选中的图层索引集合 */
    selectedIndexes: Set<number>;
    /** 已选中的数量 */
    selectedCount: number;
}

/**
 * 分类统计信息
 */
export interface CategoryCounts {
    /** 全部图层数量 */
    all: number;
    /** 图层组数量 */
    groups: number;
    /** 文字图层数量 */
    texts: number;
    /** 图片图层数量 */
    images: number;
}

/**
 * 层级图层树节点
 * 
 * 保留PSD原有的层级结构,用于按目录结构导出
 */
export interface LayerTreeNode {
    /** 节点名称 */
    name: string;
    /** 节点路径(从根到当前节点,用/分隔) */
    path: string;
    /** 是否为组/文件夹 */
    isGroup: boolean;
    /** 原始图层索引 */
    index?: number;
    /** 预览图 URL */
    imageUrl?: string | null;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 图层数据(仅叶子节点有) */
    layer?: Layer;
    /** 子节点(仅组节点有) */
    children?: LayerTreeNode[];
}

/**
 * 导出选项
 */
export interface ExportOptions {
    /** 是否保留目录结构 */
    preserveStructure: boolean;
    /** 导出格式 */
    format: 'png' | 'jpg' | 'blp' | 'tga';
    /** 图片质量(0-1),仅对jpg格式有效 */
    quality?: number;
}

