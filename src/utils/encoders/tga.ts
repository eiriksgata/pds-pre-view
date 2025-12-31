export const encodeTga = (imageData: ImageData): Uint8Array => {
    const { width, height, data } = imageData;
    const buffer = new Uint8Array(18 + width * height * 4);
    const view = new DataView(buffer.buffer);

    // Header
    view.setUint8(0, 0); // ID length
    view.setUint8(1, 0); // Color map type
    view.setUint8(2, 2); // Image type (Uncompressed True-Color)
    view.setUint16(3, 0, true); // Color map start
    view.setUint16(5, 0, true); // Color map length
    view.setUint8(7, 0); // Color map depth
    view.setUint16(8, 0, true); // X origin
    view.setUint16(10, 0, true); // Y origin
    view.setUint16(12, width, true); // Width
    view.setUint16(14, height, true); // Height
    view.setUint8(16, 32); // Pixel depth (32 bits)
    view.setUint8(17, 8 | 0x20); // Descriptor (8 bits alpha, top-to-bottom)

    // Pixel data (BGRA)
    let offset = 18;
    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];

        buffer[offset++] = b;
        buffer[offset++] = g;
        buffer[offset++] = r;
        buffer[offset++] = a;
    }

    return buffer;
};
