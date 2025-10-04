use sqlx::{Pool, Postgres};

pub struct AppState {
    pub connection_pool: Pool<Postgres>,
}
