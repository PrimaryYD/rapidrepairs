import re

with open("app/pembayaran.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton
content = content.replace('import { db } from "./_firebaseConfig";',
'''import { db } from "./_firebaseConfig";
import { Theme } from "../constants/Theme";
import AnimatedButton from "../components/ui/AnimatedButton";''')


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#F6F2EA"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')

content = content.replace('borderColor: "#F2EBE3"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#E2D8CD"', 'borderColor: Theme.colors.border')


content = content.replace('backgroundColor: "#8B5E3C"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#8B5E3C"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#8B5E3C"', 'color: Theme.colors.primary')
content = content.replace('backgroundColor: "#C5A880"', 'backgroundColor: Theme.colors.primary')


# Replace main button with AnimatedButton
main_btn_code = """                    <TouchableOpacity
                        style={[styles.button, selected.length === 0 && { opacity: 0.5 }]}
                        disabled={selected.length === 0}
                        onPress={handleStartRepair}
                    >
                        <Text style={styles.buttonText}>Mulai Perbaikan</Text>
                    </TouchableOpacity>"""
new_main_btn = """                    <AnimatedButton
                        title="Mulai Perbaikan"
                        disabled={selected.length === 0}
                        onPress={handleStartRepair}
                        style={{ marginTop: 20 }}
                    />"""
content = content.replace(main_btn_code, new_main_btn)

# Replace understand buttons in Modals
understand_btn_code = """                        <TouchableOpacity style={styles.understandBtn} onPress={() => setShowCapacitorInfo(false)}>
                            <Text style={styles.understandBtnText}>Saya Mengerti</Text>
                        </TouchableOpacity>"""
new_understand_btn = """                        <AnimatedButton
                            title="Saya Mengerti"
                            onPress={() => setShowCapacitorInfo(false)}
                            style={{ width: '100%' }}
                        />"""
content = content.replace(understand_btn_code, new_understand_btn)

understand_btn_code2 = """                        <TouchableOpacity style={styles.understandBtn} onPress={() => setShowFreonInfo(false)}>
                            <Text style={styles.understandBtnText}>Saya Mengerti</Text>
                        </TouchableOpacity>"""
new_understand_btn2 = """                        <AnimatedButton
                            title="Saya Mengerti"
                            onPress={() => setShowFreonInfo(false)}
                            style={{ width: '100%' }}
                        />"""
content = content.replace(understand_btn_code2, new_understand_btn2)

with open("app/pembayaran.tsx", "w") as f:
    f.write(content)

