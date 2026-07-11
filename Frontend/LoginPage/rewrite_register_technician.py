import re

with open("app/register-technician.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { ActivityIndicator } from "react-native";',
'''import { ActivityIndicator } from "react-native";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const [step, setStep] = useState(params.step ? parseInt(params.step as string) : 1);',
'''    const [step, setStep] = useState(params.step ? parseInt(params.step as string) : 1);
    const { showAlert } = useCustomAlert();''')

# Replace alert(...) with showAlert(...)
content = re.sub(r'alert\((.*?)\);', r'showAlert({ title: "Informasi", message: \1, type: "warning" });', content)
content = re.sub(r'showAlert\(\{ title: "Informasi", message: "Error: " \+ errorMsg, type: "warning" \}\);', 
                 r'showAlert({ title: "Gagal Mendaftar", message: errorMsg, type: "error" });', content)
content = re.sub(r'showAlert\(\{ title: "Informasi", message: "Silahkan login terlebih dahulu", type: "warning" \}\);', 
                 r'showAlert({ title: "Sesi Berakhir", message: "Silahkan login terlebih dahulu.", type: "warning" });', content)

# Replace bottom button with AnimatedButton
bottom_btn_code = """            {/* BOTTOM BAR WITH BUTTON */}
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleNext}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.primaryBtnText}>
                            {step === 3 ? "Kirim Pendaftaran" : `Lanjut ke Langkah ${step + 1}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>"""
new_bottom_btn = """            {/* BOTTOM BAR WITH BUTTON */}
            <View style={styles.bottomBar}>
                <AnimatedButton 
                    title={step === 3 ? "Kirim Pendaftaran" : `Lanjut ke Langkah ${step + 1}`}
                    onPress={handleNext}
                    isLoading={loading}
                    disabled={loading}
                    style={{ width: '100%' }}
                />
            </View>"""

content = content.replace(bottom_btn_code, new_bottom_btn)

# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')
content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('backgroundColor: "#BE9C80"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#BE9C80"', 'borderColor: Theme.colors.primary')
content = content.replace('backgroundColor: "#C0997B"', 'backgroundColor: Theme.colors.primary')

content = content.replace('backgroundColor: "#FFF"', 'backgroundColor: Theme.colors.surface')
content = content.replace('backgroundColor: "white"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#222"', 'color: Theme.colors.text')
content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#888"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#AAA"', 'color: Theme.colors.border')
content = content.replace('placeholderTextColor="#AAA"', 'placeholderTextColor={Theme.colors.textMuted}')

content = content.replace('borderColor: "#EFEBE4"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#D2C4B7"', 'borderColor: Theme.colors.border')
content = content.replace('backgroundColor: "#E8DFD5"', 'backgroundColor: Theme.colors.border')
content = content.replace('backgroundColor: "#D2C4B7"', 'backgroundColor: Theme.colors.border')
content = content.replace('backgroundColor: "#F5F5F5"', 'backgroundColor: Theme.colors.inputBg')
content = content.replace('borderBottomColor: "#F5F5F5"', 'borderBottomColor: Theme.colors.border')

# Font formatting
content = content.replace('fontSize: 18,\n        fontWeight: "700"', '...Theme.typography.h3')
content = content.replace('fontSize: 18,\n        fontWeight: "800"', '...Theme.typography.h2')
content = content.replace('fontSize: 15,\n        fontWeight: "700"', '...Theme.typography.subtitle')
content = content.replace('fontSize: 14,\n        fontWeight: "700"', '...Theme.typography.subtitle')
content = content.replace('fontSize: 13,\n        fontWeight: "600"', '...Theme.typography.body')

with open("app/register-technician.tsx", "w") as f:
    f.write(content)

