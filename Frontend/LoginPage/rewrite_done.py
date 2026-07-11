import re

with open("app/done.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { Ionicons } from "@expo/vector-icons";',
'''import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const quickTags = ["Teknisi Cepat", "Kerja Rapi", "Responsif"];',
'''    const quickTags = ["Teknisi Cepat", "Kerja Rapi", "Responsif"];
    const { showAlert } = useCustomAlert();''')

# Replace alert(...) with showAlert(...)
content = re.sub(r'Alert\.alert\("Penilaian Diperlukan", "Mohon pilih jumlah bintang terlebih dahulu\."\);', 
                 r'showAlert({ title: "Penilaian Diperlukan", message: "Mohon pilih jumlah bintang terlebih dahulu.", type: "warning" });', content)
content = re.sub(r'Alert\.alert\("Kesalahan", "Gagal mengirim penilaian\. Silakan coba lagi\."\);', 
                 r'showAlert({ title: "Kesalahan", message: "Gagal mengirim penilaian. Silakan coba lagi.", type: "error" });', content)


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')
content = content.replace('borderColor: "#fff"', 'borderColor: Theme.colors.surface')


content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')

content = content.replace('borderColor: "#F0EFEB"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#EAE6DF"', 'borderColor: Theme.colors.border')
content = content.replace('backgroundColor: "#F2EBE5"', 'backgroundColor: Theme.colors.border')


content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')
content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')


# Replace main button with AnimatedButton
main_btn_code = """                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview}>
                        <Text style={styles.submitBtnText}>Kirim Penilaian</Text>
                    </TouchableOpacity>"""
new_main_btn = """                    <AnimatedButton
                        title="Kirim Penilaian"
                        onPress={handleSubmitReview}
                        style={{ width: '100%' }}
                    />"""
content = content.replace(main_btn_code, new_main_btn)


with open("app/done.tsx", "w") as f:
    f.write(content)

