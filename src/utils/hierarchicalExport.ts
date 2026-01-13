/**
 * 层级导出工具模块
 * 
 * 提供按照PSD原有层级结构导出图层的功能,
 * 将图层组转换为文件夹,保持原有的目录组织结构
 */

import { open } from '@tauri-apps/plugin-dialog';
import { mkdir, writeFile, exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { LayerTreeNode, ExportOptions } from '../types';
import { sanitizeFileName } from './exportUtils';
import { base64ToUint8Array, convertImageFormat, getImageData } from './imageUtils';
import { encodeTga } from './encoders/tga';

/**
 * 按层级结构导出图层树
 * 
 * 根据PSD的层级结构创建对应的文件夹,并将图层导出为文件
 * 
 * @param tree - 图层树(从buildLayerTree获取)
 * @param options - 导出选项
 * @param hiddenLayers - 隐藏的图层索引集合，这些图层不会被导出
 * @returns Promise,resolve时返回导出统计信息
 * 
 * @example
 * ```ts
 * const tree = await extractLayerTree(psdFile);
 * const result = await exportLayerTreeWithStructure(tree.tree, {
 *   preserveStructure: true,
 *   format: 'png'
 * });
 * console.log(`成功: ${result.success}, 失败: ${result.failed}`);
 * ```
 */
export const exportLayerTreeWithStructure = async (
    tree: LayerTreeNode[],
    options: ExportOptions = { preserveStructure: true, format: 'png' },
    hiddenLayers: Set<number> = new Set()
): Promise<{ success: number; failed: number }> => {
    // 让用户选择根目录
    const rootPath = await open({
        directory: true,
        multiple: false,
        title: '选择导出根目录'
    });

    if (!rootPath || typeof rootPath !== 'string') {
        console.log('[HierarchicalExport] 用户取消选择目录');
        return { success: 0, failed: 0 };
    }

    console.log('[HierarchicalExport] 开始按结构导出, 根目录:', rootPath);

    let success = 0;
    let failed = 0;

    /**
     * 递归导出节点
     * @param node - 当前节点
     * @param currentPath - 当前文件系统路径
     */
    const exportNode = async (node: LayerTreeNode, currentPath: string): Promise<void> => {
        // 检查该节点是否被隐藏
        if (node.index !== undefined && hiddenLayers.has(node.index)) {
            console.log(`[HierarchicalExport] 跳过隐藏图层: ${node.name}`);
            return;
        }

        const safeName = sanitizeFileName(node.name);

        if (node.isGroup && node.children) {
            // 处理组节点 - 创建文件夹并递归处理子节点
            const folderPath = `${currentPath}\\${safeName}`;

            try {
                // 检查文件夹是否存在,不存在则创建
                const folderExists = await exists(folderPath);
                if (!folderExists) {
                    console.log(`[HierarchicalExport] 创建文件夹: ${folderPath}`);
                    await mkdir(folderPath, { recursive: true });
                }

                // 递归处理所有子节点
                for (const child of node.children) {
                    await exportNode(child, folderPath);
                }

                // 检查组是否有合成图，如果有也导出 (作为同名图片文件)
                if (node.layer && node.layer.imageUrl) {
                    const fileName = `${safeName}.${options.format}`;
                    const filePath = `${currentPath}\\${fileName}`;
                    try {
                        console.log(`[HierarchicalExport] 导出组全合成图: ${filePath}`);

                        if (options.format === 'blp') {
                            const blpData = await invoke<number[]>('encode_blp', { imageDataUrl: node.layer.imageUrl });
                            await writeFile(filePath, new Uint8Array(blpData));
                        } else if (options.format === 'tga') {
                            const imgData = await getImageData(node.layer.imageUrl);
                            const tgaData = encodeTga(imgData);
                            await writeFile(filePath, tgaData);
                        } else {
                            let finalDataUrl = node.layer.imageUrl;
                            const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
                            if (options.format === 'jpg' || node.layer.imageUrl.startsWith('data:image/png')) {
                                const converted = await convertImageFormat(node.layer.imageUrl, mimeType, options.quality);
                                if (converted) finalDataUrl = converted;
                            }
                            const imageData = base64ToUint8Array(finalDataUrl);
                            await writeFile(filePath, imageData);
                        }
                        success++;
                    } catch (error) {
                        console.error(`[HierarchicalExport] 导出组合成图失败: ${filePath}`, error);
                        failed++;
                    }
                }
            } catch (error) {
                console.error(`[HierarchicalExport] 创建文件夹失败: ${folderPath}`, error);
                failed++;
            }
        } else if (node.layer && node.layer.imageUrl) {
            // 处理叶子节点 - 导出图层为文件
            const fileName = `${safeName}.${options.format}`;
            const filePath = `${currentPath}\\${fileName}`;

            try {
                console.log(`[HierarchicalExport] 导出文件: ${filePath}`);

                if (options.format === 'blp') {
                    const blpData = await invoke<number[]>('encode_blp', { imageDataUrl: node.layer.imageUrl });
                    await writeFile(filePath, new Uint8Array(blpData));
                } else if (options.format === 'tga') {
                    const imgData = await getImageData(node.layer.imageUrl);
                    const tgaData = encodeTga(imgData);
                    await writeFile(filePath, tgaData);
                } else {
                    let finalDataUrl = node.layer.imageUrl;
                    const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
                    if (options.format === 'jpg' || node.layer.imageUrl.startsWith('data:image/png')) {
                        const converted = await convertImageFormat(node.layer.imageUrl, mimeType, options.quality);
                        if (converted) finalDataUrl = converted;
                    }
                    const imageData = base64ToUint8Array(finalDataUrl);
                    await writeFile(filePath, imageData);
                }
                success++;
            } catch (error) {
                console.error(`[HierarchicalExport] 导出文件失败: ${filePath}`, error);
                failed++;
            }
        } else {
            // 没有图片数据的图层,跳过
            console.warn(`[HierarchicalExport] 跳过无图片数据的图层: ${node.name}`);
        }
    };

    // 从根节点开始导出
    for (const node of tree) {
        await exportNode(node, rootPath);
    }

    console.log(`[HierarchicalExport] 导出完成, 成功: ${success}, 失败: ${failed}`);
    return { success, failed };
};

/**
 * 从图层树中收集所有叶子图层
 * 
 * 递归遍历图层树,收集所有非组节点(叶子节点)
 * 
 * @param tree - 图层树
 * @returns 所有叶子图层节点的数组
 * 
 * @example
 * ```ts
 * const leaves = collectLeafLayersFromTree(tree);
 * console.log(`共有 ${leaves.length} 个图层`);
 * ```
 */
export const collectLeafLayersFromTree = (tree: LayerTreeNode[]): LayerTreeNode[] => {
    const leaves: LayerTreeNode[] = [];

    /**
     * 递归遍历节点
     */
    const traverse = (nodes: LayerTreeNode[]) => {
        for (const node of nodes) {
            if (node.isGroup && node.children) {
                // 如果是组节点,继续遍历子节点
                traverse(node.children);
            } else if (node.layer) {
                // 如果是叶子节点且有图层数据,添加到结果
                leaves.push(node);
            }
        }
    };

    traverse(tree);
    return leaves;
};

/**
 * 统计图层树信息
 * 
 * @param tree - 图层树
 * @returns 统计信息对象
 */
export const getTreeStatistics = (tree: LayerTreeNode[]): {
    totalNodes: number;
    groupNodes: number;
    layerNodes: number;
    maxDepth: number;
} => {
    let totalNodes = 0;
    let groupNodes = 0;
    let layerNodes = 0;
    let maxDepth = 0;

    const traverse = (nodes: LayerTreeNode[], depth: number) => {
        maxDepth = Math.max(maxDepth, depth);

        for (const node of nodes) {
            totalNodes++;

            if (node.isGroup) {
                groupNodes++;
                if (node.children) {
                    traverse(node.children, depth + 1);
                }
            } else {
                layerNodes++;
            }
        }
    };

    traverse(tree, 1);

    return { totalNodes, groupNodes, layerNodes, maxDepth };
};
