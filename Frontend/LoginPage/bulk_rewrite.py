import os
import re

files_to_process = [
    "app/start-inspection.tsx",
    "app/waiting-proof.tsx",
    "app/waiting-payment-tech.tsx",
    "app/withdraw-processing.tsx",
    "app/review-success.tsx",
    "app/payment-failed.tsx",
    "app/payment-webview.tsx",
    "app/success.tsx",
    "app/registration-success.tsx",
    "app/registration-status.tsx",
    "app/face-verification.tsx"
]

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    # Generic replacements for Theme
    if "import { Theme }" not in content:
        # insert near react imports
        content = content.replace('import { StyleSheet,', 'import { Theme }\nimport { StyleSheet,')
        if "import { Theme }" not in content:
             content = re.sub(r'(import .* from "react-native";)', r'\1\nimport { Theme } from "../constants/Theme";', content, 1)

    # Colors -> Theme
    content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
    content = content.replace('backgroundColor: "#F4E2C7"', 'backgroundColor: Theme.colors.background')
    content = content.replace('backgroundColor: "#F6F2EA"', 'backgroundColor: Theme.colors.background')

    content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')
    content = content.replace('backgroundColor: "#FFF"', 'backgroundColor: Theme.colors.surface')
    content = content.replace('borderColor: "#fff"', 'borderColor: Theme.colors.surface')

    content = content.replace('color: "#333"', 'color: Theme.colors.text')
    content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
    content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
    content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
    content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')

    content = content.replace('borderColor: "#F0EFEB"', 'borderColor: Theme.colors.border')
    content = content.replace('borderColor: "#EAE6DF"', 'borderColor: Theme.colors.border')
    content = content.replace('backgroundColor: "#F2EBE5"', 'backgroundColor: Theme.colors.border')

    content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
    content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
    content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')
    content = content.replace('backgroundColor: "#8B5E3C"', 'backgroundColor: Theme.colors.primary')
    content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')
    
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Processed {filepath}")

for f in files_to_process:
    process_file(f)

