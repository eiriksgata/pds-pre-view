import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ExportOptions } from '../../types';
import './ExportModal.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: ExportOptions) => void;
    title?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, title = '导出配置' }) => {
    const [format, setFormat] = useState<'png' | 'jpg' | 'blp' | 'tga'>('png');
    const [quality, setQuality] = useState(0.9);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            format,
            quality,
            preserveStructure: true
        });
        onClose();
    };


    return createPortal(
        <div className="export-modal-overlay" onClick={onClose}>
            <div className="export-modal" onClick={e => e.stopPropagation()}>
                <div className="export-modal-header">
                    <span className="export-modal-title">⚙️ {title}</span>
                    <button className="export-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="export-modal-body">
                    <div className="form-group">
                        <label className="form-label">图片格式</label>
                        <select
                            className="form-select"
                            value={format}
                            onChange={e => setFormat(e.target.value as 'png' | 'jpg' | 'blp' | 'tga')}
                        >
                            <option value="png">PNG (无损, 支持透明)</option>
                            <option value="jpg">JPG (较小, 有损)</option>
                            <option value="blp">BLP (魔兽争霸3)</option>
                            <option value="tga">TGA (Truevision)</option>
                        </select>
                    </div>

                    {format === 'jpg' && (
                        <div className="form-group">
                            <label className="form-label">图片质量: {Math.round(quality * 100)}%</label>
                            <input
                                type="range"
                                className="form-range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={quality}
                                onChange={e => setQuality(parseFloat(e.target.value))}
                            />
                            <div className="quality-value">
                                <span>低</span>
                                <span>高</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="export-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>取消</button>
                    <button className="btn btn-primary" onClick={handleConfirm}>确认导出</button>
                </div>
            </div>
        </div>,
        document.body
    );


};

export default ExportModal;
