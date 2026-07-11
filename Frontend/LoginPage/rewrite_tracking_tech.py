import re

with open("app/tracking-tech.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import AcMapView from "../components/AcMapView";',
'''import AcMapView from "../components/AcMapView";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const mapRef = useRef<any>(null);',
'''    const mapRef = useRef<any>(null);
    const { showAlert } = useCustomAlert();''')

# Replace alert
content = re.sub(r'alert\("Izin lokasi diperlukan."\);', 
                 r'showAlert({ title: "Izin Diperlukan", message: "Izin lokasi diperlukan.", type: "warning" });', content)
content = re.sub(r'alert\("Anda telah sampai di tujuan!"\);', 
                 r'showAlert({ title: "Sampai Tujuan", message: "Anda telah sampai di tujuan!", type: "success" });', content)

# Replace arrived button with AnimatedButton
arrived_btn_code = """                <TouchableOpacity style={styles.arrivedBtn} onPress={finishOrder}>
                    <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.arrivedText}>Sampai Tujuan</Text>
                </TouchableOpacity>"""
new_arrived_btn = """                <AnimatedButton
                    title="Sampai Tujuan"
                    icon={<Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />}
                    onPress={finishOrder}
                    style={{ width: '100%' }}
                />"""
content = content.replace(arrived_btn_code, new_arrived_btn)

# Apply Theme colors to styles
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')
content = content.replace('backgroundColor: "#F9F6F2"', 'backgroundColor: Theme.colors.primaryLight + "20"')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('backgroundColor: "#eee"', 'backgroundColor: Theme.colors.inputBg')
content = content.replace('borderColor: "#eee"', 'borderColor: Theme.colors.border')
content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')
content = content.replace('backgroundColor: "#E2D8CD"', 'backgroundColor: Theme.colors.border')

with open("app/tracking-tech.tsx", "w") as f:
    f.write(content)

