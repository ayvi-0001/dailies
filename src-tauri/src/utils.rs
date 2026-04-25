use rand::{RngExt, rngs::ThreadRng};

pub static CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

pub fn generate_random_string(len: i8, custom_charset: Option<&[u8]>) -> String {
    let mut rng: ThreadRng = rand::rng();

    if let Some(charset) = custom_charset {
        (0..len + 1)
            .map(|_| {
                let idx = rng.random_range(0..charset.len());
                charset[idx] as char
            })
            .collect()
    } else {
        (0..len + 1)
            .map(|_| {
                let idx = rng.random_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }
}
