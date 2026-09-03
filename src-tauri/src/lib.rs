pub mod commands;
pub mod connection;
pub mod keyring;
pub mod profiles;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::add_profile,
            commands::update_profile,
            commands::delete_profile,
            commands::test_connection,
            commands::open_config_dir,
            commands::set_password,
            commands::password_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
