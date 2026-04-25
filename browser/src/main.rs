mod camoufox;

use playwright_rs::{LaunchOptions, Playwright};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let camoufox_path = camoufox::ensure_camoufox().await?;
    let executable_path = camoufox_path
        .to_str()
        .ok_or_else(|| anyhow::anyhow!("camoufox path is not valid UTF-8"))?
        .to_owned();

    let pw = Playwright::launch().await?;
    let browser = pw
        .firefox()
        .launch_with_options(LaunchOptions {
            executable_path: Some(executable_path),
            ..Default::default()
        })
        .await?;

    let page = browser.new_page().await?;
    page.goto("https://example.com", None).await?;

    let heading = page.locator("h1").await;
    assert_eq!(
        heading.text_content().await?,
        Some("Example Domain".into())
    );

    browser.close().await?;
    Ok(())
}
