import re

with open("app/upload-evidence.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { setTempData } from "../utils/tempStorage";',
'''import { setTempData } from "../utils/tempStorage";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const [evidenceImages, setEvidenceImages] = useState<{ [key: string]: ImageType[] }>({});',
'''    const [evidenceImages, setEvidenceImages] = useState<{ [key: string]: ImageType[] }>({});
    const { showAlert } = useCustomAlert();''')

# Replace alert(...) with showAlert(...)
content = re.sub(r'Alert\.alert\("Limit Tercapai", "Maksimal 5 foto per layanan\."\);', 
                 r'showAlert({ title: "Limit Tercapai", message: "Maksimal 5 foto per layanan.", type: "warning" });', content)
content = re.sub(r'Alert\.alert\("Foto Diperlukan", `Mohon unggah minimal 1 foto untuk \$\{missingEvidence\.name\}\.`\);', 
                 r'showAlert({ title: "Foto Diperlukan", message: `Mohon unggah minimal 1 foto untuk ${missingEvidence.name}.`, type: "warning" });', content)


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')

content = content.replace('borderColor: "#EFEBE4"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#E8DFD5"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#D2C4B7"', 'borderColor: Theme.colors.border')


content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')
content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')

# Replace Buttons with AnimatedButton
primary_btn_code = """            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendEvidence}>
                    <Text style={styles.primaryBtnText}>Kirim Bukti Pengecekan</Text>
                </TouchableOpacity>
            </View>"""
new_primary_btn = """            <View style={styles.footer}>
                <AnimatedButton
                    title="Kirim Bukti Pengecekan"
                    onPress={handleSendEvidence}
                    style={{ width: '100%' }}
                />
            </View>"""
content = content.replace(primary_btn_code, new_primary_btn)

with open("app/upload-evidence.tsx", "w") as f:
    f.write(content)

