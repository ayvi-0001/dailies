use chrono::{NaiveDate, NaiveTime};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;

use crate::routines::daily_type::DailyType;

// TODO(ayvi): use separate structs for values table & routines table?
// http://ayvi:3000/ayvi/dailies/issues/30
#[derive(Debug, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Daily {
    pub ordinal_pos: i32,
    pub value_id: String,
    pub routine_id: String,
    pub name: String,
    pub group: String,
    pub r#type: DailyType,
    pub notes: Option<String>,
    pub n_days: Option<i32>,
    pub streak: Option<i32>,
    // TODO(ayvi): enum for weekdays + array http://ayvi:3000/ayvi/dailies/issues/42
    pub weekdays: Option<String>,
    #[serde_as(as = "NaiveDate")]
    pub date: NaiveDate,
    #[serde_as(as = "NaiveDate")]
    pub date_started: NaiveDate,
    #[serde_as(as = "Option<NaiveDate>")]
    pub date_archived: Option<NaiveDate>,
    #[serde_as(as = "Option<Decimal>")]
    pub value: Option<Decimal>,
    #[serde_as(as = "Decimal")]
    pub max_value: Decimal,
    #[serde_as(as = "Decimal")]
    pub weight: Decimal,
    #[serde_as(as = "Option<Decimal>")]
    pub weighted_value: Option<Decimal>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_min: Option<NaiveTime>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_max: Option<NaiveTime>,
    pub time_bucket_min: Option<i32>,
    pub time_bucket_max: Option<i32>,
}
