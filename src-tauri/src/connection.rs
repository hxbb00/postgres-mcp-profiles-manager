use crate::profiles::{Profile, SslMode};
use std::error::Error as _;
use std::time::Duration;
use tokio_postgres::NoTls;
use tokio_postgres::config::SslMode as PgSslMode;

/// Render an error with its full source chain, since `tokio_postgres::Error`'s
/// Display only shows the kind (e.g. "invalid configuration") and hides the
/// actionable cause (e.g. "password missing").
fn describe_error(e: &tokio_postgres::Error) -> String {
    let mut msg = e.to_string();
    let mut source = e.source();
    while let Some(cause) = source {
        msg.push_str(": ");
        msg.push_str(&cause.to_string());
        source = cause.source();
    }
    msg
}

pub async fn test_connection(profile: &Profile, password: Option<String>) -> Result<String, String> {
    let mut config = tokio_postgres::Config::new();
    config.host(&profile.host);
    config.port(profile.port);
    config.user(&profile.user);
    config.dbname(&profile.database);
    config.ssl_mode(ssl_mode_mapping(profile.ssl_mode));
    if let Some(pw) = &password {
        config.password(pw);
    }

    let (client, connection) = config
        .connect_timeout(Duration::from_secs(5))
        .connect(NoTls)
        .await
        .map_err(|e| format!("Connection failed: {}", describe_error(&e)))?;

    // Drive the connection future to completion in the background
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {e}");
        }
    });

    // Verify we can actually run a query
    client
        .simple_query("SELECT 1")
        .await
        .map_err(|e| format!("Query failed: {}", describe_error(&e)))?;

    Ok(format!(
        "Connected to database '{}' on {}:{} as {}",
        profile.database, profile.host, profile.port, profile.user
    ))
}

fn ssl_mode_mapping(mode: SslMode) -> PgSslMode {
    // tokio-postgres only exposes Disable/Prefer/Require. With NoTls, any mode
    // other than Disable will fail at connect time with a descriptive error,
    // so map the unsupported variants to their nearest supported equivalents.
    match mode {
        SslMode::Disable => PgSslMode::Disable,
        SslMode::Allow => PgSslMode::Prefer,
        SslMode::Prefer => PgSslMode::Prefer,
        SslMode::Require => PgSslMode::Require,
        SslMode::VerifyCa => PgSslMode::Require,
        SslMode::VerifyFull => PgSslMode::Require,
    }
}
