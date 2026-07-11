import os
import sys
from validator import ClaimValidator

def main():
    print("=" * 70)
    print("               CLARIFAYAI-TECH: AUTOMATED TEST SUITE                ")
    print("=" * 70)
    
    # Check for samples directory
    samples_dir = "samples"
    if not os.path.exists(samples_dir):
        print(f"[ERROR] Samples directory not found at '{samples_dir}'. Please generate sample images first.")
        sys.exit(1)

    # Define test cases: (Image Path, Claimed Service, Expected Valid Claim, Expected Mismatch, Case Description)
    test_cases = [
        (
            os.path.join(samples_dir, "dirty_ac_filter.png"),
            "AC Cleaning",
            True,
            False,
            "Genuine AC service: Clogged filter submitted"
        ),
        (
            os.path.join(samples_dir, "clean_ac_filter.png"),
            "AC Cleaning",
            False,
            False,
            "False AC claim: Perfectly clean filter submitted"
        ),
        (
            os.path.join(samples_dir, "worn_brake_pad.png"),
            "Motorcycle Brakes",
            True,
            False,
            "Genuine motorcycle service: Worn brake pads submitted"
        ),
        (
            os.path.join(samples_dir, "burnt_pcb.png"),
            "Electronic Board Repair",
            True,
            False,
            "Genuine electronics repair: Burnt board capacitor submitted"
        ),
        (
            os.path.join(samples_dir, "clean_ac_filter.png"),
            "Electronic Board Repair",
            False,
            True,
            "Part mismatch: Technician uploaded AC filter for a PCB claim"
        )
    ]

    validator = ClaimValidator()
    
    print("\nRunning automated visual tests...")
    print("-" * 70)
    
    passed_cases = 0
    total_cases = len(test_cases)
    results = []

    for idx, (img_path, service, exp_valid, exp_mismatch, desc) in enumerate(test_cases, 1):
        print(f"\n[Test Case {idx}/{total_cases}] {desc}")
        print(f"  Image:   {img_path}")
        print(f"  Claim:   {service}")
        
        if not os.path.exists(img_path):
            print(f"  [SKIP] Image file not found: {img_path}")
            results.append((desc, "SKIPPED", False))
            continue
            
        try:
            res = validator.validate_claim(img_path, service)
            
            # Check validation correctness
            valid_ok = (res.is_valid_claim == exp_valid)
            mismatch_ok = (res.is_incorrect_part == exp_mismatch)
            
            if valid_ok and mismatch_ok:
                status = "PASSED"
                passed_cases += 1
            else:
                status = "FAILED"
                
            print(f"  AI Verdict  : {'APPROVED' if res.is_valid_claim else 'REJECTED'}")
            print(f"  Part Mismatch: {'Yes' if res.is_incorrect_part else 'No'}")
            print(f"  Confidence  : {res.confidence * 100:.1f}%")
            print(f"  Key Markers : {', '.join(res.visual_markers[:2])}...")
            print(f"  Report      : {res.analysis_summary[:120]}...")
            print(f"  Case Status : {status}")
            
            results.append((desc, status, res.is_valid_claim))
        except Exception as e:
            print(f"  [ERROR] Running test failed: {e}")
            results.append((desc, "ERROR", False))

    print("\n" + "=" * 70)
    print("                       TEST EXECUTION SUMMARY                       ")
    print("=" * 70)
    print(f"Total Test Cases : {total_cases}")
    print(f"Passed           : {passed_cases}")
    print(f"Failed           : {total_cases - passed_cases}")
    print(f"Success Rate     : {(passed_cases / total_cases) * 100:.1f}%")
    print("-" * 70)
    print(f"{'Test Case Description':<48} | {'Status':<10} | {'Decision':<10}")
    print("-" * 70)
    for desc, status, is_approved in results:
        decision_str = "APPROVED" if is_approved else "REJECTED"
        print(f"{desc:<48} | {status:<10} | {decision_str:<10}")
    print("=" * 70)

if __name__ == "__main__":
    main()
