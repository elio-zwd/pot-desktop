use log::info;

pub fn check_update(_app_handle: tauri::AppHandle) {
    info!("Pot 社区维护版尚未配置自有更新通道，已跳过自动更新检查");
}
