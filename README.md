# AI Skin Disease Detection and Recommendation System

An educational, end-to-end healthcare web app: upload a skin photo, get an AI
prediction with a Grad-CAM explanation, severity-based educational
recommendations, nearby dermatologists/hospitals in India, a downloadable PDF
report, and a multilingual (English / Hindi / Gujarati) UI.

> **Read this before anything else.** This is a working full-stack scaffold,
> not a certified medical device. Two pieces are intentionally **not**
> production-ready out of the box, and the app tells you so wherever they
> appear:
>
> 1. **The ML model.** No trained weights are bundled (training requires a
>    real, licensed, dermatologist-labeled dataset, which isn't included).
>    With `USE_MOCK_MODEL=true` (the default), the API uses a deterministic
>    mock predictor so every other module — upload, Grad-CAM-style heatmap,
>    recommendations, PDF report, dashboard — is fully exercisable today.
>    Drop a real `.keras` model trained with `backend/ml/train.py` at
>    `MODEL_PATH` and flip `USE_MOCK_MODEL=false` to go live with real
>    inference + real Grad-CAM.
> 2. **The doctor/hospital directory.** `backend/app/data/doctors_hospitals_india.json`
>    has a handful of sample entries for demo purposes only. Replace it with
>    a licensed, maintained directory (e.g. Google Places API or a hospital
>    network partnership) before any real use.
>
> Everything else — auth, upload pipeline, image quality checks, severity
> logic, recommendation engine, PDF/QR report generation, multilingual UI,
> user dashboard, and a starter admin analytics endpoint — is real, runnable
> code.

## What's fully built vs. scaffolded

| Module | Status |
|---|---|
| JWT auth (register/login/refresh/forgot-reset password) | ✅ Full |
| Image upload + blur/low-light detection | ✅ Full |
| AI prediction (top-3, confidence, severity) | ✅ Full pipeline, mock weights |
| Grad-CAM explainability | ✅ Real implementation, runs once a model is loaded |
| Disease info + recommendation engine | ✅ Full (6 sample conditions) |
| Educational medication info | ✅ Full (categories/purpose only — no dosing) |
| India doctor/hospital finder + favorites | ✅ Full logic, sample data |
| PDF report + QR verification | ✅ Full |
| Multilingual UI (EN/HI/GU) | ✅ Core strings translated |
| User dashboard (history) | ✅ Full |
| Admin analytics | 🟡 Starter endpoint (counts + distributions); build out a real dashboard UI as needed |
| Notifications, Celery/Redis jobs, PWA/offline, voice assistant | 🟡 Stubbed/noted, not implemented |
| CI/CD (GitHub Actions → Render/Vercel) | 🟡 Template workflow; add your own deploy hook/tokens as repo secrets |

## Tech stack

- **Frontend:** React + TypeScript, Tailwind, React Router, i18next, Framer Motion, Recharts
- **Backend:** FastAPI, Motor (MongoDB Atlas), JWT auth, Pydantic, Cloudinary, ReportLab + qrcode
- **ML:** TensorFlow/Keras EfficientNetB0, OpenCV, Grad-CAM
- **Infra:** Docker Compose, GitHub Actions

## Project structure

```
skin-disease-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint
│   │   ├── core/                  # config, JWT/password security
│   │   ├── db/mongodb.py          # Motor client + indexes
│   │   ├── models/, schemas/      # data models & request/response schemas
│   │   ├── api/routes/            # auth, predict, recommendations, doctors, reports, dashboard
│   │   ├── services/              # ml_service, gradcam, recommendation_engine, doctor_service, report_service, cloudinary_service
│   │   └── data/                  # disease_info.json, doctors_hospitals_india.json (sample)
│   ├── ml/                        # model_def.py, train.py, class_labels.json
│   ├── tests/
│   └── requirements.txt, Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Login, Register, Upload, Results, Dashboard, Doctors
│   │   ├── components/            # Navbar, UploadDropzone, ConfidenceChart, SeverityBadge, DoctorCard
│   │   ├── context/AuthContext.tsx
│   │   ├── i18n/                  # en.json, hi.json, gu.json
│   │   └── api/client.ts
│   └── package.json, tailwind.config.js, Dockerfile
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci-cd.yml
```

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # then edit MONGODB_URI etc.
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI).
With no MongoDB Atlas cluster configured, point `MONGODB_URI` at a local
Mongo instance, or `docker run -p 27017:27017 mongo`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

### 3. Or run both with Docker Compose

```bash
docker compose up --build
```

## Training a real model

```bash
cd backend/ml
python train.py --data_dir /path/to/your/labeled/dataset --epochs 30
```

Expects an `ImageFolder`-style directory (one subfolder per class matching
`class_labels.json`). You must supply your own licensed dataset — common
public dermatology datasets (ISIC, HAM10000, DermNet) each have their own
usage terms; review them before training or deploying a clinical model.
Once trained, copy `skin_model.keras` to the path set in `MODEL_PATH` and
set `USE_MOCK_MODEL=false`.

## Deployment

- **Frontend → Vercel:** `vercel --prod` from `/frontend`, or use the included
  GitHub Actions job (set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets).
- **Backend → Render:** create a Render Web Service from `/backend`
  (Docker runtime), set the env vars from `.env.example`, and set
  `RENDER_DEPLOY_HOOK_URL` as a repo secret to enable the CI/CD job.
- **Database → MongoDB Atlas:** create a free cluster, whitelist Render's IPs,
  and use the connection string as `MONGODB_URI`.
- **Storage → Cloudinary:** create a free account and copy the cloud
  name/API key/secret into `.env`.

## Security notes for production

- Move JWTs out of `localStorage` into httpOnly cookies set by the backend.
- Put real rate limits on `/api/auth/*` and `/api/predict` (slowapi is wired
  in `main.py` — add `@limiter.limit(...)` decorators per route).
- Add file-type sniffing (not just `Content-Type` header trust) before
  passing uploads to OpenCV/TensorFlow.
- Add HTTPS termination (Render/Vercel provide this by default) and review
  CORS origins before going live.

## Medical disclaimer

This application is intended only for educational and informational
purposes. AI predictions, recommendations, and educational medication
information are not substitutes for professional medical advice, diagnosis,
or treatment. Users should consult qualified healthcare professionals before
making medical decisions.
