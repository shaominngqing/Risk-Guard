use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixStream;

use crate::core::protocol::{HookInput, HookOutput};
use crate::daemon::protocol::{DaemonRequest, DaemonResponse};

/// Send an assessment request to the daemon with session isolation.
pub async fn assess(socket_path: &Path, input: &HookInput, session_id: &str) -> Result<HookOutput> {
    let request = DaemonRequest::Assess {
        payload: input.clone(),
        session_id: Some(session_id.to_string()),
    };

    let response = send_request(socket_path, &request).await?;

    match response {
        DaemonResponse::Result { payload, .. } => Ok(payload),
        DaemonResponse::Error { message } => bail!("Daemon error: {}", message),
        other => bail!("Unexpected daemon response: {:?}", other),
    }
}

/// Get the default socket path: `~/.claude/bark.sock`.
pub fn socket_path() -> PathBuf {
    let home = dirs::home_dir().expect("Could not determine home directory");
    home.join(".claude").join("bark.sock")
}

/// Try to spawn the daemon in the background.
/// Returns Ok(()) if the daemon was started or is already running.
pub fn spawn_daemon() -> Result<()> {
    let sock = socket_path();

    // Already running?
    if sock.exists() {
        return Ok(());
    }

    // Spawn `bark daemon` as a detached background process
    let bark_bin = std::env::current_exe().context("cannot find bark binary path")?;

    std::process::Command::new(&bark_bin)
        .arg("daemon")
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .with_context(|| format!("failed to spawn daemon: {:?}", bark_bin))?;

    // Wait briefly for socket to appear
    for _ in 0..20 {
        if sock.exists() {
            return Ok(());
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
    }

    bail!("daemon started but socket not ready after 1s")
}

/// Send a request to the daemon and read the response.
async fn send_request(socket_path: &Path, request: &DaemonRequest) -> Result<DaemonResponse> {
    let stream = UnixStream::connect(socket_path)
        .await
        .with_context(|| format!("failed to connect to daemon at {:?}", socket_path))?;

    let (reader, mut writer) = stream.into_split();

    let mut request_json = serde_json::to_string(request)
        .context("failed to serialize request")?;
    request_json.push('\n');

    writer
        .write_all(request_json.as_bytes())
        .await
        .context("failed to send request to daemon")?;

    writer.flush().await.ok();

    let mut reader = BufReader::new(reader);
    let mut response_line = String::new();

    reader
        .read_line(&mut response_line)
        .await
        .context("failed to read response from daemon")?;

    let response: DaemonResponse = serde_json::from_str(response_line.trim())
        .with_context(|| format!("failed to parse daemon response: {}", response_line.trim()))?;

    Ok(response)
}
