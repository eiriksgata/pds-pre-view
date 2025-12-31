/**
 * PSD 文件解析模块
 * 
 * 提供 PSD 文件的解析功能,包括:
 * - 解析 PSD 文件结构
 * - 提取图层信息
 * - 合成图层组
 * - 过滤隐藏图层
 * - 生成图层预览图
 */

import { readPsd, Psd } from 'ag-psd';
import { canvasToDataURL } from './utils/imageUtils';


/**
 * 递归展平所有图层（包括子图层，排除组）
 * 核心：合成组图层时，确保包含所有可见的子元素（如文字）
 */
const flattenLayers = (children: any[], result: any[] = []): any[] => {
    for (const child of children) {
        // 严格检查可见性
        if (child.hidden === true || child.visible === false) {
            console.log(`[Parser] 跳过隐藏节点: "${child.name}"`);
            continue;
        }

        const isGroup = (child.children && child.children.length > 0) || child.type === 'group';

        if (isGroup) {
            // 递归获取子图层
            const subResult: any[] = [];
            if (child.children) {
                flattenLayers(child.children, subResult);
            }

            // 获取当前组内的可见叶子节点（用于合成）
            let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
            let hasContent = false;

            const getVisibleLeafLayersForGroup = (items: any[], list: any[] = []) => {
                for (const item of items) {
                    if (item.hidden === true || item.visible === false) continue;

                    if (item.children && item.children.length > 0) {
                        getVisibleLeafLayersForGroup(item.children, list);
                    } else {
                        const left = item.left ?? 0;
                        const top = item.top ?? 0;
                        const right = item.right ?? left;
                        const bottom = item.bottom ?? top;
                        const width = right - left;
                        const height = bottom - top;

                        if (item.canvas || width > 0 || height > 0 || item.text) {
                            list.push(item);
                            if (width > 0 && height > 0) {
                                minLeft = Math.min(minLeft, left);
                                minTop = Math.min(minTop, top);
                                maxRight = Math.max(maxRight, right);
                                maxBottom = Math.max(maxBottom, bottom);
                                hasContent = true;
                            }
                        }
                    }
                }
                return list;
            };

            const leafLayers = getVisibleLeafLayersForGroup(child.children || []);

            // 策略调整：如果组内只有一个可见子项，且该项不是组，则不需要再生成“组”级别的预览，避免重复
            const shouldAddGroupPreview = leafLayers.length > 1 || (leafLayers.length === 1 && leafLayers[0].canvas === undefined);

            // 先将所有子项加入结果
            result.push(...subResult);

            // 生成组图层（只有当组内有多个元素或内容有意义时）
            if (hasContent && shouldAddGroupPreview) {
                const groupWidth = maxRight - minLeft;
                const groupHeight = maxBottom - minTop;

                if (groupWidth > 0 && groupHeight > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = groupWidth;
                    canvas.height = groupHeight;
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        for (const layer of leafLayers) {
                            if (layer.canvas) {
                                ctx.save();
                                let opacity = layer.opacity ?? 255;
                                ctx.globalAlpha = opacity > 1 ? opacity / 255 : opacity;
                                ctx.drawImage(layer.canvas, (layer.left ?? 0) - minLeft, (layer.top ?? 0) - minTop);
                                ctx.restore();
                            }
                        }

                        result.push({
                            name: `[Group] ${child.name}`,
                            type: 'group',
                            isGroup: true,
                            visible: true,
                            opacity: child.opacity ?? 255,
                            left: minLeft,
                            right: maxRight,
                            top: minTop,
                            bottom: maxBottom,
                            width: groupWidth,
                            height: groupHeight,
                            imageUrl: canvasToDataURL(canvas),
                        });
                    }
                }
            }
        } else {
            //叶子节点处理
            const left = child.left ?? 0;
            const top = child.top ?? 0;
            const right = child.right ?? left;
            const bottom = child.bottom ?? top;
            const width = child.canvas?.width ?? (right - left);
            const height = child.canvas?.height ?? (bottom - top);

            if (child.name && (child.canvas || width > 0 || height > 0 || child.text)) {
                result.push({
                    name: child.name,
                    type: child.type,
                    isGroup: false,
                    visible: true,
                    opacity: child.opacity ?? 255,
                    blendMode: child.blendMode,
                    left, right, top, bottom, width, height,
                    imageUrl: canvasToDataURL(child.canvas),
                });
            }
        }
    }
    return result;
};

// 后台统一的读取选项
const READ_OPTIONS = {
    skipLayerImageData: false,
    skipThumbnail: false,
    skipComposite: false,
    useCanvas: true,
    useRawData: false
};

/**
 * 解析 PSD 文件
 */
export const parsePSD = async (file: File): Promise<Psd> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(new Uint8Array(arrayBuffer), READ_OPTIONS);
        return psd;
    } catch (error) {
        console.error('PSD 解析错误:', error);
        throw error;
    }
};

/**
 * 从 PSD 文件中提取图层信息
 */
export const extractPSDLayers = async (file: File) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(new Uint8Array(arrayBuffer), READ_OPTIONS);

        const layers = flattenLayers(psd.children || []);

        return {
            width: psd.width,
            height: psd.height,
            layers: layers,
            psdImageUrl: canvasToDataURL(psd.canvas)
        };
    } catch (error) {
        console.error('提取 PSD 图层错误:', error);
        throw error;
    }
};

/**
 * 将 PSD 转换为图像数据
 */
export const renderPSDToImageData = async (file: File) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(new Uint8Array(arrayBuffer), READ_OPTIONS);
        return psd;
    } catch (error) {
        console.error('渲染 PSD 错误:', error);
        throw error;
    }
};

/**
 * 构建层级图层树(保留PSD原有结构)
 * 
 * 递归遍历PSD图层,构建保留层级关系的树形结构,用于按目录结构导出
 * 
 * @param children - PSD子图层数组
 * @param parentPath - 父路径,用于构建完整路径
 * @returns 层级图层树节点数组
 * 
 * @example
 * ```ts
 * const tree = buildLayerTree(psd.children);
 * // tree: [
 * //   { name: 'UI界面', isGroup: true, children: [...] },
 * //   { name: 'logo', isGroup: false, layer: {...} }
 * // ]
 * ```
 */
/**
 * 构建层级图层树(保留PSD原有结构)
 * 
 * @param children - PSD子图层数组
 * @param parentPath - 父路径
 * @param ctx - 共享计数器上下文，用于同步 flattenLayers 的索引
 */
export const buildLayerTree = (
    children: any[],
    parentPath: string = '',
    ctx: { index: number } = { index: 0 }
): any[] => {
    const tree: any[] = [];

    for (const child of children) {
        if (child.hidden === true) continue;

        const isGroup = (child.children && child.children.length > 0) || child.type === 'group';
        const nodePath = parentPath ? `${parentPath}/${child.name}` : child.name;

        if (isGroup) {
            // 获取可见叶子图层（前序逻辑，保持一致）
            let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
            let hasContent = false;
            const getVisibleLeaves = (items: any[], list: any[] = []) => {
                for (const item of items) {
                    if (item.hidden === true || item.visible === false) continue;
                    if (item.children && item.children.length > 0) {
                        getVisibleLeaves(item.children, list);
                    } else {
                        const left = item.left ?? 0;
                        const top = item.top ?? 0;
                        const right = item.right ?? left;
                        const bottom = item.bottom ?? top;
                        if (item.canvas || (right - left) > 0 || (bottom - top) > 0 || item.text) {
                            list.push(item);
                            if ((right - left) > 0 && (bottom - top) > 0) {
                                minLeft = Math.min(minLeft, left);
                                minTop = Math.min(minTop, top);
                                maxRight = Math.max(maxRight, right);
                                maxBottom = Math.max(maxBottom, bottom);
                                hasContent = true;
                            }
                        }
                    }
                }
                return list;
            };

            const leafLayers = getVisibleLeaves(child.children || []);
            const subTree = buildLayerTree(child.children || [], nodePath, ctx);

            let groupImageUrl = null;
            if (hasContent && (maxRight - minLeft) > 0 && (maxBottom - minTop) > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = maxRight - minLeft;
                canvas.height = maxBottom - minTop;
                const ctx2d = canvas.getContext('2d');
                if (ctx2d) {
                    for (const layer of leafLayers) {
                        if (layer.canvas) {
                            ctx2d.save();
                            const opacity = layer.opacity ?? 255;
                            ctx2d.globalAlpha = opacity > 1 ? opacity / 255 : opacity;
                            ctx2d.drawImage(layer.canvas, (layer.left ?? 0) - minLeft, (layer.top ?? 0) - minTop);
                            ctx2d.restore();
                        }
                    }
                    groupImageUrl = canvasToDataURL(canvas);
                }
            }

            // 策略：如果组被合成（子项 > 1 或 混合内容），它在 flattenLayers 中占一个坑
            // 这部分的 index 同步需要非常小心。
            // 在 flattenLayers 中：先加入子项，再加入组预览。
            // 所以我们先递归子树，再分配组索引。

            const groupIndex = ctx.index++;

            tree.push({
                name: child.name,
                path: nodePath,
                isGroup: true,
                imageUrl: groupImageUrl,
                width: hasContent ? maxRight - minLeft : 0,
                height: hasContent ? maxBottom - minTop : 0,
                index: groupIndex, // 组节点也分配索引，以便选中整个组
                children: subTree,
            });
        } else {
            const width = child.canvas?.width ?? ((child.right ?? 0) - (child.left ?? 0));
            const height = child.canvas?.height ?? ((child.bottom ?? 0) - (child.top ?? 0));

            if (child.name && (child.canvas || width > 0 || height > 0 || child.text)) {
                const currentIndex = ctx.index++;
                const layer = {
                    name: child.name,
                    type: child.type,
                    visible: child.visible !== false,
                    opacity: child.opacity ?? 255,
                    blendMode: child.blendMode,
                    left: child.left, right: child.right, top: child.top, bottom: child.bottom,
                    width, height,
                    imageUrl: canvasToDataURL(child.canvas)
                };

                tree.push({
                    name: child.name,
                    path: nodePath,
                    isGroup: false,
                    layer: layer,
                    imageUrl: layer.imageUrl,
                    index: currentIndex,
                    width,
                    height
                });
            }
        }
    }
    return tree;
};

/**
 * 从PSD文件中提取层级图层树
 */
export const extractLayerTree = async (file: File) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const psd = readPsd(new Uint8Array(arrayBuffer), READ_OPTIONS);

        // 为了保证 index 完全一致，我们重写 flattenLayers 让其逻辑与 buildLayerTree 完全镜像
        // 或者直接从 buildLayerTree 结果中提取展平序列。这更稳妥。

        const tree = buildLayerTree(psd.children || []);

        // 展平树以获得顺序一致的图层列表
        const flattened: any[] = [];
        const flattenTree = (nodes: any[]) => {
            for (const node of nodes) {
                if (node.isGroup) {
                    flattenTree(node.children || []);
                    // 组预览排在子项后面 (匹配 flattenLayers 逻辑)
                    if (node.imageUrl) {
                        flattened.push({
                            ...node,
                            name: `[Group] ${node.name}`,
                            type: 'group',
                            isGroup: true
                        });
                    }
                } else {
                    flattened.push(node.layer);
                }
            }
        };
        flattenTree(tree);

        return {
            width: psd.width,
            height: psd.height,
            tree: tree,
            layers: flattened.map((item, idx) => ({ ...item, id: idx })), // 给图层加个固定ID
            psdImageUrl: canvasToDataURL(psd.canvas)
        };
    } catch (error) {
        console.error('提取层级图层树错误:', error);
        throw error;
    }
};
