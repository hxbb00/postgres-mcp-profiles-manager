use keyring::Entry;

pub const SERVICE_NAME: &str = "postgres-mcp";

#[derive(Debug, thiserror::Error)]
pub enum KeyringError {
    #[error("keyring error: {0}")]
    Keyring(#[from] keyring::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("password not found for '{0}'")]
    NotFound(String),
}

fn entry(profile_name: &str) -> Entry {
    Entry::new(SERVICE_NAME, profile_name).expect("valid keyring service/account")
}

pub fn set_password(profile_name: &str, password: &str) -> Result<(), KeyringError> {
    entry(profile_name).set_password(password)?;
    Ok(())
}

pub fn get_password(profile_name: &str) -> Result<Option<String>, KeyringError> {
    match entry(profile_name).get_password() {
        Ok(pw) => Ok(Some(pw)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn delete_password(profile_name: &str) -> Result<(), KeyringError> {
    match entry(profile_name).delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_and_get_password_roundtrip() {
        if let Err(_) = set_password("test_roundtrip_app", "hunter2") {
            // CI environments may lack a keyring backend; skip gracefully
            return;
        }
        let got = get_password("test_roundtrip_app").unwrap();
        assert_eq!(got.as_deref(), Some("hunter2"));
        delete_password("test_roundtrip_app").unwrap();
    }

    #[test]
    fn get_missing_returns_none() {
        let got = get_password("definitely_not_a_real_profile_xyz").unwrap();
        assert_eq!(got, None);
    }
}
