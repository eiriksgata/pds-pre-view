
/**
 * Simple BLP1 (JPEG Content) Encoder
 * 
 * Writes a minimal BLP1 header enclosing a standard JPEG image.
 * This does not support paletted textures or mipmaps generation (uses 1 mipmap).
 */
export const encodeBlp = (jpegData: Uint8Array, width: number, height: number): Uint8Array => {
    const headerSize = 156;
    const fileSize = headerSize + jpegData.length;
    const buffer = new Uint8Array(fileSize);
    const view = new DataView(buffer.buffer);

    // 0: Magic "BLP1"
    view.setUint8(0, 0x42); // B
    view.setUint8(1, 0x4C); // L
    view.setUint8(2, 0x50); // P
    view.setUint8(3, 0x31); // 1

    // 4: Type (0 = JPEG)
    view.setUint32(4, 0, true);

    // 8: Alpha Bits (0)
    // Some docs say 0x00000008 for 8-bit alpha, but our JPEG has no alpha channel.
    view.setUint32(8, 0, true);

    // 12: Width
    view.setUint32(12, width, true);

    // 16: Height
    view.setUint32(16, height, true);

    // 20: Flags (5 is common for JPEG content)
    view.setUint32(20, 5, true);

    // 24: PictureSubType (1 = ?) 
    view.setUint32(24, 1, true);

    // 28: Mipmap Offsets (16 * 4)
    // Offset 0 points to our data
    view.setUint32(28, headerSize, true);
    // Others 0

    // 92: Mipmap Lengths (16 * 4)
    // Length 0 is our data length
    view.setUint32(92, jpegData.length, true);
    // Others 0

    // Copy JPEG data
    buffer.set(jpegData, headerSize);

    return buffer;
};
