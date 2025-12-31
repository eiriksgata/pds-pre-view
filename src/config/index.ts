/**
 * 应用全局配置
 * 
 * 集中管理应用中的所有配置常量,包括文件类型、文案、UI样式等
 */
export const APP_CONFIG = {
    // 文件相关配置
    FILE: {
        /** 接受的文件扩展名列表 */
        ACCEPTED_EXTENSIONS: ['.psd'],
        /** 文件输入框的 accept 属性值 */
        ACCEPT_TYPE: '.psd',
        /** 最大文件大小(1000MB) */
        MAX_SIZE: 1000 * 1024 * 1024,
    },

    // 文案配置
    TEXT: {
        APP_TITLE: '资源浏览器',
        UPLOAD_BTN: '上传文件',
        PREVIEW_TITLE: '预览窗口',
        PREVIEW_HINT: '请上传 PSD 文件以预览图层',
        LOADING: '正在加载 PSD 文件...',
        SELECT_ALL: '全选',
        EXPORT_BTN: '导出',
        NO_PREVIEW: '此图层无预览图',
        INVALID_FILE_ERROR: '请选择一个有效的 PSD 文件',
        PROCESS_ERROR: '处理 PSD 文件时出错,请确保文件有效',
        NO_EXPORT_IMAGE: '此图层无可导出的图像',
    },

    // 标签配置
    LABELS: {
        SIZE: '尺寸',
        OPACITY: '透明度',
        BLEND_MODE: '混合模式',
    },

    // 默认值配置
    DEFAULTS: {
        BLEND_MODE: 'normal',
        EXPORT_FORMAT: 'png',
    },

    // 预览缩放配置
    ZOOM: {
        /** 最小缩放比例 */
        MIN: 0.1,
        /** 最大缩放比例 */
        MAX: 5,
        /** 默认缩放比例 */
        DEFAULT: 1,
        /** 缩放步进值 */
        STEP: 0.1,
    },

    // UI 配置
    UI: {
        /** 图层卡片默认尺寸 */
        CARD_SIZE: {
            WIDTH: 200,
            HEIGHT: 150,
        },
        /** 网格间距 */
        GRID_GAP: 16,
    },

    // 图层筛选类型
    LAYER_FILTER: {
        ALL: 'all' as const,
        GROUP: 'group' as const,
        TEXT: 'text' as const,
        IMAGE: 'image' as const,
    },
} as const;

/**
 * 图层筛选类型
 */
export type LayerFilterType = typeof APP_CONFIG.LAYER_FILTER[keyof typeof APP_CONFIG.LAYER_FILTER];
