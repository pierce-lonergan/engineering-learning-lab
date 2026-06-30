#!/usr/bin/env python3
"""Validate a generated audio episode against the expected spoken text — by measuring real
audio durations and comparing to a words->seconds model calibrated from the questions.
  python scripts/validate_episode.py <deckId> <text.json>
Answers: is each card's ANSWER audio the FULL answer, just the first sentence (key), or truncated?
Cross-checks the episode waveform (silence detection) against the cached per-segment audio."""
import sys, os, json, re
import numpy as np
from pydub import AudioSegment, silence
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

DECK = sys.argv[1] if len(sys.argv) > 1 else "interview-prep"
TEXT = sys.argv[2] if len(sys.argv) > 2 else "C:/tmp/ip_audio.json"
HERE = os.path.dirname(os.path.abspath(__file__))
AUD  = os.path.join(HERE, "..", "audio")
CACHE = "C:/tmp/_audio_cache_" + DECK

man  = json.load(open(os.path.join(AUD, DECK + ".json")))
txt  = json.load(open(TEXT, encoding="utf-8"))["cards"]      # deck-order: q, a (full), aKey
wc   = lambda s: len(re.findall(r"\S+", s or ""))
secs = lambda seg: len(seg) / 1000.0
def dur(fp):
    try: return secs(AudioSegment.from_file(fp))
    except Exception: return None

n = len(txt)
have_cache = os.path.isdir(CACHE) and os.path.exists(os.path.join(CACHE, "q_0.mp3"))
print("cards:", n, "| cache:", "yes" if have_cache else "NO (will use episode-only)", "| episode_min:", round(man["durationSec"]/60, 1))

# --- Calibrate a words->seconds model from the QUESTION segments (we know their full text is spoken) ---
qw, qd, ad, akw, afw = [], [], [], [], []
for i, c in enumerate(txt):
    akw.append(wc(c["aKey"])); afw.append(wc(c["a"]))
    if have_cache:
        qd_i = dur(os.path.join(CACHE, "q_%d.mp3" % i)); ad_i = dur(os.path.join(CACHE, "a_%d.mp3" % i))
        if qd_i: qw.append(wc(c["q"])); qd.append(qd_i)
        ad.append(ad_i)

if have_cache and len(qw) > 30:
    qw_a, qd_a = np.array(qw, float), np.array(qd, float)
    m, b = np.polyfit(qw_a, qd_a, 1)                 # seconds = m*words + b(pad)
    rate = 1.0 / m if m > 0 else 0
    print("\nCALIBRATION (from %d question segments): %.3f s/word + %.2f s pad  (~%.0f words/min)" % (len(qw), m, b, rate * 60))
    pred = lambda words: m * words + b
    akw_a, afw_a, ad_a = np.array(akw, float), np.array(afw, float), np.array([x or 0 for x in ad], float)
    pred_key, pred_full = pred(akw_a), pred(afw_a)
    ratio_key  = np.mean(ad_a / np.maximum(pred_key, 0.1))
    ratio_full = np.mean(ad_a / np.maximum(pred_full, 0.1))
    speech_vs_full = np.sum(ad_a) / np.sum(pred_full)
    print("\nANSWER AUDIO vs EXPECTED:")
    print("  mean(actual / predicted-IF-FIRST-SENTENCE) = %.2f   (≈1.00 means audio == first sentence)" % ratio_key)
    print("  mean(actual / predicted-IF-FULL-ANSWER)    = %.2f   (≈1.00 means audio == full answer)" % ratio_full)
    print("  total answer audio is %.0f%% of a full-answer episode" % (speech_vs_full * 100))
    print("  full answers average %.1f words; first-sentence keys average %.1f words (%.1fx)" % (np.mean(afw_a), np.mean(akw_a), np.mean(afw_a)/max(np.mean(akw_a),1)))
    # worst offenders (where the most content is missing)
    miss = (afw_a - akw_a)
    order = np.argsort(-miss)[:5]
    print("\n  cards losing the most content (full words -> spoken key words):")
    for i in order:
        print("   #%d  %d -> %d words  |  '%s'" % (i, int(afw_a[i]), int(akw_a[i]), txt[i]["front"][:54]))

# --- Independent waveform cross-check: silence-detect 6 spread-out card blocks in the EPISODE ---
print("\nWAVEFORM CROSS-CHECK (episode silence detection vs cached segments):")
ep = AudioSegment.from_file(os.path.join(AUD, DECK + ".mp3")).set_channels(1)
cards = man["cards"]
sample = [int(x) for x in np.linspace(2, n - 2, 6)]
for i in sample:
    s = int(cards[i]["t"] * 1000); e = int(cards[i+1]["t"] * 1000) if i+1 < len(cards) else len(ep)
    block = ep[s:e]
    nons = silence.detect_nonsilent(block, min_silence_len=1400, silence_thresh=block.dBFS - 18)  # 1.4s+ silence splits Q | think-pause | A
    speech = sum((b - a) for a, b in nons) / 1000.0
    # the think-pause is the largest silence gap; speech AFTER it ≈ the answer
    a_speech = None
    if len(nons) >= 2:
        a_speech = (nons[-1][1] - nons[-1][0]) / 1000.0
    ca = dur(os.path.join(CACHE, "a_%d.mp3" % i)) if have_cache else None
    print("  card #%d block=%.1fs speechruns=%d  last-run(≈answer)=%s  cached a_%d=%s" % (
        i, (e - s) / 1000.0, len(nons), ("%.1fs" % a_speech) if a_speech else "n/a", i, ("%.1fs" % ca) if ca else "n/a"))
