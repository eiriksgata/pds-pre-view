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

/**
 * 从图层树节点递归收集所有可见的叶子图层（用于动态合成组预览）
 * 
 * @param node - 图层树节点
 * @param hiddenLayers - 隐藏的图层索引集合
 * @param result - 结果数组（递归使用）
 * @returns 所有可见叶子图层的数组，每个元素包含 imageUrl、left、top、opacity、width、height 等信息
 */
const collectVisibleLeafLayersFromNode = (
    node: any,
    hiddenLayers: Set<number>,
    result: Array<{ 
        imageUrl: string; 
        left: number; 
        top: number; 
        opacity: number; 
        width: number;
        height: number;
        index?: number 
    }> = []
): Array<{ 
    imageUrl: string; 
    left: number; 
    top: number; 
    opacity: number; 
    width: number;
    height: number;
    index?: number 
}> => {
    // 如果节点被隐藏，跳过
    if (node.index !== undefined && hiddenLayers.has(node.index)) {
        return result;
    }

    if (node.isGroup && node.children) {
        // 如果是组，递归处理子节点
        for (const child of node.children) {
            collectVisibleLeafLayersFromNode(child, hiddenLayers, result);
        }
    } else if (node.layer && node.layer.imageUrl) {
        // 如果是叶子节点且有图片数据，添加到结果
        result.push({
            imageUrl: node.layer.imageUrl,
            left: node.layer.left ?? 0,
            top: node.layer.top ?? 0,
            opacity: node.layer.opacity ?? 255,
            width: node.layer.width ?? 0,
            height: node.layer.height ?? 0,
            index: node.index
        });
    } else if (node.imageUrl && !node.isGroup) {
        // 如果节点本身有图片数据（非组），也添加
        result.push({
            imageUrl: node.imageUrl,
            left: node.layer?.left ?? node.left ?? 0,
            top: node.layer?.top ?? node.top ?? 0,
            opacity: node.layer?.opacity ?? node.opacity ?? 255,
            width: node.layer?.width ?? node.width ?? 0,
            height: node.layer?.height ?? node.height ?? 0,
            index: node.index
        });
    }

    return result;
};

/**
 * 动态生成组的预览图（根据隐藏状态）
 * 
 * @param groupNode - 组节点（LayerTreeNode）
 * @param hiddenLayers - 隐藏的图层索引集合
 * @returns Promise，resolve 时返回生成的预览图 base64 URL，如果无法生成则返回 null
 * 
 * @example
 * ```ts
 * const previewUrl = await generateGroupPreview(groupNode, hiddenLayers);
 * if (previewUrl) {
 *   console.log('预览图已生成');
 * }
 * ```
 */
export const generateGroupPreview = async (
    groupNode: any,
    hiddenLayers: Set<number>
): Promise<string | null> => {
    if (!groupNode || !groupNode.isGroup || !groupNode.children) {
        return null;
    }

    try {
        // 收集所有可见的叶子图层
        const visibleLayers = collectVisibleLeafLayersFromNode(groupNode, hiddenLayers);

        if (visibleLayers.length === 0) {
            // 如果没有可见图层，返回 null
            return null;
        }

        // 计算所有可见图层的包围边界
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (const layer of visibleLayers) {
            // 使用图层的尺寸信息计算边界
            const right = layer.left + layer.width;
            const bottom = layer.top + layer.height;

            if (layer.width > 0 && layer.height > 0) {
                minLeft = Math.min(minLeft, layer.left);
                minTop = Math.min(minTop, layer.top);
                maxRight = Math.max(maxRight, right);
                maxBottom = Math.max(maxBottom, bottom);
            }
        }

        const groupWidth = maxRight - minLeft;
        const groupHeight = maxBottom - minTop;

        if (groupWidth <= 0 || groupHeight <= 0) {
            return null;
        }

        // 创建 canvas 并合成预览图
        const canvas = document.createElement('canvas');
        canvas.width = groupWidth;
        canvas.height = groupHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        // 按顺序绘制所有可见图层
        for (const layer of visibleLayers) {
            // 跳过没有尺寸的图层
            if (layer.width <= 0 || layer.height <= 0) {
                continue;
            }

            try {
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => {
                        // 如果图片加载失败，跳过该图层
                        reject(new Error(`Failed to load image: ${layer.imageUrl}`));
                    };
                    image.src = layer.imageUrl;
                });

                ctx.save();
                // 设置透明度
                const opacity = layer.opacity > 1 ? layer.opacity / 255 : layer.opacity;
                ctx.globalAlpha = opacity;
                // 绘制图片（相对于组的边界）
                ctx.drawImage(img, layer.left - minLeft, layer.top - minTop);
                ctx.restore();
            } catch (error) {
                // 如果某个图层加载失败，继续处理其他图层
                console.warn(`跳过无法加载的图层:`, error);
                continue;
            }
        }

        // 转换为 base64 URL
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('生成组预览图失败:', error);
        return null;
    }
};