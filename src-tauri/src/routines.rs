use chrono::NaiveTime;
use serde_with::serde_as;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Routine {
    pub name: String,
    pub group: String,
    pub r#type: String,
    pub max_value: i64,
    pub value: Option<f64>,
    pub weight: f64,
    pub weighted_value: Option<f64>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_min: Option<NaiveTime>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_max: Option<NaiveTime>,
    pub notes: Option<String>,
    pub week_days: Vec<i8>,
}

#[tauri::command]
pub fn get_routines() -> Vec<Routine> {
    let current_file: std::path::PathBuf = file!().into();

    let mut file_path: std::path::PathBuf = current_file.parent().unwrap().to_path_buf();

    file_path.push("routines.json");

    serde_json::from_str(&std::fs::read_to_string(file_path).unwrap()).unwrap()
}

/// This function doesn't get called unless the value change is valid.
#[tauri::command(rename_all = "snake_case")]
pub fn handle_value_change(routine: Routine) {
    let value: String =
        if let Some(value) = routine.value { value.to_string() } else { "None".to_owned() };

    println!(
        "Received value change for routine `{0}`, new value: {1}",
        routine.name, value
    );
}
