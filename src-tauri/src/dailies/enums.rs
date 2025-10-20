use serde::{Deserialize, Serialize};
use strum::{AsRefStr, EnumIter};

trait EnumMatch
where
    Self: strum::IntoEnumIterator + std::convert::AsRef<str>, {
    fn match_string(s: String) -> Result<Self, Box<dyn std::error::Error + 'static>> {
        if let Some(member) = Self::iter().find(|f| s.trim().eq_ignore_ascii_case(f.as_ref())) {
            Ok(member)
        } else {
            Err("No matching members.".into())
        }
    }
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, AsRefStr, EnumIter, sqlx::Type)]
#[sqlx(type_name = "type")]
pub enum DailyType {
    #[serde(rename = "q-d-b")]
    #[sqlx(rename = "q-d-b")]
    QDB,
    #[serde(rename = "q-d-n")]
    #[sqlx(rename = "q-d-n")]
    QDN,
    #[serde(rename = "q-d-c")]
    #[sqlx(rename = "q-d-c")]
    QDC,
    #[serde(rename = "q-d-c-d")]
    #[sqlx(rename = "q-d-c-d")]
    QDCD,
    #[serde(rename = "q-d-cy")]
    #[sqlx(rename = "q-d-cy")]
    QDCy,
    #[serde(rename = "q-d-i")]
    #[sqlx(rename = "q-d-i")]
    QDI,
    #[serde(rename = "q-p")]
    #[sqlx(rename = "q-p")]
    QP,
    #[serde(rename = "q-sc-c")]
    #[sqlx(rename = "q-sc-c")]
    QScC,
    #[serde(rename = "q-w-b")]
    #[sqlx(rename = "q-w-b")]
    QWB,
    #[serde(rename = "q-w-n")]
    #[sqlx(rename = "q-w-n")]
    QWN,
    #[serde(rename = "q-ln-n")]
    #[sqlx(rename = "q-ln-n")]
    QLnN,
    #[serde(rename = "q-ln-b")]
    #[sqlx(rename = "q-ln-b")]
    QLnB,
    #[serde(rename = "q-x")]
    #[sqlx(rename = "q-x")]
    QX,
}

impl EnumMatch for DailyType {}

impl From<String> for DailyType {
    fn from(s: String) -> Self {
        Self::match_string(s).expect("Database should always return a valid enum.")
    }
}
