use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::types::Json;

use crate::dailies::{quest::QuestType, requirements::Requirements};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
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
    pub points: Option<f64>,
    pub default_points: f64,
    pub total: f64,
    pub weight: f64,
    pub streak_target: Option<i64>,
    pub requirements: Option<Requirements>,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
    pub accepted: NaiveDateTime,
    pub archived: Option<NaiveDateTime>,
    pub days: Option<Json<Vec<i64>>>,
    pub description: Option<String>,
    pub note: Option<String>,
    pub streak: Option<i64>,
    pub previous_streak: Option<i64>,
    pub complete: Option<f64>,
    pub points_weighted: Option<f64>,
}
