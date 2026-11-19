import { Config } from '@remotion/cli/config';

// Çıxış: H.264 MP4, WhatsApp/Instagram üçün uyğun yuv420p rəng formatı.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(18);
Config.setOverwriteOutput(true);

// Öz Chromium-unuzdan istifadə etmək istəsəniz: REMOTION_BROWSER=/yol/chrome npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
