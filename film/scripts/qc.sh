#!/usr/bin/env bash
# Quality control for the rendered film: frame count, format, audio level, motion strips.
set -euo pipefail
V=${1:-out/the-weight-of-compassion.mp4}
OUT=${2:-out/qc}
mkdir -p "$OUT"
echo "== stream info"
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames -of default=nw=1 "$V"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of default=nw=1 "$V"
ffprobe -v error -show_entries format=duration -of default=nw=1 "$V"
echo "== audio loudness / peak"
ffmpeg -hide_banner -nostats -i "$V" -af "volumedetect" -vn -f null - 2>&1 | grep -E "mean_volume|max_volume"
echo "== last second audio (should fade to silence)"
ffmpeg -hide_banner -nostats -ss 29.5 -i "$V" -af "volumedetect" -vn -f null - 2>&1 | grep -E "max_volume"
# motion strips: every 3rd frame of key actions, small scale
strip () { ffmpeg -hide_banner -loglevel error -y -i "$V" -vf "select='between(n\,$1\,$2)*not(mod(n-$1\,$3))',scale=216:384,tile=${4}x1" -frames:v 1 "$OUT/$5.png"; }
strip 20 64 4 12 walk_s1
strip 160 215 5 12 heft_s2
strip 300 333 3 12 knock_s3
strip 470 525 5 12 contact_s4
strip 640 720 7 12 handoff_s5
strip 780 896 10 12 depart_s6
echo "strips in $OUT"
