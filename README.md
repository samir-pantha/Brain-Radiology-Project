
**Brain Radiology Protect -"Brain Tumor MRI Classification and AI Assisted Clinical Reporting System"**

An academic project from Kathmandu University, Department of Artificial Intelligence, comparing five deep learning architectures for brain tumor MRI classification and deploying the best-performing model as a full-stack, AI-assisted clinical reporting web application.

> ⚠️ **Disclaimer:** This is a student/academic project built for study purposes only. It is **not** a certified medical device and must **not** be used for actual clinical diagnosis. All AI-generated output requires review by a licensed radiologist.

---

## 📌 Overview

Early and accurate brain tumor diagnosis is critical, but access to experienced radiologists is limited in many regions, including Nepal. This project explores whether deep learning can support that gap by:

1. Training and comparing **five CNN backbones** on a four-class brain MRI classification task.
2. Deploying the best-performing model in a working web application that returns a prediction, confidence score, and an AI-generated clinical-style report.

---

## 🧠 Models Compared

| Model | Test Accuracy | Macro Precision | Macro Recall | Macro F1 |
|---|---|---|---|---|
| **VGG16** ✅ | **0.94** | **0.94** | **0.94** | **0.94** |
| MobileNetV3Large | 0.93 | 0.93 | 0.93 | 0.92 |
| DenseNet121 | 0.92 | 0.93 | 0.92 | 0.92 |
| EfficientNetB0 | 0.92 | 0.93 | 0.92 | 0.92 |
| ResNet50 | 0.92 | 0.92 | 0.92 | 0.92 |

**VGG16** was selected for deployment based on the highest overall performance across accuracy, precision, recall, and F1-score, while remaining efficient enough to train and run on free-tier hardware.

Each model was evaluated using **accuracy, precision, recall, F1-score, ROC-AUC, and confusion matrices**.

---

## 🏋️ Training Approach

- **Dataset:** [Kaggle Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) (7,023 images)
- **Classes:** Glioma, Meningioma, Pituitary Tumor, No Tumor
- **Split:** ~78% training / ~22% testing, balanced equally across all four classes
- **Strategy:** Identical two-phase transfer learning applied to every backbone
  - **Phase 1 — Feature Extraction:** Backbone fully frozen, only the classification head is trained
  - **Phase 2 — Fine-Tuning:** Upper backbone layers unfrozen, trained at a much lower learning rate
- **Classification Head:** Global Average Pooling → Batch Normalization → Dropout → Dense (ReLU) → Dropout → Dense (Softmax, 4 classes)
- **Input:** 224×224 RGB images, normalized
- **Loss / Metric:** Sparse categorical crossentropy / sparse categorical accuracy

---

## 🚀 Deployed Application

- **Backend:** FastAPI — handles image validation, preprocessing, model inference, and report generation
- **Frontend:** Browser-based UI (`index.html`, `script.js`, `style.css`) — patient registration → MRI upload → prediction → clinical report
- **Report Generation:** A free-tier LLM accessed via **OpenRouter** generates a structured clinical-style report (summary, impression, recommendation, disclaimer) from the prediction result — with a deterministic fallback if the API call fails
- **Supported Input:** Standard **JPG/PNG** images only (not DICOM or other medical imaging formats — see Future Work)
- **Privacy:** Only the structured prediction result and patient metadata are sent to the LLM; the MRI image itself is never transmitted

---

## 📂 Repository Structure

```
Brain-Radiology-Project/
├── backend/                                    # FastAPI backend (inference + report generation)
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py                # App configuration and settings
│   ├── models/
│   │   └── class_labels.json        # Class label mapping (glioma, meningioma, notumor, pituitary)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── prediction.py            # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── image_processing.py      # Image validation, resizing, preprocessing
│   │   ├── inference.py             # Model loading and prediction logic
│   │   └── report_generator.py      # OpenRouter AI report generation + fallback
│   ├── __init__.py
│   └── main.py                      # FastAPI app entry point and routes
├── README.md
└── requirements.txt

├── frontend/                                   # Web application frontend
│   ├── index.html
│   ├── script.js
│   └── style.css
├── notebooks/                                  # Training notebooks for all five backbones
│   ├── brain_tumor_classification_vgg16.ipynb
│   ├── brain_tumor_classification_resnet50.ipynb
│   ├── brain_tumor_classification_efficientnet.ipynb
│   ├── brain_tumor_classification_densenet121.ipynb
│   └── brain_tumor_classification_mobilenet.ipynb
├── visualization/
│   └── data_model_visualization.ipynb          # Dataset stats, comparative evaluation & audit
├── visualizationOutput/                        # Generated charts, heatmaps, and sample images
│   ├── 01_dataset_distribution.png
│   ├── 02_dataset_samples.png
│   ├── 02b_augmentation_samples.png
│   └── ...
└── README.md
```

---

## ⚙️ Setup & Installation

**Prerequisites:**
- Python 3.13
- The `model_efficientnet.h5` file must remain in the repository root
- Optional: an [OpenRouter API key](https://openrouter.ai/keys) for AI-generated reports (not required — falls back to a deterministic report if missing or if the request fails)

```powershell
# Clone the repository
git clone https://github.com/samir-pantha/Brain-Radiology-Project.git
cd Brain-Radiology-Project

# Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt

# (Optional) Set your OpenRouter API key for AI-generated reports
$env:OPENROUTER_API_KEY = "your_openrouter_key"

# (Optional) Override the default model (google/gemma-3-4b-it:free)
$env:OPENROUTER_MODEL = "provider/model-name"

# Run the backend server
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000

# Open the frontend
cd frontend
# open index.html in your browser, or serve it with a local dev server
```

**API endpoints:**
- `GET /health` — server readiness and model load status
- `POST /predict` — accepts a single MRI image (`image` field, multipart form-data, JPEG/PNG only, up to 25MB)
- `POST /generate-report` — accepts patient details and the prediction result as JSON; never receives the image itself

The backend and OpenRouter key stay server-side and are never exposed to the browser.
---

## 🔭 Future Scope

- Explainable AI (Grad-CAM) for model interpretability
- Multi-modal MRI analysis (T1, T2, FLAIR, contrast-enhanced)
- Full 3D/volumetric MRI support
- **DICOM support** — accepting standard medical imaging formats instead of exported JPG/PNG
- PACS / hospital system integration
- Cloud deployment and mobile application
- Larger, more diverse datasets (including South Asian patient data)
- Formal clinical validation with radiologist-confirmed diagnoses
- Multi-language report generation
- Federated learning across institutions
- Edge AI deployment for low-connectivity settings

---

## 👥 Team

| Name | Contribution |
|---|---|
| **Samir Pantha** | VGG16 & EfficientNetB0 |
| Sushal Lamsal |Resnet50|
| Sambridhi Adhikari |Mobilenetv3large |
| Adishree Phuyal |Densenet121|

**Supervisor:** Mr. Sunil Regmi, Lecturer, Department of Artificial Intelligence, Kathmandu University
**External Examiner:** Shristi Khatiwada



---

## 🙏 Acknowledgements

Department of Artificial Intelligence, School of Engineering, Kathmandu University — for the guidance and resources that made this project possible.
