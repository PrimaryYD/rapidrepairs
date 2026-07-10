import argparse
import sys
from validator import ClaimValidator

def main():
    parser = argparse.ArgumentParser(description="ClarifyAI-Tech Claims Validator CLI")
    parser.add_argument("--image", required=True, help="Path to the technician's uploaded image file")
    parser.add_argument("--service", required=True, help="The service claimed by the technician (e.g., 'AC Cleaning', 'Motorcycle Brakes', 'Electronic Board Repair')")
    args = parser.parse_args()

    print("=" * 60)
    print("            CLARIFAYAI-TECH: CLAIM VALIDATION ENGINE            ")
    print("=" * 60)
    print(f"Claimed Service : {args.service}")
    print(f"Target Image    : {args.image}")
    print("-" * 60)
    print("Running visual verification analysis...")
    
    try:
        validator = ClaimValidator()
        result = validator.validate_claim(args.image, args.service)
        
        status_text = "APPROVED (Genuine Claim)" if result.is_valid_claim else "REJECTED (False Claim)"
        if result.is_incorrect_part:
            status_text = "REJECTED (Incorrect Part Uploaded)"
            
        print("\n[VERIFICATION RESULTS]")
        print(f"Decision          : {status_text}")
        print(f"Confidence Score  : {result.confidence * 100:.1f}%")
        print(f"Part Match Valid  : {'Yes' if not result.is_incorrect_part else 'No (Mismatch)'}")
        print("\n[ANALYSIS REPORT]")
        print(result.analysis_summary)
        print("\n[KEY VISUAL MARKERS DETECTED]")
        for marker in result.visual_markers:
            print(f"  - {marker}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Failed to run claim validation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
