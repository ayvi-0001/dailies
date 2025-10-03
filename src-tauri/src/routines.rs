#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Routine {
    pub name: String,
    pub group: String,
    pub r#type: String,
    pub max_value: i64,
    pub value: f64,
    pub weight: f64,
    pub weighted_value: f64,
}

#[tauri::command]
pub fn get_routines() -> Vec<Routine> {
    let current_file: std::path::PathBuf = file!().into();

    let mut file_path: std::path::PathBuf = current_file.parent().unwrap().to_path_buf();

    file_path.push("routines.json");

    serde_json::from_str(&std::fs::read_to_string(file_path).unwrap()).unwrap()
}

#[tauri::command(rename_all = "snake_case")]
/// This function doesn't get called unless the value change is valid.
pub fn handle_value_change(routine: Routine) {
    println!(
        "Received value change for routine `{0}`, new value: {1}",
        routine.name, routine.value
    );
}
