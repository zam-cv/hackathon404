use anyhow::{Context, Result, anyhow, bail};
use directories::ProjectDirs;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use tracing::{debug, info};

const GITHUB_RELEASES_URL: &str = "https://api.github.com/repos/daijro/camoufox/releases";
const USER_AGENT: &str = "hackathon404-browser/0.1";

#[derive(Debug, Deserialize)]
struct Release {
    tag_name: String,
    assets: Vec<Asset>,
}

#[derive(Debug, Deserialize)]
struct Asset {
    name: String,
    browser_download_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VersionInfo {
    version: String,
    build: String,
    asset: String,
}

pub async fn ensure_camoufox() -> Result<PathBuf> {
    let install_dir = install_dir()?;
    fs::create_dir_all(&install_dir)
        .with_context(|| format!("creating install dir {}", install_dir.display()))?;

    let exe = expected_executable(&install_dir);
    let sentinel = install_dir.join("version.json");

    if sentinel.exists() && exe.exists() {
        debug!(path = %exe.display(), "camoufox already installed, skipping download");
        return Ok(exe);
    }

    let (os_tag, arch_tag) = platform_tags()?;
    info!(os = os_tag, arch = arch_tag, "resolving camoufox release");

    let (release, asset) = find_matching_asset(os_tag, arch_tag).await?;
    let (version, build) = parse_asset_name(&asset.name)
        .ok_or_else(|| anyhow!("could not parse asset name: {}", asset.name))?;

    info!(
        asset = %asset.name,
        url = %asset.browser_download_url,
        "downloading camoufox"
    );

    let zip_path = install_dir.join("download.zip");
    download_to(&asset.browser_download_url, &zip_path).await?;

    info!("extracting camoufox archive");
    extract_zip(&zip_path, &install_dir)?;
    let _ = fs::remove_file(&zip_path);

    fix_permissions(&exe)?;

    let info = VersionInfo {
        version: version.into(),
        build: build.into(),
        asset: asset.name.clone(),
    };
    fs::write(&sentinel, serde_json::to_vec_pretty(&info)?)
        .with_context(|| format!("writing sentinel {}", sentinel.display()))?;

    if !exe.exists() {
        bail!(
            "extraction finished but executable not found at {} (release {})",
            exe.display(),
            release.tag_name
        );
    }

    info!(path = %exe.display(), "camoufox ready");
    Ok(exe)
}

fn install_dir() -> Result<PathBuf> {
    let dirs = ProjectDirs::from("com", "hackathon404", "browser")
        .ok_or_else(|| anyhow!("cannot resolve project dirs for current platform"))?;
    Ok(dirs.cache_dir().join("camoufox"))
}

fn platform_tags() -> Result<(&'static str, &'static str)> {
    let os = match std::env::consts::OS {
        "macos" => "mac",
        "linux" => "lin",
        "windows" => "win",
        other => bail!("unsupported OS: {other}"),
    };
    let arch = match std::env::consts::ARCH {
        "x86_64" => "x86_64",
        "aarch64" => "arm64",
        "x86" => "i686",
        other => bail!("unsupported arch: {other}"),
    };
    match (os, arch) {
        ("win", "arm64") => bail!("camoufox has no win.arm64 build"),
        ("mac", "i686") => bail!("camoufox has no mac.i686 build"),
        _ => Ok((os, arch)),
    }
}

fn expected_executable(install_dir: &Path) -> PathBuf {
    match std::env::consts::OS {
        "macos" => install_dir.join("Camoufox.app/Contents/MacOS/camoufox"),
        "windows" => install_dir.join("camoufox.exe"),
        _ => install_dir.join("camoufox-bin"),
    }
}

async fn find_matching_asset(os_tag: &str, arch_tag: &str) -> Result<(Release, Asset)> {
    let suffix = format!("-{os_tag}.{arch_tag}.zip");
    let client = reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()?;
    let releases: Vec<Release> = client
        .get(GITHUB_RELEASES_URL)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await
        .context("decoding github releases response")?;

    for release in releases {
        if let Some(idx) = release
            .assets
            .iter()
            .position(|a| a.name.starts_with("camoufox-") && a.name.ends_with(&suffix))
        {
            let mut release = release;
            let asset = release.assets.swap_remove(idx);
            return Ok((release, asset));
        }
    }
    bail!("no camoufox release with asset matching *{suffix}");
}

fn parse_asset_name(name: &str) -> Option<(&str, &str)> {
    let stripped = name.strip_prefix("camoufox-")?;
    let dash = stripped.rfind('-')?;
    let head = &stripped[..dash];
    let dash2 = head.rfind('-')?;
    let version = &head[..dash2];
    let build = &head[dash2 + 1..];
    Some((version, build))
}

async fn download_to(url: &str, dest: &Path) -> Result<()> {
    let partial = dest.with_extension("zip.partial");
    if partial.exists() {
        let _ = fs::remove_file(&partial);
    }
    let client = reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()?;
    let resp = client.get(url).send().await?.error_for_status()?;
    let total = resp.content_length().unwrap_or(0);

    let mut file = fs::File::create(&partial)
        .with_context(|| format!("creating {}", partial.display()))?;
    let mut stream = resp.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut next_log = 0u64;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        file.write_all(&chunk)?;
        downloaded += chunk.len() as u64;
        if downloaded >= next_log {
            if total > 0 {
                info!(
                    downloaded_mb = downloaded / 1_048_576,
                    total_mb = total / 1_048_576,
                    "download progress"
                );
            } else {
                info!(downloaded_mb = downloaded / 1_048_576, "download progress");
            }
            next_log = downloaded + 25 * 1_048_576;
        }
    }
    file.flush()?;
    drop(file);

    fs::rename(&partial, dest)
        .with_context(|| format!("rename {} -> {}", partial.display(), dest.display()))?;
    Ok(())
}

fn extract_zip(zip_path: &Path, dest: &Path) -> Result<()> {
    let file = fs::File::open(zip_path)
        .with_context(|| format!("opening zip {}", zip_path.display()))?;
    let mut archive = zip::ZipArchive::new(file).context("reading zip archive")?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let Some(rel) = entry.enclosed_name() else {
            continue;
        };
        let out = dest.join(rel);

        if entry.is_dir() {
            fs::create_dir_all(&out)?;
            continue;
        }
        if let Some(parent) = out.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut writer = fs::File::create(&out)
            .with_context(|| format!("creating {}", out.display()))?;
        io::copy(&mut entry, &mut writer)?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = entry.unix_mode() {
                let _ = fs::set_permissions(&out, fs::Permissions::from_mode(mode));
            }
        }
    }
    Ok(())
}

fn fix_permissions(_exe: &Path) -> Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if _exe.exists() {
            fs::set_permissions(_exe, fs::Permissions::from_mode(0o755))
                .with_context(|| format!("chmod {}", _exe.display()))?;
        }
    }
    Ok(())
}
