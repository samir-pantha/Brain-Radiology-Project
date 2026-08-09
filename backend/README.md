# Brain MRI Classification and Report Backend

FastAPI service for the repository's `model_vgg16_v2.h5`. It serves one MRI image at a time, returns the four VGG16 class probabilities, and can generate a text-only classifier report through OpenRouter.

## Prerequisites

- Python 3.13 (the project environment currently uses 3.13.11)
- The repository-root `model_vgg16_v2.h5` file must remain in place.
- Optional: an [OpenRouter API key](https://openrouter.ai/keys) for AI-powered reports. Create a key in the OpenRouter dashboard; do not commit it to this repository.

## Configure OpenRouter reports

Set the API key in the terminal session that starts the backend:

```powershell
$env:OPENROUTER_API_KEY = "your_openrouter_key"
```

The default model is `google/gemma-3-4b-it:free`. To override it when that model is unavailable, set `OPENROUTER_MODEL` before starting the server:

```powershell
$env:OPENROUTER_MODEL = "provider/model-name"
```

The backend uses the official OpenAI Python SDK with OpenRouter's OpenAI-compatible base URL, `https://openrouter.ai/api/v1`. The key stays server-side and is never sent to the browser. If no key is configured, or OpenRouter times out, rate-limits, rejects the key, or otherwise fails, the API automatically returns a deterministic safe fallback report.

## Run locally

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

The model is loaded once when the server starts. Startup fails intentionally if the model artifact or output-label configuration is unavailable or incompatible.

## Endpoints

- `GET /health` returns server readiness and whether the model loaded.
- `POST /predict` accepts multipart form-data with one `image` field.
- `POST /generate-report` accepts patient details and the prediction response as JSON. It never receives the MRI image and returns `clinical_summary`, `impression`, `recommendation`, `disclaimer`, and `source` (`ai` or `fallback`).

Only JPEG and PNG images are accepted. Uploads are limited to 25 MB and images with more than 40 million pixels are rejected.

Example PowerShell request:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/predict -Form @{ image = Get-Item 'Dataset\archive\Testing\notumor\Te-no_4.jpg' }
```

The response contains `predicted_class`, `confidence` (0 through 1), and a `probabilities` object ordered by the fixed labels: `glioma`, `meningioma`, `notumor`, and `pituitary`.

## Inference compatibility

Images are converted to RGB and resized to 224 by 224 using nearest-neighbor interpolation, then passed to the model as raw float32 0-255 pixels. This mirrors the notebook's inference path. Do not add manual 0-1 normalization: the saved VGG16 model contains its own normalization layers.

## Scope

The classifier does not persist images or patient data. AI report generation sends only patient details and classifier metadata to OpenRouter—never the MRI image. Both AI and fallback reports describe classifier output only; they do not generate radiology findings or provide a clinical diagnosis.
