import { useRef } from 'react';

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

    return {
        fileInputRef,
        triggerFileSelect,
        handleFileChange,
        validateFile,
    };
};
