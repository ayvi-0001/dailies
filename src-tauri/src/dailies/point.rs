use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;

use crate::dailies::requirements::Requirements;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Point {
    pub id: String,
    pub quest_id: String,
    pub user_id: i64,
    pub date: NaiveDate,
    pub points: Option<f64>,
    pub total: f64,
    pub complete: Option<f64>,
    pub weight: f64,
    pub points_weighted: Option<f64>,
    pub streak_target: Option<i64>,
    pub streak: Option<i64>,
    pub previous_streak: Option<i64>,
    pub requirements: Option<Requirements>,
    pub time_start: Option<NaiveTime>,
    pub time_end: Option<NaiveTime>,
    pub note: Option<String>,
    pub updated: NaiveDateTime,
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct TotalPointEval {
    pub total_points: f64,
    pub total_weight: f64,
}
