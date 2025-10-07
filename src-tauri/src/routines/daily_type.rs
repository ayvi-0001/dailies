use serde::{Deserialize, Serialize};
use strum::{AsRefStr, EnumIter, EnumString, IntoEnumIterator, IntoStaticStr};

#[allow(clippy::upper_case_acronyms)]
#[derive(
    Debug,
    Clone,
    PartialEq,
    Eq,
    PartialOrd,
    Serialize,
    Deserialize,
    AsRefStr,
    EnumIter,
    EnumString,
    IntoStaticStr,
    sqlx::Type,
)]
#[sqlx(type_name = "type")]
pub enum DailyType {
    #[serde(rename = "r-d-b")]
    #[strum(serialize = "r-d-b")]
    RDB,
    #[serde(rename = "r-d-n")]
    #[strum(serialize = "r-d-n")]
    RDN,
    #[serde(rename = "r-d-c-d")]
    #[strum(serialize = "r-d-c-d")]
    RDCD,
    #[serde(rename = "r-ln-b")]
    #[strum(serialize = "r-ln-b")]
    RLnB,
    #[serde(rename = "r-d-cy")]
    #[strum(serialize = "r-d-cy")]
    RDCy,
    #[serde(rename = "r-sc-c")]
    #[strum(serialize = "r-sc-c")]
    RScC,
    #[serde(rename = "r-d-st-n")]
    #[strum(serialize = "r-d-st-n")]
    RDStN,
}

impl DailyType {
    pub fn match_string(s: String) -> Result<Self, Box<dyn std::error::Error + 'static>> {
        if let Some(r#type) = Self::iter().find(|f| s.trim().eq_ignore_ascii_case(f.as_ref())) {
            Ok(r#type)
        } else {
            Err("Non matching type.".into())
        }
    }
}

impl From<String> for DailyType {
    fn from(s: String) -> Self {
        Self::match_string(s).expect("Database should always return a valid enum.")
    }
}
