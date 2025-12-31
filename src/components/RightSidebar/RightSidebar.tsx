/**
 * 右侧预览栏组件
 * 
 * 显示选中图层的详细预览
 * 支持平移和缩放
 */

import { Layer } from '../../types';
import { useState, useRef, useEffect } from 'react';
import './RightSidebar.css';

/**
 * RightSidebar 组件属性接口
 */
interface RightSidebarProps {
    /** 当前选中的图层 */
    selectedLayer: Layer | null;
}

/**
 * 右侧预览栏组件
 * 
 * @param props - 组件属性
 */
const RightSidebar = ({ selectedLayer }: RightSidebarProps) => {
    const [zoom, setZoom] = useState(1);
    // 平移偏移量 Ref (绕过 React 渲染)
    const offsetRef = useRef({ x: 0, y: 0 });

    // DOM 引用
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isPanningRef = useRef(false); // 平移拖动
    const lastPosRef = useRef({ x: 0, y: 0 });

    // 更新 DOM 样式的辅助函数
    const updateTransform = (z: number) => {
        if (wrapperRef.current) {
            wrapperRef.current.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${z})`;
        }
    };

    // 当缩放比例改变时，同步更新样式
    useEffect(() => { updateTransform(zoom); }, [zoom]);

    const previewContainerRef = useRef<HTMLDivElement>(null);

    // 处理滚轮缩放 (使用原生事件以支持 preventDefault)
    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom((prev: number) => Math.max(0.1, Math.min(10, prev + delta)));
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, []);

    // 重置视图
    const resetView = () => {
        setZoom(1);
        offsetRef.current = { x: 0, y: 0 };
        updateTransform(1);
    };

    // 平移开始
    const startPanning = (e: React.MouseEvent) => {
        e.preventDefault();
        isPanningRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    // 绑定全局事件监听器
    useEffect(() => {
        let rafId: number;

        const handleMouseMove = (e: MouseEvent) => {
            // 平移逻辑 (直接操作 DOM，避开重绘瓶颈)
            if (isPanningRef.current) {
                const deltaX = e.clientX - lastPosRef.current.x;
                const deltaY = e.clientY - lastPosRef.current.y;
                lastPosRef.current = { x: e.clientX, y: e.clientY };

                offsetRef.current.x += deltaX;
                offsetRef.current.y += deltaY;

                // 使用 requestAnimationFrame 优化
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    updateTransform(zoom);
                });
            }
        };

        const handleMouseUp = () => {
            isPanningRef.current = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            cancelAnimationFrame(rafId);
        };
    }, [zoom]);

    const ZoomSelector = ({ zoom, onZoomChange }: { zoom: number, onZoomChange: (val: number) => void }) => (
        <select
            className="zoom-select"
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
        >
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
            <option value="300">300%</option>
            <option value="400">400%</option>
            <option value="800">800%</option>
            {![25, 50, 75, 100, 150, 200, 300, 400, 800].includes(Math.round(zoom * 100)) && (
                <option value={Math.round(zoom * 100)}>{Math.round(zoom * 100)}%</option>
            )}
        </select>
    );

    return (
        <div className="right-sidebar" ref={containerRef}>
            {/* 选中图层预览区域 */}
            <div className="selected-layer-preview" style={{ height: '100%' }}>
                <div className="section-header">
                    <div className="header-left">
                        <span>🎯 选中图层预览</span>
                        {selectedLayer && <span className="layer-name">{selectedLayer.name}</span>}
                        <ZoomSelector zoom={zoom} onZoomChange={setZoom} />
                    </div>
                    <button className="reset-zoom-btn" onClick={resetView}>重置</button>
                </div>
                <div
                    ref={previewContainerRef}
                    className="preview-container"
                    onMouseDown={startPanning}
                >
                    <div className="operation-guide">
                        <span>🖱️ 拖动: 左键平移</span>
                        <span>🔍 缩放: 鼠标滚轮</span>
                    </div>

                    {selectedLayer ? (
                        selectedLayer.imageUrl ? (
                            <>
                                <div className="layer-info">
                                    <div className="info-item">
                                        <span className="label">尺寸:</span>
                                        <span className="value">{selectedLayer.width} × {selectedLayer.height}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">不透明度:</span>
                                        <span className="value">{Math.round((selectedLayer.opacity / 255) * 100)}%</span>
                                    </div>
                                </div>

                                <div
                                    ref={wrapperRef}
                                    className="image-wrapper"
                                    style={{ transform: `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${zoom})` }}
                                >
                                    <img src={selectedLayer.imageUrl} alt={selectedLayer.name} className="preview-image" />
                                </div>
                            </>
                        ) : (
                            <div className="empty-preview">
                                <div className="empty-icon">🚫</div>
                                <p>此图层无预览图</p>
                            </div>
                        )
                    ) : (
                        <div className="empty-preview">
                            <div className="empty-icon">👆</div>
                            <p>点击左侧图层查看预览</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
