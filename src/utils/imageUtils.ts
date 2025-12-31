/**
 * 图片处理工具模块
 * 
 * 提供图片相关的工具函数,包括格式转换、裁剪等功能
 */

/**
 * 将 Canvas 转换为 base64 图片 URL
 * 
 * @param canvas - 要转换的 Canvas 元素
 * @param format - 图片格式,默认为 'image/png'
 * @param quality - 图片质量(0-1),仅对 'image/jpeg' 和 'image/webp' 有效
 * @returns base64 格式的图片 URL,转换失败返回 null
 * 
 * @example
 * ```ts
 * const canvas = document.createElement('canvas');
 * const imageUrl = canvasToDataURL(canvas);
 * console.log(imageUrl); // "data:image/png;base64,..."
 * ```
 */
export const canvasToDataURL = (
    canvas: HTMLCanvasElement | undefined,
    format: string = 'image/png',
    quality: number = 1.0
): string | null => {
    if (!canvas) return null;

    try {
        return canvas.toDataURL(format, quality);
    } catch (error) {
        console.error('Canvas 转换为 DataURL 失败:', error);
        return null;
    }
};

/**
 * 将 base64 字符串转换为 Uint8Array
 * 
 * @param base64 - base64 格式的字符串
 * @returns Uint8Array 数据
 * 
 * @example
 * ```ts
 * const base64 = "data:image/png;base64,iVBORw0KG...";
 * const bytes = base64ToUint8Array(base64);
 * ```
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
    // 移除 data:image/png;base64, 等前缀
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
};

/**
 * 将 base64 字符串转换为 Blob 对象
 * 
 * @param base64 - base64 格式的字符串
 * @param mimeType - MIME 类型,默认为 'image/png'
 * @returns Blob 对象
 * 
 * @example
 * ```ts
 * const base64 = "data:image/png;base64,iVBORw0KG...";
 * const blob = base64ToBlob(base64);
 * ```
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
    const bytes = base64ToUint8Array(base64);
    return new Blob([bytes as any], { type: mimeType });
};

/**
 * 从图片 URL 创建 Image 对象
 * 
 * @param url - 图片 URL
 * @returns Promise,resolve 时返回加载完成的 Image 对象
 * 
 * @example
 * ```ts
 * const img = await loadImage('data:image/png;base64,...');
 * console.log(img.width, img.height);
 * ```
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

/**
 * 裁剪图片到指定尺寸
 * 
 * @param imageUrl - 图片的 base64 URL
 * @param width - 目标宽度
 * @param height - 目标高度
 * @param mode - 裁剪模式: 'contain' 保持比例完整显示, 'cover' 保持比例填充裁剪
 * @returns Promise,resolve 时返回裁剪后的 base64 URL
 * 
 * @example
 * ```ts
 * const croppedUrl = await cropImage(originalUrl, 800, 600, 'contain');
 * ```
 */
export const cropImage = async (
    imageUrl: string,
    width: number,
    height: number,
    mode: 'contain' | 'cover' = 'contain'
): Promise<string | null> => {
    try {
        const img = await loadImage(imageUrl);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // 计算缩放比例和位置
        const imgRatio = img.width / img.height;
        const targetRatio = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (mode === 'contain') {
            // 保持比例,完整显示图片
            if (imgRatio > targetRatio) {
                drawHeight = width / imgRatio;
                offsetY = (height - drawHeight) / 2;
            } else {
                drawWidth = height * imgRatio;
                offsetX = (width - drawWidth) / 2;
            }
        } else {
            // 保持比例,填充整个画布
            if (imgRatio > targetRatio) {
                drawWidth = height * imgRatio;
                offsetX = (width - drawWidth) / 2;
            } else {
                drawHeight = width / imgRatio;
                offsetY = (height - drawHeight) / 2;
            }
        }

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制图片
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        return canvasToDataURL(canvas);
    } catch (error) {
        console.error('裁剪图片失败:', error);
        return null;
    }
};

/**
 * 调整图片大小
 * 
 * @param imageUrl - 图片的 base64 URL
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns Promise,resolve 时返回调整后的 base64 URL
 * 
 * @example
 * ```ts
 * const resizedUrl = await resizeImage(originalUrl, 1920, 1080);
 * ```
 */
export const resizeImage = async (
    imageUrl: string,
    maxWidth: number,
    maxHeight: number
): Promise<string | null> => {
    try {
        const img = await loadImage(imageUrl);

        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0, width, height);

        return canvasToDataURL(canvas);
    } catch (error) {
        console.error('调整图片大小失败:', error);
        return null;
    }
};
/**
 * 转换图片格式
 * 
 * @param imageUrl - 源图片 base64 URL
 * @param format - 目标格式 ('image/png' | 'image/jpeg')
 * @param quality - 图片质量 (0-1), 仅针对 jpeg
 * @returns Promise, resolve 时返回转换后的 base64 URL
 */
export const convertImageFormat = async (
    imageUrl: string,
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality: number = 1.0
): Promise<string | null> => {
    try {
        const img = await loadImage(imageUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // 如果是 JPG，填充白色背景（防止透明背景变成黑色）
        if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        return canvasToDataURL(canvas, format, quality);
    } catch (error) {
        console.error('格式转换失败:', error);
        return null;
    }
};

/**
 * 获取图片数据的 ImageData 对象
 * 
 * @param url - 图片 URL
 * @returns Promise, 返回 ImageData 对象
 */
export const getImageData = (url: string): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('无法创建 Canvas Context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = url;
    });
};
