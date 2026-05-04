use serde::{Deserialize, Serialize};

use crate::{dailies::{point::Point, quest::{Quest, QuestChain}}, db::user::User};

#[derive(Serialize, Deserialize)]
pub struct UserExportData {
    pub app_version: String,
    pub sqlite_user_version: i64,
    pub user: User,
    pub quest_chains: Vec<QuestChain>,
    pub quests: Vec<Quest>,
    pub points: Vec<Point>,
}
