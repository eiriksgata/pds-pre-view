import { useRef, useState, useCallback } from 'react';

/**
 * 文件验证配置接口
 */
export interface FileValidationConfig {
    /** 允许的文件扩展名列表 */
    acceptedExtensions: string[];
    /** 最大文件大小(字节),可选 */
    maxSize?: number;
}

/**
 * useFileUpload Hook 返回值接口
 */
export interface UseFileUploadReturn {
    /** 文件输入框引用 */
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    /** 触发文件选择对话框 */
    triggerFileSelect: () => void;
    /** 处理文件选择事件 */
    handleFileChange: (
        event: React.ChangeEvent<HTMLInputElement>,
        onSuccess: (file: File) => void,
        onError: (message: string) => void
    ) => void;
    /** 验证文件是否有效 */
    validateFile: (file: File) => { valid: boolean; error?: string };
    /** 是否正在拖拽 */
    isDragging: boolean;
    /** 拖拽事件处理器 */
    dragHandlers: {
        onDragEnter: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent, onSuccess: (file: File) => void, onError: (message: string) => void) => void;
    };
}

/**
 * 文件上传管理 Hook
 * 
 * 用于处理文件上传相关的逻辑,包括文件选择、验证等
 * 
 * @param config - 文件验证配置
 * @returns {UseFileUploadReturn} 文件上传相关的方法和引用
 * 
 * @example
 * ```tsx
 * const { fileInputRef, triggerFileSelect, handleFileChange } = useFileUpload({
 *   acceptedExtensions: ['.psd'],
 *   maxSize: 100 * 1024 * 1024 // 100MB
 * });
 * 
 * // 触发文件选择
 * <button onClick={triggerFileSelect}>选择文件</button>
 * 
 * // 文件输入框
 * <input 
 *   ref={fileInputRef}
 *   type="file"
 *   onChange={(e) => handleFileChange(e, onSuccess, onError)}
 * />
 * ```
 */
export const useFileUpload = (config: FileValidationConfig): UseFileUploadReturn => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0); // 用于处理拖拽进入/离开事件（避免子元素触发）

    /**
     * 触发文件选择对话框
     */
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    /**
     * 验证文件是否有效
     * @param file - 要验证的文件
     * @returns 验证结果,包含是否有效和错误信息
     */
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        // 检查文件扩展名
        const isValidExtension = config.acceptedExtensions.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        );

        if (!isValidExtension) {
            return {
                valid: false,
                error: `请选择有效的文件类型: ${config.acceptedExtensions.join(', ')}`,
            };
        }

        // 检查文件大小(如果配置了最大大小)
        if (config.maxSize && file.size > config.maxSize) {
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `文件大小不能超过 ${maxSizeMB} MB`,
            };
        }

        return { valid: true };
    };

    /**
     * 处理文件选择事件
     * @param event - 文件输入框的 change 事件
     * @param onSuccess - 文件验证成功的回调函数
     * @param onError - 文件验证失败的回调函数
     */
    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        onSuccess: (file: File) => void,
        onError: (message: string) => void
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file);
        if (!validation.valid) {
            onError(validation.error!);
            return;
        }

        onSuccess(file);

        // 重置 input,允许重复选择同一文件
        event.target.value = '';
    };

    /**
     * 处理拖拽进入事件
     */
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        console.log('[Drag] onDragEnter 触发', {
            items: e.dataTransfer?.items?.length,
            files: e.dataTransfer?.files?.length,
            types: Array.from(e.dataTransfer?.types || [])
        });
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        console.log('[Drag] dragCounterRef.current:', dragCounterRef.current);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            console.log('[Drag] 设置 isDragging = true');
            setIsDragging(true);
        } else {
            console.log('[Drag] 没有检测到文件项，跳过设置 isDragging');
        }
    }, []);

    /**
     * 处理拖拽悬停事件
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    /**
     * 处理拖拽离开事件
     */
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        console.log('[Drag] onDragLeave 触发', {
            currentTarget: e.currentTarget,
            relatedTarget: e.relatedTarget,
            dragCounterBefore: dragCounterRef.current
        });
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        console.log('[Drag] dragCounterRef.current 减为:', dragCounterRef.current);
        if (dragCounterRef.current === 0) {
            console.log('[Drag] 设置 isDragging = false');
            setIsDragging(false);
        }
    }, []);

    /**
     * 处理拖拽放下事件
     */
    const handleDrop = useCallback((
        e: React.DragEvent,
        onSuccess: (file: File) => void,
        onError: (message: string) => void
    ) => {
        console.log('[Drag] onDrop 触发', {
            files: e.dataTransfer?.files?.length,
            items: e.dataTransfer?.items?.length,
            types: Array.from(e.dataTransfer?.types || []),
            hasOnSuccess: !!onSuccess,
            hasOnError: !!onError
        });
        
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounterRef.current = 0;

        const files = e.dataTransfer.files;
        console.log('[Drag] 文件列表:', {
            length: files?.length,
            files: files ? Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })) : []
        });

        if (!files || files.length === 0) {
            console.warn('[Drag] 没有检测到文件，退出');
            return;
        }

        // 只处理第一个文件
        const file = files[0];
        console.log('[Drag] 处理文件:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });

        // 内联验证逻辑，避免依赖问题
        console.log('[Drag] 配置信息:', {
            acceptedExtensions: config.acceptedExtensions,
            maxSize: config.maxSize
        });

        const isValidExtension = config.acceptedExtensions.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        );

        console.log('[Drag] 文件扩展名验证:', {
            fileName: file.name,
            isValidExtension,
            checkedExtensions: config.acceptedExtensions
        });

        if (!isValidExtension) {
            const errorMsg = `请选择有效的文件类型: ${config.acceptedExtensions.join(', ')}`;
            console.error('[Drag] 文件类型验证失败:', errorMsg);
            if (onError) {
                onError(errorMsg);
            } else {
                console.error('[Drag] onError 回调不存在！');
            }
            return;
        }

        if (config.maxSize && file.size > config.maxSize) {
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
            const errorMsg = `文件大小不能超过 ${maxSizeMB} MB`;
            console.error('[Drag] 文件大小验证失败:', errorMsg, {
                fileSize: file.size,
                maxSize: config.maxSize
            });
            if (onError) {
                onError(errorMsg);
            } else {
                console.error('[Drag] onError 回调不存在！');
            }
            return;
        }

        console.log('[Drag] 文件验证通过，调用 onSuccess');
        if (onSuccess) {
            console.log('[Drag] 调用 onSuccess 回调');
            onSuccess(file);
        } else {
            console.error('[Drag] onSuccess 回调不存在！');
        }
    }, [config]);

    return {
        fileInputRef,
        triggerFileSelect,
        handleFileChange,
        validateFile,
        isDragging,
        dragHandlers: {
            onDragEnter: handleDragEnter,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
        },
    };
};
