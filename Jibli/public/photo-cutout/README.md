# Birthday portrait processing

The app hosts these files locally so preparing a portrait does not send client images to a third-party background-removal service.

- `wasm/`: runtime files copied from `@mediapipe/tasks-vision` 1.1.1 (Apache-2.0). Keep these in sync with the npm dependency when upgrading.
- `selfie_segmenter.tflite`: Google's float16 Selfie Segmenter model, downloaded from https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite on 2026-10-19.
- Implementation guide: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js

Portrait preparation uses the model's foreground confidence mask with soft alpha edges. Transparent PNG portraits bypass segmentation. New uploads save the processed PNG; older saved photos are prepared in the guest's browser and cached for the current session.
