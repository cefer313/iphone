#!/usr/bin/env bash
set -euo pipefail
V=${1:-out/unknown-benefactor.mp4}
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames -of default=nw=1 "$V"
ffprobe -v error -show_entries format=duration -of default=nw=1 "$V"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,duration -of default=nw=1 "$V"
for w in "0 16" "16.5 2.8" "19.6 0.4"; do set -- $w; printf "audio %ss+%s: " $1 $2
  ffmpeg -hide_banner -nostats -ss $1 -t $2 -i "$V" -vn -af volumedetect -f null - 2>&1 | grep -oE "(mean|max)_volume: [-0-9.]+ dB" | tr '\n' ' '; echo; done
