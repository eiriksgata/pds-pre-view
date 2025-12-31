import { useEffect } from 'react';
import './AlertModal.css';

interface AlertModalProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: 'info' | 'success' | 'warning' | 'error';
}

const AlertModal = ({ message, isVisible, onClose, type = 'info' }: AlertModalProps) => {
    useEffect(() => {
        if (isVisible) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="alert-modal-overlay" onClick={onClose}>
            <div className={`alert-modal alert-modal-${type}`} onClick={e => e.stopPropagation()}>
                <div className="alert-modal-content">
                    <p>{message}</p>
                </div>
                <div className="alert-modal-actions">
                    <button className="alert-modal-btn" onClick={onClose}>
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
