/**
 * 图片导出工具模块
 * 
 * 提供图片导出相关的功能,包括单个导出、批量导出等
 * 使用 Tauri API 进行文件系统操作
 */

import { save, open } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { ExportOptions } from '../types';
import { convertImageFormat, base64ToUint8Array, getImageData } from './imageUtils';
import { encodeTga } from './encoders/tga';

/**
 * 清理文件名，移除非法字符
 */
export const sanitizeFileName = (name: string): string => {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')  // 替换非法字符
        .replace(/\s+/g, '_')           // 替换空格
        .trim() || 'untitled';
};

/**
 * 导出图层为图片（使用 Tauri 保存文件）
 * @param imageUrl - 图片的 base64 URL
 * @param fileName - 文件名（不含扩展名）
 */
export const exportLayerImage = async (
    imageUrl: string,
    fileName: string
): Promise<void> => {
    try {
        const safeName = sanitizeFileName(fileName);

        // 使用 Tauri dialog 选择保存路径
        const filePath = await save({
            defaultPath: `${safeName}.png`,
            filters: [{
                name: 'PNG 图片',
                extensions: ['png']
            }]
        });

        if (filePath) {
            // 将 base64 转换为二进制并保存
            const imageData = base64ToUint8Array(imageUrl);
            await writeFile(filePath, imageData);
        }
    } catch (error) {
        console.error('导出失败:', error);
        throw error;
    }
};

/**
 * 批量导出图层到指定文件夹
 * 
 * 让用户选择一个文件夹,然后将所有图层导出为指定格式的文件到该文件夹
 * 
 * @param layers - 要导出的图层数组,每个对象包含 imageUrl 和 name
 * @param options - 导出选项 (格式、质量)
 * @returns Promise,resolve 时返回导出统计信息 { success: 成功数量, failed: 失败数量 }
 */
export const exportLayersToFolder = async (
    layers: Array<{ imageUrl: string; name: string }>,
    options: ExportOptions = { preserveStructure: false, format: 'png' }
): Promise<{ success: number; failed: number }> => {
    // 选择文件夹
    const folderPath = await open({
        directory: true,
        multiple: false,
        title: '选择导出文件夹'
    });

    if (!folderPath || typeof folderPath !== 'string') {
        return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';

    for (const layer of layers) {
        try {
            const safeName = sanitizeFileName(layer.name);
            const targetExt = options.format === 'jpg' ? 'jpg' : options.format;
            const filePath = `${folderPath}\\${safeName}.${targetExt}`;

            // 转换格式
            if (options.format === 'blp') {
                // 使用 Tauri 命令编码 BLP
                const blpData = await invoke<number[]>('encode_blp', {
                    imageDataUrl: layer.imageUrl
                });
                await writeFile(filePath, new Uint8Array(blpData));

            } else if (options.format === 'tga') {
                // TGA (无压缩 32位)
                const imgData = await getImageData(layer.imageUrl);
                const tgaData = encodeTga(imgData);
                await writeFile(filePath, tgaData);

            } else {
                // PNG / JPG
                let finalDataUrl = layer.imageUrl;
                if (options.format === 'jpg' || layer.imageUrl.startsWith('data:image/png')) {
                    const converted = await convertImageFormat(layer.imageUrl, mimeType, options.quality);
                    if (converted) {
                        finalDataUrl = converted;
                    }
                }
                const imageData = base64ToUint8Array(finalDataUrl);
                await writeFile(filePath, imageData);
            }
            success++;
        } catch (error) {
            console.error(`导出 ${layer.name} 失败:`, error);
            failed++;
        }
    }

    return { success, failed };
};
