use serde::{Deserialize, Serialize};
use strum::{AsRefStr, EnumIter, EnumString, IntoStaticStr};

trait EnumMatch: strum::IntoEnumIterator + std::convert::AsRef<str> {
    fn match_string(s: String) -> Result<Self, Box<dyn std::error::Error + 'static>> {
        if let Some(member) = Self::iter().find(|f| s.trim().eq_ignore_ascii_case(f.as_ref())) {
            Ok(member)
        } else {
            Err("No matching members.".into())
        }
    }
}

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

impl EnumMatch for DailyType {}

impl From<String> for DailyType {
    fn from(s: String) -> Self {
        Self::match_string(s).expect("Database should always return a valid enum.")
    }
}

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
#[sqlx(type_name = "group")]
pub enum DailyGroup {
    #[serde(rename = "rg1")]
    #[strum(serialize = "rg1")]
    Rg1,
    #[serde(rename = "rg2")]
    #[strum(serialize = "rg2")]
    Rg2,
    #[serde(rename = "rg3")]
    #[strum(serialize = "rg3")]
    Rg3,
    #[serde(rename = "rg4")]
    #[strum(serialize = "rg4")]
    Rg4,
}

impl EnumMatch for DailyGroup {}

impl From<String> for DailyGroup {
    fn from(s: String) -> Self {
        Self::match_string(s).expect("Database should always return a valid enum.")
    }
}
