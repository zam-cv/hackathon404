//! Helpers de obscuring + función one-shot para filtrar un texto vía Classifier.
//! Reusados por la app (Tauri command) y por el plugin (FFI Swift/Kotlin).

use std::sync::OnceLock;

use crate::{Action, Classifier};

/// Logging diagnóstico opcional. Activar con `CLASSIFIER_DEBUG=1` (ej. en el
/// scheme de Xcode) para inspeccionar `action`, scores por categoría y un
/// preview de cada texto. Cero overhead cuando el env var no está seteado.
fn debug_enabled() -> bool {
    static FLAG: OnceLock<bool> = OnceLock::new();
    *FLAG.get_or_init(|| std::env::var("CLASSIFIER_DEBUG").is_ok())
}

/// Mínimo de caracteres no-blancos para correr el clasificador. Textos más
/// cortos pasan sin tocar (no hay señal suficiente).
pub const MIN_TEXT_LEN_FOR_CLASSIFY: usize = 20;

/// Sustituye alfanuméricos por █. Whitespace y puntuación se respetan.
pub fn obscure_full(text: &str) -> String {
    text.chars()
        .map(|c| if c.is_alphanumeric() { '█' } else { c })
        .collect()
}

/// Sustituye letras por '-'. Números y puntuación se respetan.
pub fn obscure_dashes(text: &str) -> String {
    text.chars()
        .map(|c| if c.is_alphabetic() { '-' } else { c })
        .collect()
}

/// Aplica el clasificador a `text`. Devuelve el texto obscurecido según la acción.
/// Maneja short-text passthrough y errores de inferencia (passthrough).
pub fn apply_filter(classifier: &Classifier, text: &str) -> String {
    if text.trim().chars().count() < MIN_TEXT_LEN_FOR_CLASSIFY {
        return text.to_string();
    }
    match classifier.classify(text, &[]) {
        Ok(decision) => {
            if debug_enabled() {
                let preview: String = text.chars().take(80).collect();
                let scores: Vec<String> = decision
                    .scores
                    .iter()
                    .map(|(c, s)| format!("{c}={s:.2}"))
                    .collect();
                eprintln!(
                    "[classifier-debug] action={:?} cats={:?} scores=[{}] text={:?}",
                    decision.action,
                    decision.categories,
                    scores.join(","),
                    preview
                );
            }
            match decision.action {
                Action::Bloquear => obscure_full(text),
                Action::Avisar => obscure_dashes(text),
                Action::Permitir => text.to_string(),
            }
        }
        Err(e) => {
            eprintln!("[classifier] error: {e}");
            text.to_string()
        }
    }
}

/// Versión batched para reducir overhead de IPC.
pub fn apply_filter_batch(classifier: &Classifier, texts: &[String]) -> Vec<String> {
    texts.iter().map(|t| apply_filter(classifier, t)).collect()
}
