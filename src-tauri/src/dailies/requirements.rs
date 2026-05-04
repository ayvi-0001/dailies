use serde::{Deserialize, Deserializer, Serialize, Serializer};
use sqlx::{Decode, Encode, Type, TypeInfo, ValueRef, encode::IsNull, error::BoxDynError, sqlite::{Sqlite, SqliteArgumentValue, SqliteTypeInfo, SqliteValueRef}};

/// Wrapper around the `requirements` column.
///
/// SQLite stores values in this column with mixed affinities — some rows
/// hold a raw integer (e.g. `1`), others hold a quoted JSON string
/// (e.g. `"3"`). The inner [`String`] always holds the canonical JSON
/// text so it can round-trip cleanly through `Decode`/`Encode` regardless
/// of the underlying SQLite storage class.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Requirements(pub String);

impl Type<Sqlite> for Requirements {
    fn type_info() -> SqliteTypeInfo {
        <String as Type<Sqlite>>::type_info()
    }

    fn compatible(_: &SqliteTypeInfo) -> bool {
        true
    }
}

impl<'r> Decode<'r, Sqlite> for Requirements {
    fn decode(value: SqliteValueRef<'r>) -> Result<Self, BoxDynError> {
        let type_name = value.type_info().name().to_owned();

        let s = match type_name.as_str() {
            "INTEGER" => <i64 as Decode<Sqlite>>::decode(value)?.to_string(),
            "REAL" => <f64 as Decode<Sqlite>>::decode(value)?.to_string(),
            "NULL" => "null".to_owned(),
            _ => <String as Decode<Sqlite>>::decode(value)?,
        };

        Ok(Requirements(s))
    }
}

impl<'q> Encode<'q, Sqlite> for Requirements {
    fn encode_by_ref(
        &self,
        buf: &mut Vec<SqliteArgumentValue<'q>>,
    ) -> Result<IsNull, BoxDynError> {
        <String as Encode<Sqlite>>::encode_by_ref(&self.0, buf)
    }
}

impl Serialize for Requirements {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let value: serde_json::Value = serde_json::from_str(&self.0)
            .unwrap_or_else(|_| serde_json::Value::String(self.0.clone()));
        value.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Requirements {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let value = serde_json::Value::deserialize(deserializer)?;
        Ok(Requirements(value.to_string()))
    }
}
