import os
import shutil
import uuid
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from validator import ClaimValidator

# Load environmental configs
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="ClarifyAI-Tech API Server",
    description="REST API server for visual verification of field technician service claims.",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows Web Apps (React, Angular, Vue), mobile apps (Flutter, React Native), or local sites to query this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate our ClaimValidator engine once at startup
validator = ClaimValidator()

# Directory for streaming uploaded technician files
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/verify")
async def verify_claim(
    service: str = Form(..., description="The service type claimed by the technician (e.g. 'AC Cleaning', 'Motorcycle Brakes')"),
    file: UploadFile = File(..., description="Technician's uploaded image verification file")
):
    """
    Core verification endpoint.
    Accepts an uploaded image file and a service claim description.
    Returns the validated structured JSON inspection report.
    """
    # Double check temp directory exists
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Validate file type extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp", ".heic"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{file_ext}'. Please upload an image (JPG, PNG, WEBP, HEIC)."
        )

    # Securely stream upload to a temporary file on disk with UUID to prevent overlaps
    temp_filename = f"{uuid.uuid4()}{file_ext}"
    temp_filepath = os.path.join(TEMP_DIR, temp_filename)

    try:
        # Stream file write
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run our AI claim validation engine
        result = validator.validate_claim(temp_filepath, service)
        return result

    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        print(f"[API ERROR] Verification failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI Engine failure: {str(e)}")

    finally:
        # Guarantee removal of temporary image file to protect user storage
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as ex:
                print(f"Warning: Could not remove temporary file {temp_filepath}: {ex}")

@app.get("/")
def read_root():
    """
    Health check and status dashboard endpoint.
    """
    return {
        "status": "healthy",
        "engine": "ClarifyAI-Tech Claim Verification Engine",
        "version": "1.0.0",
        "active_mode": "MOCK MODE (Dry-Run Heuristics)" if validator.use_mock else "PRODUCTION VLM (Gemini 3.5 Flash)",
        "gemini_api_key_configured": not validator.use_mock
    }

if __name__ == "__main__":
    # Fetch host and port from environment config or fallback to defaults
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    print(f"Starting ClarifyAI-Tech API Server on http://{host}:{port}")
    uvicorn.run("server:app", host=host, port=port, reload=True)
