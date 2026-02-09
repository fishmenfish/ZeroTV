use tauri::{Manager};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Channel {
    id: String,
    name: String,
    url: String,
    logo: Option<String>,
    group: Option<String>,
    #[serde(rename = "epgId")]
    epg_id: Option<String>,
}

#[tauri::command]
async fn fetch_playlist(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status().as_u16(), response.status().canonical_reason().unwrap_or("Unknown")));
    }
    
    let content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    Ok(content)
}

#[tauri::command]
async fn cache_logo(url: String, app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use std::io::Write;
    
    // Create cache directory
    let cache_dir = app.path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?
        .join("logos");
    
    fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache dir: {}", e))?;
    
    // Generate cache filename from URL hash
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    url.hash(&mut hasher);
    let hash = hasher.finish();
    
    // Get file extension from URL
    let ext = url.split('.').last().unwrap_or("jpg");
    let cache_file = cache_dir.join(format!("{}.{}", hash, ext));
    
    // Return cached file if exists
    if cache_file.exists() {
        return Ok(format!("asset://localhost/{}", cache_file.to_string_lossy()));
    }
    
    // Download and cache
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch logo: {}", e))?;
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read logo: {}", e))?;
    
    let mut file = fs::File::create(&cache_file)
        .map_err(|e| format!("Failed to create cache file: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write cache file: {}", e))?;
    
    Ok(format!("asset://localhost/{}", cache_file.to_string_lossy()))
}

#[tauri::command]
fn parse_m3u(content: String) -> Result<Vec<Channel>, String> {
    let mut channels = Vec::new();
    let lines: Vec<&str> = content.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();
        
        if line.starts_with("#EXTINF:") {
            let mut name = String::new();
            let mut logo: Option<String> = None;
            let mut group: Option<String> = None;
            let mut epg_id: Option<String> = None;

            // Parse attributes
            if let Some(attrs_start) = line.find(' ') {
                let attrs = &line[attrs_start..];
                
                // Extract tvg-logo
                if let Some(logo_start) = attrs.find("tvg-logo=\"") {
                    let logo_content = &attrs[logo_start + 10..];
                    if let Some(logo_end) = logo_content.find('"') {
                        logo = Some(logo_content[..logo_end].to_string());
                    }
                }
                
                // Extract group-title
                if let Some(group_start) = attrs.find("group-title=\"") {
                    let group_content = &attrs[group_start + 13..];
                    if let Some(group_end) = group_content.find('"') {
                        group = Some(group_content[..group_end].to_string());
                    }
                }
                
                // Extract tvg-id (EPG ID)
                if let Some(epg_start) = attrs.find("tvg-id=\"") {
                    let epg_content = &attrs[epg_start + 8..];
                    if let Some(epg_end) = epg_content.find('"') {
                        epg_id = Some(epg_content[..epg_end].to_string());
                    }
                }
                
                // Extract name (after last comma)
                if let Some(comma_pos) = line.rfind(',') {
                    name = line[comma_pos + 1..].trim().to_string();
                }
            }

            // Get URL from next line
            i += 1;
            if i < lines.len() {
                let url = lines[i].trim();
                if !url.is_empty() && !url.starts_with('#') {
                    let id = generate_id(&name, url);
                    channels.push(Channel {
                        id,
                        name,
                        url: url.to_string(),
                        logo,
                        group,
                        epg_id,
                    });
                }
            }
        }
        
        i += 1;
    }

    Ok(channels)
}

fn generate_id(name: &str, url: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    format!("{}{}", name, url).hash(&mut hasher);
    let hash = hasher.finish();
    
    let hash_str = format!("{:x}", hash);
    if hash_str.len() >= 16 {
        hash_str[..16].to_string()
    } else {
        hash_str
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .invoke_handler(tauri::generate_handler![fetch_playlist, parse_m3u, cache_logo])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
