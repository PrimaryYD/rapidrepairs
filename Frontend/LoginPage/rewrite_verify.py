import re

with open("app/verify-evidence.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { getTempData, clearTempData } from "../utils/tempStorage";',
'''import { getTempData, clearTempData } from "../utils/tempStorage";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const [isIncorrectPart, setIsIncorrectPart] = useState<boolean>(false);',
'''    const [isIncorrectPart, setIsIncorrectPart] = useState<boolean>(false);
    const { showAlert } = useCustomAlert();''')

# Replace alert(...) with showAlert(...)
content = re.sub(r'Alert\.alert\(\s*"Koneksi Gagal",\s*"Aplikasi tidak dapat menghubungi backend di " \+ BASE_URL \+ "\. Pastikan server backend Anda sudah jalan dan bisa diakses oleh HP Anda\."\s*\);', 
                 r'showAlert({ title: "Koneksi Gagal", message: "Aplikasi tidak dapat menghubungi backend di " + BASE_URL + ". Pastikan server backend Anda sudah jalan dan bisa diakses oleh HP Anda.", type: "error" });', content)
content = re.sub(r'Alert\.alert\("Gagal", "Tidak dapat menyetel ulang status pesanan\."\);', 
                 r'showAlert({ title: "Gagal", message: "Tidak dapat menyetel ulang status pesanan.", type: "error" });', content)


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('borderColor: "#FAF6F0"', 'borderColor: Theme.colors.background')

content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')


content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')


content = content.replace('backgroundColor: "#8B5E3C"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#8B5E3C"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')


# Replace main button with AnimatedButton
cancel_btn_code = """                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                        <Text style={styles.cancelBtnText}>Batalkan Unggahan</Text>
                    </TouchableOpacity>"""
new_cancel_btn = """                    <AnimatedButton
                        title="Batalkan Unggahan"
                        onPress={() => router.back()}
                        style={{ marginTop: 50 }}
                        variant="secondary"
                    />"""
content = content.replace(cancel_btn_code, new_cancel_btn)


reset_btn_code = """                        <TouchableOpacity style={styles.resetBtn} onPress={handleResetServices}>
                            <Text style={styles.resetBtnText}>Ubah Layanan</Text>
                        </TouchableOpacity>"""
new_reset_btn = """                        <AnimatedButton
                            title="Ubah Layanan"
                            onPress={handleResetServices}
                            style={{ flex: 1 }}
                        />"""
content = content.replace(reset_btn_code, new_reset_btn)

retake_btn_code = """                        <TouchableOpacity style={styles.retakeBtn} onPress={handleRetakePhotos}>
                            <Text style={styles.retakeBtnText}>Ambil Ulang</Text>
                        </TouchableOpacity>"""
new_retake_btn = """                        <AnimatedButton
                            title="Ambil Ulang"
                            onPress={handleRetakePhotos}
                            style={{ flex: 1 }}
                            variant="secondary"
                        />"""
content = content.replace(retake_btn_code, new_retake_btn)

with open("app/verify-evidence.tsx", "w") as f:
    f.write(content)

