#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Routine {
    pub name: String,
    pub group: String,
    pub r#type: String,
    pub max_value: i64,
    pub value: i64,
    pub weight: i64,
    pub weighted_value: i64,
}

#[tauri::command]
pub fn get_routines() -> Vec<Routine> {
    let mut routines: Vec<Routine> = vec![];

    for n in 1..=10 {
        routines.push(Routine {
            name: format!("name-{n}").to_owned(),
            group: "rg1".to_owned(),
            r#type: "r-d-b".to_owned(),
            max_value: 1,
            value: 1,
            weight: 1,
            weighted_value: 1,
        })
    }

    routines
}

#[tauri::command(rename_all = "snake_case")]
/// This function doesn't get called unless the value change is valid.
pub fn handle_value_change(routine: Routine) {
    println!(
        "Received value change for routine `{0}`, new value: {1}",
        routine.name, routine.value
    );
}
