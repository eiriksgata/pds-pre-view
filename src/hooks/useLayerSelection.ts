import { useState, useMemo } from 'react';

/**
 * useLayerSelection Hook 返回值接口
 */
export interface UseLayerSelectionReturn {
    /** 已选中的图层索引集合 */
    selectedIndexes: Set<number>;
    /** 切换指定索引的选中状态 */
    toggleSelection: (index: number) => void;
    /** 全选/取消全选所有图层 */
    toggleSelectAll: (totalCount: number) => void;
    /** 批量设置选中状态 */
    setSelectedIndexes: (indexes: Set<number>) => void;
    /** 清空所有选中 */
    clearSelection: () => void;
    /** 判断指定索引是否已选中 */
    isSelected: (index: number) => boolean;
    /** 已选中的数量 */
    selectedCount: number;
}

/**
 * 图层选择管理 Hook
 * 
 * 用于管理图层的多选状态,支持单选、全选、批量选择等操作
 * 
 * @returns {UseLayerSelectionReturn} 选择状态和操作方法
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIndexes, 
 *   toggleSelection, 
 *   toggleSelectAll,
 *   selectedCount 
 * } = useLayerSelection();
 * 
 * // 切换单个图层的选中状态
 * toggleSelection(0);
 * 
 * // 全选/取消全选
 * toggleSelectAll(layers.length);
 * 
 * // 检查是否选中
 * console.log(selectedIndexes.has(0));
 * ```
 */
export const useLayerSelection = (): UseLayerSelectionReturn => {
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

    /**
     * 切换指定索引的选中状态
     * @param index - 图层索引
     */
    const toggleSelection = (index: number) => {
        setSelectedIndexes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    /**
     * 全选/取消全选所有图层
     * @param totalCount - 图层总数
     */
    const toggleSelectAll = (totalCount: number) => {
        if (selectedIndexes.size === totalCount) {
            // 如果已全选,则取消全选
            setSelectedIndexes(new Set());
        } else {
            // 否则全选
            setSelectedIndexes(new Set(Array.from({ length: totalCount }, (_, i) => i)));
        }
    };

    /**
     * 清空所有选中
     */
    const clearSelection = () => {
        setSelectedIndexes(new Set());
    };

    /**
     * 判断指定索引是否已选中
     * @param index - 图层索引
     */
    const isSelected = (index: number): boolean => {
        return selectedIndexes.has(index);
    };

    /**
     * 已选中的数量,使用 useMemo 避免重复计算
     */
    const selectedCount = useMemo(() => selectedIndexes.size, [selectedIndexes]);

    return {
        selectedIndexes,
        toggleSelection,
        toggleSelectAll,
        setSelectedIndexes,
        clearSelection,
        isSelected,
        selectedCount,
    };
};
