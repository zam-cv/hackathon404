//! FFI Rust → Swift para que `FilterMessageHandler` (Swift) delegue el
//! filtrado al classifier zero-shot multi-hipótesis.
//!
//! El classifier vive como `OnceLock<Arc<Classifier>>` en classifier-core,
//! seteado por la app en su setup hook. Aquí solo lo leemos.
//!
//! Critical: TODO el body va dentro de `catch_unwind` para que panics
//! no crucen el boundary FFI (UB → app abort). Si algo revienta, log y
//! passthrough.

use std::mem::ManuallyDrop;
use std::panic::{catch_unwind, AssertUnwindSafe};

use classifier_core::{apply_filter_batch, SHARED_CLASSIFIER};
use swift_rs::SRString;

/// Limite de seguridad: textos individuales más largos se truncan.
const MAX_TEXT_LEN: usize = 4000;
/// Tamaño de chunk para procesar el batch en porciones. El `Session` de ort
/// está detrás de un `Mutex` (nli.rs), así que toda inferencia ya está
/// serializada — chunkear no agrega trabajo, solo divide la cola para acotar
/// el peor-caso de memoria por iteración (~64 × MAX_TEXT_LEN × 12 hipótesis ×
/// 256 tokens). Procesa el batch completo en N/CHUNK_SIZE pasadas, sin
/// descartar inputs.
const CHUNK_SIZE: usize = 64;

#[no_mangle]
pub extern "C" fn classifier_filter_texts(
    bundle_path: SRString,
    texts_json: SRString,
) -> SRString {
    // CRITICAL: los SRString llegan ya owned por Swift ARC. Si dejamos que
    // Rust llame Drop al fin del scope, swift-rs hace `swift_release` y luego
    // Swift también lo hace por ARC → double-release → SIGSEGV en objc_release.
    // ManuallyDrop suprime el Drop de Rust; Swift libera correctamente solo.
    let bundle_path = ManuallyDrop::new(bundle_path);
    let texts_json = ManuallyDrop::new(texts_json);
    let _ = &*bundle_path; // unused but document we received it
    let json_str = texts_json.as_str();

    let result = catch_unwind(AssertUnwindSafe(|| -> String {
        let mut inputs: Vec<String> = match serde_json::from_str(json_str) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("[plugin classifier] JSON parse error: {e}");
                return "[]".to_string();
            }
        };

        for t in &mut inputs {
            if t.len() > MAX_TEXT_LEN {
                t.truncate(MAX_TEXT_LEN);
            }
        }

        eprintln!(
            "[plugin classifier] processing {} texts in chunks of {}",
            inputs.len(),
            CHUNK_SIZE
        );

        let outputs = match SHARED_CLASSIFIER.get() {
            Some(classifier) => {
                let mut all_out = Vec::with_capacity(inputs.len());
                for (i, chunk) in inputs.chunks(CHUNK_SIZE).enumerate() {
                    eprintln!("[plugin classifier] chunk {} ({} texts)", i, chunk.len());
                    let out = apply_filter_batch(classifier, chunk);
                    all_out.extend(out);
                }
                eprintln!(
                    "[plugin classifier] done: {}/{} outputs",
                    all_out.len(),
                    inputs.len()
                );
                all_out
            }
            None => {
                eprintln!("[plugin classifier] SHARED no inicializado, passthrough");
                inputs
            }
        };

        serde_json::to_string(&outputs).unwrap_or_else(|_| "[]".to_string())
    }));

    match result {
        Ok(json) => SRString::from(json.as_str()),
        Err(panic_info) => {
            let msg = if let Some(s) = panic_info.downcast_ref::<&str>() {
                (*s).to_string()
            } else if let Some(s) = panic_info.downcast_ref::<String>() {
                s.clone()
            } else {
                "<unknown payload>".to_string()
            };
            eprintln!("[plugin classifier] PANIC caught at FFI boundary: {msg}");
            // Devolver array vacío evita crashes en JS deserializing.
            SRString::from("[]")
        }
    }
}
