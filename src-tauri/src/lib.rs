use base64::{engine::general_purpose, Engine as _};
use image_blp::convert::{image_to_blp, BlpOldFormat, BlpTarget, FilterType};
use image_blp::encode::encode_blp as blp_encode;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 将 base64 图片数据编码为 BLP 格式
///
/// # 参数
/// * `image_data_url` - base64 编码的图片数据 URL (如 "data:image/png;base64,...")
///
/// # 返回
/// * `Ok(Vec<u8>)` - BLP 格式的字节数组
/// * `Err(String)` - 错误信息
#[tauri::command]
fn encode_blp(image_data_url: String) -> Result<Vec<u8>, String> {
    // 解析 data URL,提取 base64 部分
    let base64_data = image_data_url
        .split(',')
        .nth(1)
        .ok_or("Invalid data URL format")?;

    // 解码 base64
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // 使用 image crate 加载图片
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // 转换为 BLP (使用 BLP1 Jpeg 格式,魔兽争霸3标准格式)
    let make_mipmaps = false; // 不生成 mipmap 以简化
    let blp = image_to_blp(
        img,
        make_mipmaps,
        BlpTarget::Blp1(BlpOldFormat::Jpeg {
            has_alpha: true, // 支持 alpha 通道
        }),
        FilterType::Nearest,
    )
    .map_err(|e| format!("Failed to convert to BLP: {}", e))?;

    // 编码为字节数组
    let encoded = blp_encode(&blp).map_err(|e| format!("Failed to encode BLP: {}", e))?;

    Ok(encoded)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, encode_blp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
