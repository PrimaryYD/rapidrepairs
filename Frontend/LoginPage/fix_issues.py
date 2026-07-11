import glob
import re

files = glob.glob("app/**/*.tsx", recursive=True) + glob.glob("components/**/*.tsx", recursive=True)

for file in files:
    try:
        with open(file, 'r') as f:
            content = f.read()

        new_content = content
        # Fix imports
        new_content = new_content.replace('from "../constants/Theme";', 'from "../constants/theme";')
        new_content = new_content.replace("from '../constants/Theme';", "from '../constants/theme';")
        new_content = new_content.replace('from "../../constants/Theme";', 'from "../../constants/theme";')
        new_content = new_content.replace("from '../../constants/Theme';", "from '../../constants/theme';")
        
        # Fix home-tech.tsx 'error' -> 'danger'
        if file.endswith("home-tech.tsx"):
            new_content = new_content.replace('Theme.colors.error', 'Theme.colors.danger')
            
        # Fix history.tsx alert format
        if file.endswith("history.tsx"):
            alert_pattern = r'''showAlert\(\{
\s*title:\s*"Klaim Garansi",
\s*message:\s*"Apakah Anda yakin ingin mengajukan klaim garansi untuk perbaikan ini\? Klaim akan diteruskan ke admin untuk disetujui\.",
\s*type:\s*"info",
\s*showCancel:\s*true,
\s*cancelText:\s*"Batal",
\s*confirmText:\s*"Ajukan Klaim",
\s*onConfirm:\s*(async \(\) => \{[\s\S]*?\})\s*\}\);'''
            
            replacement = r'''showAlert({
                    title: "Klaim Garansi",
                    message: "Apakah Anda yakin ingin mengajukan klaim garansi untuk perbaikan ini? Klaim akan diteruskan ke admin untuk disetujui.",
                    type: "info",
                    buttons: [
                        { text: "Batal", style: "cancel" },
                        { 
                            text: "Ajukan Klaim", 
                            onPress: \1 
                        }
                    ]
                });'''
            
            new_content = re.sub(alert_pattern, replacement, new_content)

        if new_content != content:
            with open(file, 'w') as f:
                f.write(new_content)
            print(f"Fixed {file}")
            
    except Exception as e:
        print(f"Error processing {file}: {e}")

