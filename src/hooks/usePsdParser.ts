import { useState } from 'react';
import { extractLayerTree } from '../psd-parser';
import { PsdInfo, Layer, LayerTreeNode } from '../types';

/**
 * usePsdParser Hook 返回值接口
 */
export interface UsePsdParserReturn {
    /** 解析出的图层数据 */
    layers: Layer[];
    /** 图层树结构 */
    layerTree: LayerTreeNode[];
    /** PSD 文件信息 */
    psdInfo: PsdInfo | null;
    /** 是否正在加载 */
    loading: boolean;
    /** 错误信息 */
    error: string | null;
    /** PSD 全图预览 URL */
    psdPreviewUrl: string | null;
    /** 解析 PSD 文件 */
    parsePsdFile: (file: File) => Promise<void>;
    /** 重置状态 */
    reset: () => void;
}

/**
 * PSD 解析管理 Hook
 */
export const usePsdParser = (): UsePsdParserReturn => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [layerTree, setLayerTree] = useState<LayerTreeNode[]>([]);
    const [psdInfo, setPsdInfo] = useState<PsdInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [psdPreviewUrl, setPsdPreviewUrl] = useState<string | null>(null);

    /**
     * 解析 PSD 文件
     * @param file - 要解析的 PSD 文件
     */
    const parsePsdFile = async (file: File): Promise<void> => {
        setLoading(true);
        setError(null);
        setLayers([]);
        setLayerTree([]);
        setPsdInfo(null);
        setPsdPreviewUrl(null);

        try {
            const data = await extractLayerTree(file);
            setLayers(data.layers || []);
            setLayerTree(data.tree || []);
            setPsdInfo({
                name: file.name,
                width: data.width,
                height: data.height,
                version: 1, // 简化的版本
                channels: 3 // 简化的通道
            });
            setPsdPreviewUrl(data.psdImageUrl || null);
        } catch (err) {
            console.error('处理 PSD 文件时出错:', err);
            const errorMessage = err instanceof Error ? err.message : '处理 PSD 文件时出错,请确保文件有效';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLayers([]);
        setLayerTree([]);
        setPsdInfo(null);
        setLoading(false);
        setError(null);
        setPsdPreviewUrl(null);
    };

    return {
        layers,
        layerTree,
        psdInfo,
        loading,
        error,
        psdPreviewUrl,
        parsePsdFile,
        reset,
    };
};
