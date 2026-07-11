import re

with open("app/do-repair.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { BASE_URL } from "../api";',
'''import { BASE_URL } from "../api";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const [isCompleted, setIsCompleted] = useState(false);',
'''    const [isCompleted, setIsCompleted] = useState(false);
    const { showAlert } = useCustomAlert();''')

# Replace alert(...) with showAlert(...)
content = re.sub(r'Alert\.alert\("Limit Tercapai", "Maksimal 5 foto per layanan\."\);', 
                 r'showAlert({ title: "Limit Tercapai", message: "Maksimal 5 foto per layanan.", type: "warning" });', content)
content = re.sub(r'Alert\.alert\("Izin Kamera Diperlukan", "Aplikasi membutuhkan izin kamera untuk mengambil foto bukti\."\);', 
                 r'showAlert({ title: "Izin Diperlukan", message: "Aplikasi membutuhkan izin kamera untuk mengambil foto bukti.", type: "warning" });', content)
content = re.sub(r'Alert\.alert\("Foto Diperlukan", `Mohon unggah minimal 1 foto hasil perbaikan untuk "\$\{missingPhoto\.name\}"\."\);?', 
                 r'showAlert({ title: "Foto Diperlukan", message: `Mohon unggah minimal 1 foto hasil perbaikan untuk "${missingPhoto.name}".`, type: "warning" });', content)
content = re.sub(r'Alert\.alert\("Kesalahan", error\.message \|\| "Gagal mengunggah foto hasil pekerjaan\. Silakan coba lagi\."\);', 
                 r'showAlert({ title: "Kesalahan", message: error.message || "Gagal mengunggah foto hasil pekerjaan. Silakan coba lagi.", type: "error" });', content)


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "rgba(250, 246, 240, 0.9)"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')
content = content.replace('borderColor: "#EFEBE4"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#D2C4B7"', 'borderColor: Theme.colors.border')


content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')

# Replace Buttons with AnimatedButton
primary_btn_code = """                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSelesaikanPesanan}>
                            <Text style={styles.primaryBtnText}>Selesaikan Pesanan</Text>
                        </TouchableOpacity>
                    </View>"""
new_primary_btn = """                    <View style={styles.footer}>
                        <AnimatedButton
                            title="Selesaikan Pesanan"
                            onPress={handleSelesaikanPesanan}
                            style={{ width: '100%' }}
                        />
                    </View>"""
content = content.replace(primary_btn_code, new_primary_btn)

modal_btn_code = """                                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmSelesai}>
                                    <Text style={styles.modalConfirmText}>Ya, Selesaikan Pekerjaan</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsConfirmVisible(false)}>
                                    <Text style={styles.modalCancelText}>Kembali, Cek Lagi</Text>
                                </TouchableOpacity>"""
new_modal_btn = """                                <AnimatedButton
                                    title="Ya, Selesaikan Pekerjaan"
                                    onPress={handleConfirmSelesai}
                                    style={{ width: '100%', marginBottom: 10 }}
                                />
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsConfirmVisible(false)}>
                                    <Text style={styles.modalCancelText}>Kembali, Cek Lagi</Text>
                                </TouchableOpacity>"""
content = content.replace(modal_btn_code, new_modal_btn)

success_btn_code = """                    <View style={styles.successFooter}>
                        <TouchableOpacity 
                            style={styles.successPrimaryBtn} 
                            onPress={() => {
                                router.replace({
                                    pathname: "/rate-user",
                                    params: { orderId: orderId }
                                } as any);
                            }}
                        >
                            <Text style={styles.successPrimaryText}>Berikan Penilaian kepada Pengguna</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.successSecondaryBtn} 
                            onPress={() => router.replace("/home-tech" as any)}
                        >
                            <Text style={styles.successSecondaryText}>Kembali ke Beranda</Text>
                        </TouchableOpacity>
                    </View>"""
new_success_btn = """                    <View style={styles.successFooter}>
                        <AnimatedButton
                            title="Berikan Penilaian kepada Pengguna"
                            onPress={() => {
                                router.replace({
                                    pathname: "/rate-user",
                                    params: { orderId: orderId }
                                } as any);
                            }}
                            style={{ width: '100%', marginBottom: 12 }}
                        />
                        <TouchableOpacity 
                            style={styles.successSecondaryBtn} 
                            onPress={() => router.replace("/home-tech" as any)}
                        >
                            <Text style={styles.successSecondaryText}>Kembali ke Beranda</Text>
                        </TouchableOpacity>
                    </View>"""
content = content.replace(success_btn_code, new_success_btn)

with open("app/do-repair.tsx", "w") as f:
    f.write(content)

