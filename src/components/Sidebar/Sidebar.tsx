import { useRef } from 'react';
import { APP_CONFIG } from '../../config';
import './Sidebar.css';

interface SidebarProps {
    onFileSelect: (file: File) => void;
    onError: (error: string) => void;
}

const Sidebar = ({ onFileSelect, onError }: SidebarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isValidFile = APP_CONFIG.FILE.ACCEPTED_EXTENSIONS.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        );

        if (!isValidFile) {
            onError(APP_CONFIG.TEXT.INVALID_FILE_ERROR);
            return;
        }

        onFileSelect(file);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>{APP_CONFIG.TEXT.APP_TITLE}</h3>
                <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {APP_CONFIG.TEXT.UPLOAD_BTN}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={APP_CONFIG.FILE.ACCEPT_TYPE}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>
            <div className="file-browser" />
        </div>
    );
};

export default Sidebar;
