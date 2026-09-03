use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("config directory not found")]
    NoConfigDir,
    #[error("profile '{0}' not found")]
    NotFound(String),
    #[error("profile '{0}' already exists")]
    Duplicate(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("yaml error: {0}")]
    Yaml(#[from] serde_yaml::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SslMode {
    Disable,
    Allow,
    Prefer,
    Require,
    VerifyCa,
    VerifyFull,
}

impl SslMode {
    pub fn as_postgres_str(&self) -> &'static str {
        match self {
            SslMode::Disable => "disable",
            SslMode::Allow => "allow",
            SslMode::Prefer => "prefer",
            SslMode::Require => "require",
            SslMode::VerifyCa => "verify-ca",
            SslMode::VerifyFull => "verify-full",
        }
    }
}

impl Default for SslMode {
    fn default() -> Self {
        SslMode::Prefer
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AccessMode {
    Ro,
    Rw,
}

impl Default for AccessMode {
    fn default() -> Self {
        AccessMode::Rw
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Profile {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub database: String,
    #[serde(default)]
    pub ssl_mode: SslMode,
    #[serde(default)]
    pub access_mode: AccessMode,
    /// Unknown fields (e.g. `is_azure` from postgres-mcp) are captured here
    /// and preserved verbatim when the file is written back.
    #[serde(default, flatten)]
    pub extra: std::collections::BTreeMap<String, serde_yaml::Value>,
}

impl Default for Profile {
    fn default() -> Self {
        Self {
            name: String::new(),
            host: String::from("localhost"),
            port: 5432,
            user: String::from("postgres"),
            database: String::from("postgres"),
            ssl_mode: SslMode::default(),
            access_mode: AccessMode::default(),
            extra: std::collections::BTreeMap::new(),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct ProfilesFile {
    connections: Vec<Profile>,
}

pub fn profiles_path() -> Result<PathBuf, StoreError> {
    let dir = dirs::home_dir().ok_or(StoreError::NoConfigDir)?;
    Ok(dir.join(".postgres-mcp").join("connections.yaml"))
}

pub fn list_profiles() -> Result<Vec<Profile>, StoreError> {
    list_profiles_from(&profiles_path()?)
}

fn list_profiles_from(path: &Path) -> Result<Vec<Profile>, StoreError> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = std::fs::read_to_string(path)?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let file: ProfilesFile = serde_yaml::from_str(&content)?;
    Ok(file.connections)
}

pub fn add_profile(profile: &Profile) -> Result<(), StoreError> {
    let path = profiles_path()?;
    add_profile_to(&path, profile)
}

fn add_profile_to(path: &Path, profile: &Profile) -> Result<(), StoreError> {
    let mut list = list_profiles_from(path)?;
    if list.iter().any(|p| p.name == profile.name) {
        return Err(StoreError::Duplicate(profile.name.clone()));
    }
    list.push(profile.clone());
    write_profiles(path, &list)
}

pub fn update_profile(profile: &Profile) -> Result<(), StoreError> {
    let path = profiles_path()?;
    update_profile_to(&path, profile)
}

fn update_profile_to(path: &Path, profile: &Profile) -> Result<(), StoreError> {
    let mut list = list_profiles_from(path)?;
    let idx = list
        .iter()
        .position(|p| p.name == profile.name)
        .ok_or_else(|| StoreError::NotFound(profile.name.clone()))?;
    list[idx] = profile.clone();
    write_profiles(path, &list)
}

pub fn delete_profile(name: &str) -> Result<(), StoreError> {
    let path = profiles_path()?;
    delete_profile_from(&path, name)
}

fn delete_profile_from(path: &Path, name: &str) -> Result<(), StoreError> {
    let mut list = list_profiles_from(path)?;
    let idx = list
        .iter()
        .position(|p| p.name == name)
        .ok_or_else(|| StoreError::NotFound(name.to_string()))?;
    list.remove(idx);
    write_profiles(path, &list)
}

fn write_profiles(path: &Path, list: &[Profile]) -> Result<(), StoreError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let file = ProfilesFile {
        connections: list.to_vec(),
    };
    let yaml = serde_yaml::to_string(&file)?;
    std::fs::write(path, yaml)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_dir() -> tempfile::TempDir {
        tempdir().unwrap()
    }

    #[test]
    fn list_empty_returns_empty_vec() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let result = list_profiles_from(&path);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn add_then_list_roundtrip() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let p = Profile { name: "local".into(), host: "localhost".into(), port: 5432, user: "postgres".into(), database: "mydb".into(), ssl_mode: SslMode::Prefer, access_mode: AccessMode::Rw, extra: Default::default() };
        add_profile_to(&path, &p).unwrap();
        let list = list_profiles_from(&path).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "local");
        assert_eq!(list[0].host, "localhost");
        assert_eq!(list[0].port, 5432);
        assert_eq!(list[0].database, "mydb");
        assert!(matches!(list[0].ssl_mode, SslMode::Prefer));
        assert!(matches!(list[0].access_mode, AccessMode::Rw));
    }

    #[test]
    fn add_duplicate_errors() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let a = Profile { name: "dup".into(), host: "h1".into(), port: 5432, user: "u".into(), database: "d".into(), ssl_mode: SslMode::Disable, access_mode: AccessMode::Rw, extra: Default::default() };
        let b = Profile { name: "dup".into(), host: "h2".into(), port: 5433, user: "u2".into(), database: "d2".into(), ssl_mode: SslMode::Prefer, access_mode: AccessMode::Ro, extra: Default::default() };
        add_profile_to(&path, &a).unwrap();
        assert!(matches!(add_profile_to(&path, &b), Err(StoreError::Duplicate(_))));
        // list still has 1
        assert_eq!(list_profiles_from(&path).unwrap().len(), 1);
    }

    #[test]
    fn update_existing_and_missing() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let a = Profile { name: "p1".into(), host: "h1".into(), port: 5432, user: "u".into(), database: "d".into(), ssl_mode: SslMode::Disable, access_mode: AccessMode::Rw, extra: Default::default() };
        add_profile_to(&path, &a).unwrap();
        let mut edited = a.clone();
        edited.port = 9999;
        update_profile_to(&path, &edited).unwrap();
        let list = list_profiles_from(&path).unwrap();
        assert_eq!(list[0].port, 9999);

        let missing = Profile { name: "nope".into(), host: "h".into(), port: 1, user: "u".into(), database: "d".into(), ssl_mode: SslMode::Disable, access_mode: AccessMode::Rw, extra: Default::default() };
        assert!(matches!(update_profile_to(&path, &missing), Err(StoreError::NotFound(_))));
    }

    #[test]
    fn delete_existing_and_missing() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let a = Profile { name: "del".into(), host: "h".into(), port: 5432, user: "u".into(), database: "d".into(), ssl_mode: SslMode::Disable, access_mode: AccessMode::Rw, extra: Default::default() };
        add_profile_to(&path, &a).unwrap();
        delete_profile_from(&path, "del").unwrap();
        assert_eq!(list_profiles_from(&path).unwrap().len(), 0);
        assert!(matches!(delete_profile_from(&path, "del"), Err(StoreError::NotFound(_))));
    }

    #[test]
    fn yaml_serialization_uses_lowercase_strings() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        let p = Profile { name: "x".into(), host: "h".into(), port: 5432, user: "u".into(), database: "d".into(), ssl_mode: SslMode::VerifyCa, access_mode: AccessMode::Ro, extra: Default::default() };
        add_profile_to(&path, &p).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("ssl_mode: verify-ca"));
        assert!(content.contains("access_mode: ro"));
    }

    #[test]
    fn add_creates_missing_directory() {
        let dir = test_dir();
        // point at a nested path whose parent does not exist yet
        let path = dir.path().join("a").join("b").join("connections.yaml");
        let p = Profile { name: "auto".into(), host: "localhost".into(), port: 5432, user: "u".into(), database: "d".into(), ssl_mode: SslMode::Prefer, access_mode: AccessMode::Rw, extra: Default::default() };
        add_profile_to(&path, &p).unwrap();
        assert!(path.exists());
        let list = list_profiles_from(&path).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "auto");
    }

    #[test]
    fn parses_postgres_mcp_format_without_optional_fields() {
        // Real postgres-mcp files omit ssl_mode/access_mode and carry is_azure.
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        std::fs::write(
            &path,
            "connections:\n- name: example-dev\n  host: 192.0.2.10\n  port: 5432\n  database: mydb\n  user: postgres\n  is_azure: false\n",
        )
        .unwrap();
        let list = list_profiles_from(&path).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "example-dev");
        assert!(matches!(list[0].ssl_mode, SslMode::Prefer));
        assert!(matches!(list[0].access_mode, AccessMode::Rw));
    }

    #[test]
    fn unknown_fields_preserved_on_roundtrip() {
        let dir = test_dir();
        let path = dir.path().join("connections.yaml");
        std::fs::write(
            &path,
            "connections:\n- name: x\n  host: h\n  port: 5432\n  database: d\n  user: u\n  is_azure: true\n",
        )
        .unwrap();
        let list = list_profiles_from(&path).unwrap();
        assert_eq!(
            list[0].extra.get("is_azure"),
            Some(&serde_yaml::Value::Bool(true))
        );
        // Writing back must not drop the unknown field
        write_profiles(&path, &list).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("is_azure: true"));
    }
}
