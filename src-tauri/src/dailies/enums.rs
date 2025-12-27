use serde::{Deserialize, Serialize};

pub trait EnumMatch
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
#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SortDirection {
    #[serde(rename = "up")]
    Up,
    #[serde(rename = "down")]
    Down,
}
