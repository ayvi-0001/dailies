use chrono::{DateTime, Local, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::serde_as;
use sqlx::types::Json;
use strum::{AsRefStr, EnumIter};

use crate::dailies::enums::EnumMatch;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Quest {
    /// Id can be null when sent from front-end on new quest.
    #[serde(skip_deserializing)]
    pub id: String,
    pub user_id: i64,
    /// Sequence is assigned in insert quest SQL.
    #[serde(skip_deserializing)]
    pub sequence: i64,
    pub chain: String,
    pub name: String,
    pub r#type_id: QuestType,
    pub weight: f64,
    pub total: f64,
    pub default_points: f64,
    pub accepted: NaiveDateTime,
    #[serde_as(as = "Option<NaiveDateTime>")]
    pub archived: Option<NaiveDateTime>,
    #[serde_as(as = "Option<i64>")]
    pub streak_target: Option<i64>,
    #[serde_as(as = "Option<Json<Value>>")]
    pub requirements: Option<Json<Value>>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_start: Option<NaiveTime>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_end: Option<NaiveTime>,
    #[serde_as(as = "Option<Json<Vec<i64>>>")]
    pub days: Option<Json<Vec<i64>>>,
    #[serde_as(as = "Option<String>")]
    pub description: Option<String>,
    #[serde(default = "chrono::offset::Local::now")]
    pub updated: DateTime<Local>,
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, AsRefStr, EnumIter, sqlx::Type)]
#[sqlx(type_name = "type")]
pub enum QuestType {
    #[serde(rename = "q-d")]
    #[sqlx(rename = "q-d")]
    QD,
    #[serde(rename = "q-w")]
    #[sqlx(rename = "q-w")]
    QW,
    #[serde(rename = "q-dm")]
    #[sqlx(rename = "q-dm")]
    QDm,
    #[serde(rename = "q-w-s")]
    #[sqlx(rename = "q-w-s")]
    QWS,
    #[serde(rename = "q-w-m")]
    #[sqlx(rename = "q-w-m")]
    QWM,
    #[serde(rename = "q-r")]
    #[sqlx(rename = "q-r")]
    QR,
    #[serde(rename = "q-o")]
    #[sqlx(rename = "q-o")]
    QO,
    #[serde(rename = "q-p")]
    #[sqlx(rename = "q-p")]
    QP,
    #[serde(rename = "q-m")]
    #[sqlx(rename = "q-m")]
    QM,
    #[serde(rename = "q-e")]
    #[sqlx(rename = "q-e")]
    QE,
}

impl EnumMatch for QuestType {}

impl From<String> for QuestType {
    fn from(s: String) -> Self {
        Self::match_string(s).expect("Database should always return a valid enum.")
    }
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct QuestTypeRecord {
    pub id: String,
    pub name: String,
    pub description: String,
    pub available: bool,
    pub styles: Json<QuestTypeStyles>,
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct QuestTypeStyles {
    type_badge_class: String,
    border_class: String,
    bg_class: String,
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct QuestSequence {
    pub id: String,
    pub sequence: i64,
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct QuestChain {
    pub id: i64,
    pub user_id: i64,
    pub chain: String,
    pub sequence: i64,
    pub collapsed: bool,
}
