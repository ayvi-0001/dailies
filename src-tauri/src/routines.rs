#[derive(serde::Serialize)]
pub struct Routine {
    pub name: String,
    pub group: String,
    pub type_: String,
    pub max_value: i64,
    pub value: i64,
}

#[tauri::command]
pub fn get_routines() -> Vec<Routine> {
    let mut routines: Vec<Routine> = vec![];

    for n in 1..=10 {
        routines.push(Routine {
            name: format!("name-{n}").to_owned(),
            group: "rg1".to_owned(),
            type_: "r-d-b".to_owned(),
            max_value: 1,
            value: 1,
        })
    }

    routines
}
