import { Layer } from '../../types';
import { APP_CONFIG } from '../../config';
import './LayerModal.css';

interface LayerModalProps {
    layer: Layer;
    onClose: () => void;
}

const LayerModal = ({ layer, onClose }: LayerModalProps) => {
    const handleOverlayClick = () => {
        onClose();
    };

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={handleContentClick}>
                <div className="modal-header">
                    <h3>{layer.name}</h3>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    {layer.imageUrl ? (
                        <img src={layer.imageUrl} alt={layer.name} />
                    ) : (
                        <div className="no-preview">{APP_CONFIG.TEXT.NO_PREVIEW}</div>
                    )}
                </div>
                <div className="modal-footer">
                    <span>
                        {APP_CONFIG.LABELS.SIZE}: {layer.width} × {layer.height}
                    </span>
                    <span>
                        {APP_CONFIG.LABELS.OPACITY}: {layer.opacity}%
                    </span>
                    <span>
                        {APP_CONFIG.LABELS.BLEND_MODE}: {layer.blendMode || APP_CONFIG.DEFAULTS.BLEND_MODE}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LayerModal;
