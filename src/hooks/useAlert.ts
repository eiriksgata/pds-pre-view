import { useState } from 'react';

/**
 * 提示消息类型
 */
export type AlertType = 'info' | 'success' | 'warning' | 'error';

/**
 * useAlert Hook 返回值接口
 */
export interface UseAlertReturn {
    /** 提示消息内容 */
    alertMessage: string | null;
    /** 提示消息是否可见 */
    isAlertVisible: boolean;
    /** 提示消息类型 */
    alertType: AlertType;
    /** 显示提示消息 */
    showAlert: (message: string, type?: AlertType) => void;
    /** 隐藏提示消息 */
    hideAlert: () => void;
}

/**
 * 提示消息管理 Hook
 * 
 * 用于管理应用中的提示消息状态,支持不同类型的提示(info/success/warning/error)
 * 
 * @returns {UseAlertReturn} 提示消息状态和操作方法
 * 
 * @example
 * ```tsx
 * const { showAlert, hideAlert, isAlertVisible, alertMessage, alertType } = useAlert();
 * 
 * // 显示成功提示
 * showAlert('操作成功!', 'success');
 * 
 * // 显示错误提示
 * showAlert('操作失败,请重试', 'error');
 * ```
 */
export const useAlert = (): UseAlertReturn => {
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<AlertType>('info');

    /**
     * 显示提示消息
     * @param message - 提示消息内容
     * @param type - 提示类型,默认为 'info'
     */
    const showAlert = (message: string, type: AlertType = 'info') => {
        setAlertMessage(message);
        setAlertType(type);
        setIsAlertVisible(true);
    };

    /**
     * 隐藏提示消息
     */
    const hideAlert = () => {
        setIsAlertVisible(false);
        setAlertMessage(null);
    };

    return {
        alertMessage,
        isAlertVisible,
        alertType,
        showAlert,
        hideAlert,
    };
};
