use serde::{Deserialize, Serialize};
use serde_with::serde_as;

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct TotalPointEval {
    pub total_points: f64,
    pub total_weight: f64,
}
