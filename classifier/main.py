import json
import os
import re
import time
from pathlib import Path

import torch
from dotenv import load_dotenv
from transformers import pipeline
from unidecode import unidecode

LEXICAL_SHORTCUT_SCORE = 0.95
LEXICAL_BOOST_FLOOR = 0.70


def load_config() -> dict:
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        raise FileNotFoundError(
            f"No se encontró {env_path}. Copia .env.example a .env y rellénalo."
        )
    load_dotenv(env_path, override=True)

    def _require(var: str) -> str:
        v = os.environ.get(var)
        if v is None:
            raise KeyError(f"Falta variable de entorno: {var}")
        return v

    keys = json.loads(_require("CATEGORY_KEYS"))
    return {
        "model_id": _require("NLI_MODEL"),
        "category_keys": keys,
        "hypotheses": {k: json.loads(_require(f"HYPOTHESES_{k.upper()}")) for k in keys},
        "lexical": {k: json.loads(_require(f"LEXICAL_{k.upper()}")) for k in keys},
        "thresholds": json.loads(_require("THRESHOLDS")),
        "test_cases": json.loads(_require("TEST_CASES")),
    }


def normalizar(texto: str) -> str:
    return unidecode(texto.lower())


def contar_matches(texto: str, patrones: dict) -> int:
    texto_norm = normalizar(texto)
    n = 0
    for frase in patrones.get("frases", []) or []:
        if normalizar(frase) in texto_norm:
            n += 1
    for emoji in patrones.get("emojis", []) or []:
        if emoji in texto:
            n += 1
    for tag in patrones.get("hashtags", []) or []:
        if normalizar(tag) in texto_norm:
            n += 1
    rgx = patrones.get("regex") or ""
    if rgx and re.search(rgx, texto_norm, flags=re.IGNORECASE):
        n += 1
    return n


def make_clasificar(clf, cfg: dict):
    all_hypotheses = [h for cat in cfg["category_keys"] for h in cfg["hypotheses"][cat]]

    def clasificar(texto: str) -> dict:
        matches = {cat: contar_matches(texto, cfg["lexical"][cat]) for cat in cfg["category_keys"]}
        cat_atajo, n_atajo = max(matches.items(), key=lambda kv: kv[1])
        if n_atajo >= 2:
            return {cat: (LEXICAL_SHORTCUT_SCORE if cat == cat_atajo else 0.0)
                    for cat in cfg["category_keys"]}
        out = clf(
            texto,
            candidate_labels=all_hypotheses,
            multi_label=True,
            hypothesis_template="{}",
        )
        score_por_hyp = dict(zip(out["labels"], out["scores"]))
        resultado = {}
        for cat in cfg["category_keys"]:
            score = max(score_por_hyp[h] for h in cfg["hypotheses"][cat])
            if matches[cat] == 1:
                score = max(score, LEXICAL_BOOST_FLOOR)
            resultado[cat] = float(score)
        return resultado

    return clasificar


def decidir(scores: dict, thresholds: dict) -> tuple[str | None, str]:
    cat_max, score_max = max(scores.items(), key=lambda kv: kv[1])
    th = thresholds.get(cat_max, 0.70)
    if score_max >= th + 0.10:
        return cat_max, "BLOQUEAR"
    if score_max >= th:
        return cat_max, "AVISAR"
    return None, "PERMITIR"


def main() -> None:
    cfg = load_config()
    print(f"Categorías: {cfg['category_keys']}")
    print(f"Hipótesis totales: {sum(len(v) for v in cfg['hypotheses'].values())}")
    print(f"Test cases: {len(cfg['test_cases'])}\n")

    device = 0 if torch.cuda.is_available() else -1
    print(f"Cargando modelo en device={device} (CPU=-1) ...")
    clf = pipeline(
        "zero-shot-classification",
        model=cfg["model_id"],
        device=device,
    )
    clf("warmup", candidate_labels=["a", "b"], multi_label=True, hypothesis_template="{}")
    print("Modelo listo.\n")

    clasificar = make_clasificar(clf, cfg)

    rows = []
    latencias = []
    aciertos = 0
    total = 0

    for case in cfg["test_cases"]:
        texto = case["text"]
        esperada = case.get("expected")
        t0 = time.perf_counter()
        scores = clasificar(texto)
        dt_ms = (time.perf_counter() - t0) * 1000
        latencias.append(dt_ms)
        cat, accion = decidir(scores, cfg["thresholds"])
        ok = (accion == "PERMITIR") if esperada is None else (cat == esperada)
        total += 1
        if ok:
            aciertos += 1
        rows.append({
            "texto": texto[:60] + ("…" if len(texto) > 60 else ""),
            "scores": {c: round(s, 3) for c, s in scores.items()},
            "predicha": cat,
            "esperada": esperada,
            "accion": accion,
            "ms": round(dt_ms, 1),
            "ok": ok,
        })

    for r in rows:
        pred = str(r["predicha"])
        esp = str(r["esperada"])
        print(f"[{r['accion']:9s}] pred={pred:>5}  esp={esp:>5}  ok={r['ok']}  "
              f"{r['ms']:>7.1f}ms  scores={r['scores']}")
        print(f"   texto: {r['texto']}")

    if latencias:
        media = sum(latencias) / len(latencias)
        print(f"\nLatencia media: {media:.1f} ms  (min={min(latencias):.1f}, max={max(latencias):.1f})")
    print(f"Aciertos: {aciertos}/{total}")


if __name__ == "__main__":
    main()
