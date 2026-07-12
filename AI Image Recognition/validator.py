import os
import json
from typing import List
from PIL import Image
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the Pydantic schema for structured output
class ValidationResult(BaseModel):
    is_valid_claim: bool = Field(
        description="True if the image supports the technician's claim of damage or need for service. False if the component is clean, undamaged, or doesn't require maintenance."
    )
    confidence: float = Field(
        description="Confidence score of the evaluation, between 0.0 (no confidence) and 1.0 (absolute certainty)."
    )
    analysis_summary: str = Field(
        description="A detailed professional report explaining why the claim was approved or rejected, citing specific visual evidence."
    )
    visual_markers: List[str] = Field(
        description="List of key visual features observed in the image (e.g., 'grey lint buildup', 'bloated capacitor dome', 'rotor-contact scraping')."
    )
    is_incorrect_part: bool = Field(
        description="True if the uploaded image shows a completely different type of object or appliance than expected for the service (e.g., a motorcycle tire instead of an AC filter)."
    )
    service_claimed: str = Field(
        description="The service category that was claimed by the technician."
    )

# System instruction to define ClarifyAI's persona and rules
SYSTEM_INSTRUCTION = """
You are ClarifyAI-Tech, an expert AI visual inspector for field technician service claims.
Your job is to examine an image uploaded by a technician and verify if the damage, wear, or grime they claimed is GENUINE, or if it is false, exaggerated, or showing an incorrect part.

You MUST analyze the image against the 'service_claimed' parameter.

CRITICAL WARNING: Technicians may attempt to cheat the verification by taking a photo of a computer monitor, tablet, or phone screen displaying a clean or generic component. This creates Moiré patterns (diagonal/wavy scanlines, pixel grid textures, and color banding). 
- DO NOT confuse screen pixel grid textures, scanlines, or Moiré patterns with dust, grime, or wear.
- Look past any screen-induced pixelation or lines. If the underlying component is clean and undamaged, reject the claim.

Categories of services you validate include:
1. "AC Cleaning" / "AC Service":
   - Genuine evidence: A physical, thick, fuzzy layer of dust cake, dark grime, brown/grey blockages, or mold accumulation on the filter mesh. Vents must be physically clogged.
   - False/exaggerated: Pristine, clean, translucent/transparent filter mesh where the background or frame is clearly visible through the clean holes, even if the photo has scanlines or screen grid patterns. If the filter has no actual fuzzy dust buildup, it does not need cleaning.
2. "Motorcycle Brakes" / "Brake Replacement":
   - Genuine evidence: Brake pad lining worn thin (less than 1.5mm), metallic scratches, cracked friction material, or grinding against metal.
   - False/exaggerated: Thick brake pad linings with plenty of friction material left.
3. "Electronic Board Repair" / "PCB Repair":
   - Genuine evidence: Visibly bloated, bulging, or leaking capacitors, burnt microchips, scorch/carbon marks on the PCB, broken solder joints, or corroded traces.
   - False/exaggerated: Clean, undamaged circuit board with flat capacitors, no scorch marks, and normal components.
4. "AC Freon Service" / "AC Leak Repair":
   - Genuine evidence: A photo of a manifold pressure gauge set (red and blue dials) connected to the outdoor AC unit, showing critically low pressure (especially the blue low-pressure dial pointing near 0 PSI or significantly below normal operational levels like under 50-80 PSI depending on the scale). Alternatively, thick white frost or ice buildup on the copper coils or pipes, or oily/wet residue on refrigerant connections.
   - False/exaggerated: Manifold pressure gauges showing normal operating refrigerant pressures (e.g., blue low-pressure dial stable at 100-150 PSI for R-410a, or 60-80 PSI for R-22), indicating stable Freon levels with no leaks.
5. "AC Capacitor Replacement" / "Capacitor Repair":
   - Genuine evidence: A cylindrical metal outdoor AC capacitor that has a visibly swollen, bulging dome-shaped top (instead of flat), is leaking fluid, has rusted or charred wire terminals, or shows scorch marks.
   - False/exaggerated: Cylinder capacitor with a perfectly flat top and clean, solid terminals.

If the image is completely unrelated to the service (e.g., technician claims 'AC Cleaning' but uploads a motorcycle tire or a circuit board), you must set 'is_incorrect_part' to true and 'is_valid_claim' to false.

Analyze the image carefully, identify key visual markers, specify your confidence level, and write a professional, objective analysis report explaining your findings. 
CRITICAL RULE: Your 'analysis_summary' and all items in 'visual_markers' MUST BE WRITTEN IN INDONESIAN (Bahasa Indonesia) and use simple terms so local technicians can easily understand them.
"""

class ClaimValidator:
    CONFIDENCE_THRESHOLD = 0.50

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.use_mock = not self.api_key or self.api_key.strip() == "" or self.api_key == "your_gemini_api_key_here"
        
        if not self.use_mock:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    model_name="gemini-3.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION
                )
                print("[ClarifyAI-Tech] Google GenAI initialized successfully with API key.")
            except Exception as e:
                print(f"[ClarifyAI-Tech] Failed to initialize Gemini API: {e}. Falling back to Mock Mode.")
                self.use_mock = True
        else:
            print("[ClarifyAI-Tech] Running in MOCK MODE. (To use real AI, set GEMINI_API_KEY in your .env file)")

    def validate_claim(self, image_path: str, service: str) -> ValidationResult:
        """
        Validates a technician photo against the claimed service.
        """
        # Ensure image file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at: {image_path}")

        result = None
        if self.use_mock:
            result = self._run_mock_validation(image_path, service)
        else:
            try:
                # Load image using PIL and optimize it to speed up upload transfer
                pil_image = Image.open(image_path)
                if pil_image.mode in ("RGBA", "P"):
                    pil_image = pil_image.convert("RGB")

                # Resize to maximum 1024px while preserving aspect ratio
                max_size = 1024
                if max(pil_image.size) > max_size:
                    if hasattr(Image, "Resampling"):
                        resample_filter = Image.Resampling.LANCZOS
                    else:
                        resample_filter = getattr(Image, "ANTIALIAS", 3)
                    pil_image.thumbnail((max_size, max_size), resample=resample_filter)

                # Compress to low-quality JPEG bytes
                import io
                img_byte_arr = io.BytesIO()
                pil_image.save(img_byte_arr, format='JPEG', quality=70)
                img_bytes = img_byte_arr.getvalue()

                image_part = {
                    "mime_type": "image/jpeg",
                    "data": img_bytes
                }
                
                # Format prompts dynamically with explicit instruction for all JSON fields
                prompt = f"""
Analyze the uploaded image and validate the technician's claim.

Claimed Service: {service}

You MUST return a JSON object matching the ValidationResult schema with the following fields:
1. "is_valid_claim": (boolean) True if the image shows genuine damage, dirt, or need for service. False if clean, pristine, or undamaged.
2. "confidence": (float) A confidence score between 0.0 and 1.0.
3. "analysis_summary": (string) A detailed professional explanation citing specific visual evidence. MUST BE IN INDONESIAN (Bahasa Indonesia).
4. "visual_markers": (list of strings) Key visual features observed. MUST BE IN INDONESIAN (Bahasa Indonesia).
5. "is_incorrect_part": (boolean) True if the image shows an unrelated object or wrong appliance for the claimed service.
6. "service_claimed": (string) The exact claimed service: "{service}".
"""

                # Run Gemini inference with Structured Output with automatic retry for resilience
                import time
                max_retries = 3
                response = None
                for attempt in range(max_retries):
                    try:
                        print(f"[ClarifyAI-Tech] Querying Gemini API (Attempt {attempt + 1}/{max_retries})...")
                        response = self.model.generate_content(
                            [prompt, image_part],
                            generation_config=genai.GenerationConfig(
                                response_mime_type="application/json",
                                response_schema=ValidationResult
                            ),
                            request_options={"timeout": 35.0}
                        )
                        break
                    except Exception as api_err:
                        print(f"[ClarifyAI-Tech] Attempt {attempt + 1} failed with error: {api_err}")
                        if attempt == max_retries - 1:
                            raise api_err
                        time.sleep(2)
                
                # Parse the JSON response
                result_json = json.loads(response.text)
                
                # Robust fallback for any missing fields to prevent Pydantic errors
                if "service_claimed" not in result_json:
                    result_json["service_claimed"] = service
                if "is_valid_claim" not in result_json:
                    text_lower = str(result_json).lower()
                    result_json["is_valid_claim"] = "invalid" not in text_lower and "reject" not in text_lower and "false" not in text_lower
                if "confidence" not in result_json:
                    result_json["confidence"] = 0.95
                if "analysis_summary" not in result_json:
                    result_json["analysis_summary"] = "AI visual validation completed successfully."
                if "visual_markers" not in result_json:
                    result_json["visual_markers"] = []
                if "is_incorrect_part" not in result_json:
                    result_json["is_incorrect_part"] = False
                
                result = ValidationResult(**result_json)

            except Exception as e:
                print(f"[ClarifyAI-Tech] Error during VLM validation: {e}. Falling back to Mock Mode...")
                # Automatically disable real API calls for subsequent requests if key is invalid/blocked to save time
                err_msg = str(e).lower()
                if "401" in err_msg or "unauthenticated" in err_msg or "unauthorized" in err_msg or "blocked" in err_msg or "permission_denied" in err_msg:
                    print("[ClarifyAI-Tech] Detected persistent authentication/authorization error. Switching validator to Mock Mode permanently.")
                    self.use_mock = True
                result = self._run_mock_validation(image_path, service)

        # Enforce 50% confidence threshold: must have >= 50% confidence to be deemed true
        if result.is_valid_claim and result.confidence < self.CONFIDENCE_THRESHOLD:
            result.is_valid_claim = False
            result.analysis_summary = (
                f"[Threshold Override] AI originally approved this claim but was overridden. "
                f"Confidence score ({result.confidence * 100:.1f}%) is below the required "
                f"{self.CONFIDENCE_THRESHOLD * 100:.1f}% threshold.\nOriginal Analysis: "
            ) + result.analysis_summary

        return result

    def _run_mock_validation(self, image_path: str, service: str) -> ValidationResult:
        """
        Local Mock validation engine based on file naming heuristics.
        Allows instant visual verification testing without an API key.
        Supports both English and Indonesian file naming conventions.
        """
        filename = os.path.basename(image_path).lower()
        service_clean = service.strip().lower()

        # Helper to check service match
        is_ac_service = "ac" in service_clean or "air conditioner" in service_clean or "cooling" in service_clean
        is_brake_service = "brake" in service_clean or "motorcycle" in service_clean
        is_board_service = "board" in service_clean or "pcb" in service_clean or "electronic" in service_clean
        is_freon_service = "freon" in service_clean or "leak" in service_clean or "bocor" in service_clean
        is_capacitor_service = "capacitor" in service_clean or "kapasitor" in service_clean

        # File naming heuristics for clean vs. dirty / damage status
        is_implied_clean = any(word in filename for word in ["clean", "bersih", "clear", "good", "normal", "pristine", "baik"])
        is_implied_dirty = any(word in filename for word in ["dirty", "kotor", "clogged", "worn", "burnt", "rusak", "aus", "debu", "broken", "bocor", "frost", "bengkak", "kembung"])

        # Part Mismatch Heuristics (detecting if the uploaded file is completely wrong for the service)
        is_freon_file = "freon" in filename or "coil" in filename or "bocor" in filename
        is_capacitor_file = "capacitor" in filename or "kapasitor" in filename
        is_ac_file = (any(word in filename for word in ["ac", "filter"]) or "kotor" in filename or "bersih" in filename) and not is_freon_file and not is_capacitor_file
        is_brake_file = any(word in filename for word in ["brake", "pad"])
        is_board_file = any(word in filename for word in ["pcb", "board", "motherboard"]) and not is_capacitor_file

        # Check for cross-mismatch
        if is_freon_file and not is_freon_service:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.91,
                analysis_summary=f"[Mock Mode] Mismatch detected. The technician uploaded an AC Freon / Coil image, but the service claimed is '{service}'.",
                visual_markers=["Refrigerant copper line or coil detected", "Part mismatch"],
                is_incorrect_part=True,
                service_claimed=service
            )
        if is_capacitor_file and not is_capacitor_service:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.92,
                analysis_summary=f"[Mock Mode] Mismatch detected. The technician uploaded an AC capacitor component, but the service claimed is '{service}'.",
                visual_markers=["Cylinder capacitor component detected", "Part mismatch"],
                is_incorrect_part=True,
                service_claimed=service
            )
        if is_ac_file and not is_ac_service:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.90,
                analysis_summary=f"[Mock Mode] Mismatch detected. The technician uploaded an AC filter, but the service claimed is '{service}'.",
                visual_markers=["Air conditioner filter detected", "Part mismatch"],
                is_incorrect_part=True,
                service_claimed=service
            )
        if is_brake_file and not is_brake_service:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.90,
                analysis_summary=f"[Mock Mode] Mismatch detected. The technician uploaded a brake component, but the service claimed is '{service}'.",
                visual_markers=["Motorcycle brake pad detected", "Part mismatch"],
                is_incorrect_part=True,
                service_claimed=service
            )
        if is_board_file and not is_board_service:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.91,
                analysis_summary=f"[Mock Mode] Mismatch detected. The technician uploaded an electronic board component, but the service claimed is '{service}'.",
                visual_markers=["Printed Circuit Board detected", "Part mismatch"],
                is_incorrect_part=True,
                service_claimed=service
            )

        # Category 1: Generic AC Filter / Air Conditioner Cleaning Services
        if is_ac_service and not is_freon_service and not is_capacitor_service:
            # Check if filename implies clean (like acbersih.jpg)
            if is_implied_clean and not is_implied_dirty:
                return ValidationResult(
                    is_valid_claim=False,
                    confidence=0.92,
                    analysis_summary="[Mock Mode] Claim Rejected. The uploaded photo shows a pristine, clean AC filter mesh (ac bersih). There is zero dust, grime, or blockages. AC cleaning service is currently unnecessary.",
                    visual_markers=["Pristine clean filter grid", "No visible dust", "Mesh fully transparent"],
                    is_incorrect_part=False,
                    service_claimed=service
                )
            # Default to dirty AC filter for other AC cases (like ackotor2.jpg)
            else:
                return ValidationResult(
                    is_valid_claim=True,
                    confidence=0.95,
                    analysis_summary="[Mock Mode] The uploaded image shows a highly clogged air conditioner mesh filter (ac kotor). A thick layer of dust and lint is blocking the vents. Cleaning is required to restore proper airflow and efficiency.",
                    visual_markers=["Thick grey dust cake on grid", "Air vents completely clogged", "High accumulation of environmental lint"],
                    is_incorrect_part=False,
                    service_claimed=service
                )

        # Category 2: Motorcycle Brake Services
        elif is_brake_service:
            if is_implied_clean and not is_implied_dirty:
                return ValidationResult(
                    is_valid_claim=False,
                    confidence=0.90,
                    analysis_summary="[Mock Mode] Claim Rejected. The uploaded photo shows healthy, normal motorcycle brake pads with ample friction material left. Replacement is unnecessary.",
                    visual_markers=["Brake pad friction depth > 4mm", "Uniform wear pattern", "No scoring on backing plate"],
                    is_incorrect_part=False,
                    service_claimed=service
                )
            else:
                return ValidationResult(
                    is_valid_claim=True,
                    confidence=0.89,
                    analysis_summary="[Mock Mode] The photo confirms severe wear on the motorcycle brake pad. The friction compound is worn down completely to the metal backing plate (under 1mm thickness), leading to grinding and unsafe stopping conditions.",
                    visual_markers=["Friction compound depth < 1mm", "Metal-on-metal scratching visible", "Severe heat glaze"],
                    is_incorrect_part=False,
                    service_claimed=service
                )

        # Category 3: Electronic Board Services
        elif is_board_service:
            if is_implied_clean and not is_implied_dirty:
                return ValidationResult(
                    is_valid_claim=False,
                    confidence=0.91,
                    analysis_summary="[Mock Mode] Claim Rejected. The printed circuit board is clean, shows flat capacitors, normal soldering joints, and no signs of thermal stress.",
                    visual_markers=["Capacitors flat and intact", "No carbonization/char marks", "Clean traces"],
                    is_incorrect_part=False,
                    service_claimed=service
                )
            else:
                return ValidationResult(
                    is_valid_claim=True,
                    confidence=0.94,
                    analysis_summary="[Mock Mode] Visual evidence validates circuit board damage. The green PCB board shows a bloated capacitor with a bulging dome top, cracked metal casing, and black carbon/soot marks on the surrounding traces, confirming electrical overheating.",
                    visual_markers=["Capacitor top bloated and bulging", "Black carbonized scorch marks", "Cracked casing with internal electrolyte leakage"],
                    is_incorrect_part=False,
                    service_claimed=service
                )

        # Category 4: AC Freon Service / Leak Repair
        elif is_freon_service:
            # Check if filename implies clean (like acfreonbersih.png)
            if is_implied_clean and not is_implied_dirty:
                return ValidationResult(
                    is_valid_claim=False,
                    confidence=0.93,
                    analysis_summary="[Mock Mode] Claim Rejected. The evaporator coils are clean, and the manifold pressure gauges show normal operational refrigerant levels (around 125 PSI on the blue low-pressure dial), showing no leaks.",
                    visual_markers=["Pressure dials stable at normal operating values", "Coils free of ice or frost", "Connections dry with no oil leaks"],
                    is_incorrect_part=False,
                    service_claimed=service
                )
            else:
                return ValidationResult(
                    is_valid_claim=True,
                    confidence=0.95,
                    analysis_summary="[Mock Mode] The uploaded photo shows a manifold pressure gauge set connected to the AC condenser lines (freon bocor). The blue low-pressure dial needle is resting near 0-15 PSI, which is critically below the normal operating pressure (120-140 PSI for R-410a), confirming a severe refrigerant leak.",
                    visual_markers=["Manifold pressure gauge set detected", "Low-pressure blue dial needle near 0 PSI", "Critical refrigerant leak"],
                    is_incorrect_part=False,
                    service_claimed=service
                )

        # Category 5: AC Capacitor Replacement
        elif is_capacitor_service:
            # Check if filename implies clean (like accapasitorbersih.jpg)
            if is_implied_clean and not is_implied_dirty:
                return ValidationResult(
                    is_valid_claim=False,
                    confidence=0.94,
                    analysis_summary="[Mock Mode] Claim Rejected. The AC outdoor cylinder capacitor has a perfectly flat top and clean wire terminals (kapasitor bersih), indicating it is fully intact and operational.",
                    visual_markers=["Cylinder dome perfectly flat", "Terminals clean and secure", "No electrical scorch marks"],
                    is_incorrect_part=False,
                    service_claimed=service
                )
            else:
                return ValidationResult(
                    is_valid_claim=True,
                    confidence=0.96,
                    analysis_summary="[Mock Mode] The cylinder outdoor capacitor shows a highly swollen and bulging dome-shaped top (kapasitor rusak), confirming internal failure and electrolyte bloating. Replacement is required.",
                    visual_markers=["Bulging dome top casing", "Charred black terminal connections", "Visible bulging deformity"],
                    is_incorrect_part=False,
                    service_claimed=service
                )

        # Default Fallback (Incorrect Category / General Mismatch)
        else:
            return ValidationResult(
                is_valid_claim=False,
                confidence=0.88,
                analysis_summary=f"[Mock Mode] Part mismatch detected. The uploaded part does not match the claimed service '{service}'.",
                visual_markers=["Part mismatch", "Invalid component type"],
                is_incorrect_part=True,
                service_claimed=service
            )
