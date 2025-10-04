#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorMessage<'a> {
    pub message: &'a str,
}
