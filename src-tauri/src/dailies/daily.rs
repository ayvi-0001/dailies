use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::serde_as;
use sqlx::types::Json;

use crate::dailies::quest::QuestType;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Daily {
    pub user: String,
    pub date: NaiveDate,
    pub point_id: String,
    pub quest_id: String,
    pub sequence: i64,
    pub chain: String,
    pub name: String,
    pub r#type: QuestType,
    #[serde_as(as = "Option<f64>")]
    pub points: Option<f64>,
    pub default_points: f64,
    pub total: f64,
    pub weight: f64,
    #[serde_as(as = "Option<i64>")]
    pub streak_target: Option<i64>,
    #[serde_as(as = "Option<Json<Value>>")]
    pub requirements: Option<Json<Value>>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_start: Option<NaiveTime>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_end: Option<NaiveTime>,
    #[serde_as(as = "NaiveDateTime")]
    pub accepted: NaiveDateTime,
    #[serde_as(as = "Option<NaiveDateTime>")]
    pub archived: Option<NaiveDateTime>,
    #[serde_as(as = "Option<Json<Vec<i64>>>")]
    pub days: Option<Json<Vec<i64>>>,
    #[serde_as(as = "Option<String>")]
    pub description: Option<String>,
    #[serde_as(as = "Option<String>")]
    pub note: Option<String>,
    #[serde_as(as = "Option<i64>")]
    pub streak: Option<i64>,
    #[serde_as(as = "Option<f64>")]
    pub complete: Option<f64>,
    #[serde_as(as = "Option<f64>")]
    pub points_weighted: Option<f64>,
}
