# Reels mənbələri (Higgsfield)

Kliplər (`clips/`) repoya əlavə olunmayıb (92 MB). Lazım olsa, bu linklərdən endirin:

```bash
B=https://d8j0ntlcm91z4.cloudfront.net/user_3HqnT53CLO0uoILUhrKkx9491ks
cd public/reels/clips
curl -o s1.mp4  $B/hf_20261123_113205_4fcacbcd-af34-4c16-a1d4-e11c803f304d.mp4
curl -o s2.mp4  $B/hf_20261123_113203_368704e6-4c2e-43b5-b845-d496f223d3e0.mp4
curl -o s3.mp4  $B/hf_20261123_113203_10182a31-833f-4088-9f3a-eee12d3ed130.mp4
curl -o s4.mp4  $B/hf_20261123_113204_2f07d8c9-4bef-4e4e-bfea-a32ff9fc5c52.mp4
curl -o s5.mp4  $B/hf_20261123_113229_e264ee5f-8175-480b-9a9e-643a624a1b24.mp4
curl -o s6.mp4  $B/hf_20261123_113205_0789ff42-ee82-4125-86fe-d7422cecf855.mp4
curl -o s7.mp4  $B/hf_20261123_113203_fafc85ae-6067-4769-883c-ff4fed2c72bd.mp4
curl -o s8.mp4  $B/hf_20261123_113230_aa30bead-68c6-4d82-8eda-7a80ea46c248.mp4
curl -o s9.mp4  $B/hf_20261123_113229_2fbd0e30-a883-4888-84a7-04341e7c2565.mp4
curl -o s10.mp4 $B/hf_20261123_113230_b8727118-8e85-48c1-8e03-52e5376a6cf2.mp4
```

- Obraz: GPT Image 2.6 ilə yaradılmış portret (job `9b322abb-d399-44ef-8a8b-06f3b10387a8`), bütün səhnə şəkilləri ona istinadla.
- Video: Kling 3.0 Pro, 5 san, 9:16, səssiz.
- Diktor: ElevenLabs, "Elena" səsi; `voice/raw/` — orijinal, `voice/` — 15% sürətləndirilmiş.
- Musiqi və effektlər: `python3 scripts/reels-build.py` (sintez, lisenziyasız).
