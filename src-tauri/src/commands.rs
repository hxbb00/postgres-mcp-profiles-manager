use crate::connection;
use crate::keyring::{self, KeyringError};
use crate::profiles::{self, Profile};

fn err_msg(e: impl std::fmt::Display) -> String {
    format!("{e}")
}

#[tauri::command]
pub fn list_profiles() -> Result<Vec<Profile>, String> {
    profiles::list_profiles().map_err(err_msg)
}

#[tauri::command]
pub fn add_profile(profile: Profile, password: String) -> Result<Profile, String> {
    // Validate: password may be empty for profiles that don't need one
    profiles::add_profile(&profile).map_err(err_msg)?;
    if !password.is_empty() {
        keyring::set_password(&profile.name, &password).map_err(|e: KeyringError| {
            // rollback profile if keyring write fails
            let _ = profiles::delete_profile(&profile.name);
            format!("Failed to store password: {e}")
        })?;
    }
    Ok(profile)
}

#[tauri::command]
pub fn update_profile(profile: Profile, password: Option<String>) -> Result<Profile, String> {
    profiles::update_profile(&profile).map_err(err_msg)?;
    if let Some(pw) = password {
        if !pw.is_empty() {
            keyring::set_password(&profile.name, &pw).map_err(err_msg)?;
        }
    }
    Ok(profile)
}

#[tauri::command]
pub fn delete_profile(name: String) -> Result<(), String> {
    // remove keyring entry first (ignore not-found on keyring side)
    let _ = keyring::delete_password(&name);
    profiles::delete_profile(&name).map_err(err_msg)
}

#[tauri::command]
pub async fn test_connection(
    profile: Profile,
    password: Option<String>,
) -> Result<String, String> {
    let pw = match password {
        Some(p) if !p.is_empty() => Some(p),
        _ => keyring::get_password(&profile.name).ok().flatten(),
    };
    connection::test_connection(&profile, pw).await
}

#[tauri::command]
pub fn open_config_dir() -> Result<(), String> {
    let path = profiles::profiles_path().map_err(err_msg)?;
    let dir = path.parent().ok_or("config dir not found")?;
    std::fs::create_dir_all(dir).map_err(err_msg)?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(dir).spawn().map_err(err_msg)?;
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(dir).spawn().map_err(err_msg)?;
    #[cfg(all(unix, not(target_os = "macos")))]
    std::process::Command::new("xdg-open").arg(dir).spawn().map_err(err_msg)?;
    Ok(())
}

#[tauri::command]
pub fn set_password(name: String, password: String) -> Result<(), String> {
    if password.is_empty() {
        return Err("Password cannot be empty".into());
    }
    keyring::set_password(&name, &password).map_err(err_msg)
}

#[tauri::command]
pub fn password_status() -> Result<Vec<String>, String> {
    let profiles = profiles::list_profiles().map_err(err_msg)?;
    let mut with_password = Vec::new();
    for p in profiles {
        if let Ok(Some(_)) = keyring::get_password(&p.name) {
            with_password.push(p.name);
        }
    }
    Ok(with_password)
}
