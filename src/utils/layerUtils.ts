/**
 * 图层处理工具模块
 * 
 * 提供图层相关的工具函数,包括图层类型判断、边界计算等
 */

/**
 * 图层边界信息接口
 */
export interface LayerBounds {
    /** 左边界 */
    left: number;
    /** 上边界 */
    top: number;
    /** 右边界 */
    right: number;
    /** 下边界 */
    bottom: number;
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
}

/**
 * 判断图层是否为文字图层
 * 
 * @param layer - 要判断的图层对象
 * @returns 如果是文字图层返回 true,否则返回 false
 * 
 * @example
 * ```ts
 * if (isTextLayer(layer)) {
 *   console.log('这是一个文字图层');
 * }
 * ```
 */
export const isTextLayer = (layer: any): boolean => {
    return !!(layer.text || layer.type === 'text');
};

/**
 * 判断图层是否为图层组
 * 
 * @param layer - 要判断的图层对象
 * @returns 如果是图层组返回 true,否则返回 false
 * 
 * @example
 * ```ts
 * if (isGroupLayer(layer)) {
 *   console.log('这是一个图层组');
 * }
 * ```
 */
export const isGroupLayer = (layer: any): boolean => {
    return !!(layer.isGroup || (layer.children && layer.children.length > 0) || layer.type === 'group');
};

/**
 * 判断图层是否可见
 * 
 * @param layer - 要判断的图层对象
 * @returns 如果图层可见返回 true,否则返回 false
 * 
 * @example
 * ```ts
 * if (isLayerVisible(layer)) {
 *   console.log('图层可见');
 * }
 * ```
 */
export const isLayerVisible = (layer: any): boolean => {
    // hidden 为 true 表示隐藏
    // visible 为 false 表示隐藏
    return layer.hidden !== true && layer.visible !== false;
};

/**
 * 获取图层的边界信息
 * 
 * @param layer - 图层对象
 * @returns 图层的边界信息
 * 
 * @example
 * ```ts
 * const bounds = getLayerBounds(layer);
 * console.log(bounds.width, bounds.height);
 * ```
 */
export const getLayerBounds = (layer: any): LayerBounds => {
    const left = layer.left ?? 0;
    const top = layer.top ?? 0;
    const right = layer.right ?? left;
    const bottom = layer.bottom ?? top;
    const width = right - left;
    const height = bottom - top;

    return { left, top, right, bottom, width, height };
};

/**
 * 计算多个图层的包围边界
 * 
 * @param layers - 图层数组
 * @returns 包围所有图层的边界信息,如果没有有效图层返回 null
 * 
 * @example
 * ```ts
 * const groupBounds = calculateGroupBounds([layer1, layer2, layer3]);
 * if (groupBounds) {
 *   console.log(groupBounds.width, groupBounds.height);
 * }
 * ```
 */
export const calculateGroupBounds = (layers: any[]): LayerBounds | null => {
    if (!layers || layers.length === 0) return null;

    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    let hasContent = false;

    for (const layer of layers) {
        const bounds = getLayerBounds(layer);

        // 只有当图层有实际尺寸时才计入边界
        if (bounds.width > 0 && bounds.height > 0) {
            minLeft = Math.min(minLeft, bounds.left);
            minTop = Math.min(minTop, bounds.top);
            maxRight = Math.max(maxRight, bounds.right);
            maxBottom = Math.max(maxBottom, bounds.bottom);
            hasContent = true;
        }
    }

    if (!hasContent) return null;

    return {
        left: minLeft,
        top: minTop,
        right: maxRight,
        bottom: maxBottom,
        width: maxRight - minLeft,
        height: maxBottom - minTop,
    };
};

/**
 * 过滤出所有可见的图层
 * 
 * @param layers - 图层数组
 * @returns 可见的图层数组
 * 
 * @example
 * ```ts
 * const visibleLayers = filterVisibleLayers(allLayers);
 * ```
 */
export const filterVisibleLayers = (layers: any[]): any[] => {
    return layers.filter(layer => isLayerVisible(layer));
};

/**
 * 递归收集所有叶子图层(非组图层)
 * 
 * @param layers - 图层数组
 * @param result - 结果数组(递归使用)
 * @returns 所有叶子图层的数组
 * 
 * @example
 * ```ts
 * const leafLayers = collectLeafLayers(layers);
 * ```
 */
export const collectLeafLayers = (layers: any[], result: any[] = []): any[] => {
    for (const layer of layers) {
        if (isGroupLayer(layer) && layer.children) {
            // 如果是组,递归收集子图层
            collectLeafLayers(layer.children, result);
        } else {
            // 如果是叶子图层,添加到结果
            result.push(layer);
        }
    }
    return result;
};

/**
 * 获取图层的透明度(0-1)
 * 
 * @param layer - 图层对象
 * @returns 透明度值(0-1)
 * 
 * @example
 * ```ts
 * const opacity = getLayerOpacity(layer);
 * console.log(`透明度: ${opacity * 100}%`);
 * ```
 */
export const getLayerOpacity = (layer: any): number => {
    let opacity = layer.opacity ?? 255;

    // 如果 opacity 大于 1,认为是 0-255 范围,需要转换为 0-1
    if (opacity > 1) {
        opacity = opacity / 255;
    }

    // 确保在 0-1 范围内
    return Math.max(0, Math.min(1, opacity));
};
