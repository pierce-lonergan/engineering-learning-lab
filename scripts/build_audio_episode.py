#!/usr/bin/env python3
"""Build one concatenated MP3 "episode" + timing manifest for a deck, for run-grade
hands-free audio (HTMLAudioElement + Media Session in the app).
  python scripts/build_audio_episode.py <in.json> <deckId> [voice] [detail=key|full]
Structure: intro -> per topic announcement -> per card (question -> think-pause -> answer -> gap).
Free neural TTS via edge-tts. Resumable (segment cache in temp). Writes audio/<deck>.mp3 + audio/<deck>.json."""
import sys, json, os, asyncio
import edge_tts
from pydub import AudioSegment

IN     = sys.argv[1]
DECK   = sys.argv[2]
VOICE  = sys.argv[3] if len(sys.argv) > 3 else "en-US-AriaNeural"
DETAIL = sys.argv[4] if len(sys.argv) > 4 else "key"
PAUSE_MS, GAP_MS, INTRO_GAP, TOPIC_GAP = 2500, 1200, 600, 400

HERE   = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "..", "audio"); os.makedirs(OUTDIR, exist_ok=True)
CACHE  = os.path.join("C:/tmp", "_audio_cache_" + DECK); os.makedirs(CACHE, exist_ok=True)

data  = json.load(open(IN, encoding="utf-8"))
cards = data["cards"]

async def synth(text, fp):
    if os.path.exists(fp) and os.path.getsize(fp) > 250:
        return
    text = (text or "").strip() or "."
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, VOICE).save(fp)
            if os.path.getsize(fp) > 250:
                return
        except Exception as e:
            print("  retry(%d) %s: %s" % (attempt, os.path.basename(fp), str(e)[:80]), flush=True)
            await asyncio.sleep(1.5 * (attempt + 1))
    AudioSegment.silent(400).export(fp, format="mp3")   # last resort

def seg(fp):
    return AudioSegment.from_file(fp, format="mp3")

async def main():
    n = len(cards)
    print("Synthesizing %d cards (voice=%s, detail=%s)..." % (n, VOICE, DETAIL), flush=True)
    intro_fp = os.path.join(CACHE, "intro.mp3")
    await synth("%s. %d cards. After each question, pause and answer in your head, then listen for the answer." % (data["name"], n), intro_fp)
    last_topic = None
    for i, c in enumerate(cards):
        if c["sec"] != last_topic:
            last_topic = c["sec"]
            c["_t"] = os.path.join(CACHE, "topic_%d.mp3" % i)
            await synth("Topic. %s." % c["topic"], c["_t"])
        c["_q"] = os.path.join(CACHE, "q_%d.mp3" % i); await synth(c["q"], c["_q"])
        c["_a"] = os.path.join(CACHE, "a_%d.mp3" % i); await synth(c["aKey"] if DETAIL == "key" else c["a"], c["_a"])
        if (i + 1) % 20 == 0:
            print("  synth %d/%d" % (i + 1, n), flush=True)

    print("Stitching...", flush=True)
    episode = seg(intro_fp) + AudioSegment.silent(INTRO_GAP)
    manifest = []
    for c in cards:
        if c.get("_t"):
            episode += seg(c["_t"]) + AudioSegment.silent(TOPIC_GAP)
        start = len(episode)
        episode += seg(c["_q"]) + AudioSegment.silent(PAUSE_MS) + seg(c["_a"]) + AudioSegment.silent(GAP_MS)
        manifest.append({"t": round(start / 1000.0, 2), "front": c["front"], "sec": c["sec"]})

    mp3 = os.path.join(OUTDIR, "%s.mp3" % DECK)
    episode.export(mp3, format="mp3", bitrate="40k", parameters=["-ac", "1"])
    dur = round(len(episode) / 1000.0, 1)
    json.dump({"deck": DECK, "name": data["name"], "voice": VOICE, "detail": DETAIL,
               "durationSec": dur, "pauseMs": PAUSE_MS, "cards": manifest},
              open(os.path.join(OUTDIR, "%s.json" % DECK), "w", encoding="utf-8"))
    print("DONE %s | %.1f min | %.1f MB | %d cards" % (mp3, dur / 60.0, os.path.getsize(mp3) / 1e6, len(manifest)), flush=True)

asyncio.run(main())
