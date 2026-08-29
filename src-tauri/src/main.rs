#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
fn save_note(app_handle: tauri::AppHandle, content: String) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    if !app_dir.exists() { fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?; }
    fs::write(app_dir.join("saved_note.html"), content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_note(app_handle: tauri::AppHandle) -> Result<String, String> {
    let file_path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?.join("saved_note.html");
    if file_path.exists() {
        Ok(fs::read_to_string(file_path).map_err(|e| e.to_string())?)
    } else { Ok(String::new()) }
}

#[tauri::command]
fn export_file(file_path: String, content: String) -> Result<(), String> {
    fs::write(file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_note, load_note, export_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}