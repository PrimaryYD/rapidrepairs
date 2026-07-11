import re

with open("app/test-competency.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton
content = content.replace('import { Ionicons } from "@expo/vector-icons";',
'''import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Replace buttons with AnimatedButton
footer_code = """            <View style={styles.footer}>
                {!isFinished ? (
                    <TouchableOpacity
                        style={[styles.nextBtn, selectedOption === null && styles.nextBtnDisabled]}
                        disabled={selectedOption === null}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextBtnText}>Lanjutkan</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.finishContainer}>
                        <View style={styles.resultBadge}>
                            <Text style={styles.resultTitle}>Skor Anda</Text>
                            <Text style={styles.resultScore}>{score}/100</Text>
                        </View>
                        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                            <Text style={styles.finishBtnText}>Selesai & Lanjut Pendaftaran</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>"""
new_footer = """            <View style={styles.footer}>
                {!isFinished ? (
                    <AnimatedButton
                        title="Lanjutkan"
                        icon={<Ionicons name="arrow-forward" size={18} color="#FFF" />}
                        disabled={selectedOption === null}
                        onPress={handleNext}
                        style={{ width: '100%' }}
                    />
                ) : (
                    <View style={styles.finishContainer}>
                        <View style={styles.resultBadge}>
                            <Text style={styles.resultTitle}>Skor Anda</Text>
                            <Text style={styles.resultScore}>{score}/100</Text>
                        </View>
                        <AnimatedButton
                            title="Selesai & Lanjut Pendaftaran"
                            onPress={handleFinish}
                            style={{ width: '100%' }}
                        />
                    </View>
                )}
            </View>"""

content = content.replace(footer_code, new_footer)

# Apply Theme colors to styles
content = content.replace('backgroundColor: "#F6F2EA"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#FFF"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')

content = content.replace('borderBottomColor: "#EEE"', 'borderBottomColor: Theme.colors.border')
content = content.replace('borderTopColor: "#EEE"', 'borderTopColor: Theme.colors.border')
content = content.replace('backgroundColor: "#EFEBE4"', 'backgroundColor: Theme.colors.border')

content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')

content = content.replace('borderColor: "#DDD"', 'borderColor: Theme.colors.border')

# Typography
content = content.replace('fontSize: 18,\n        fontWeight: "800"', '...Theme.typography.h2')
content = content.replace('fontSize: 17,\n        fontWeight: "700"', '...Theme.typography.subtitle')
content = content.replace('fontSize: 15,\n        color: "#555",\n        fontWeight: "500"', '...Theme.typography.body,\n        color: Theme.colors.textMuted')
content = content.replace('color: "#333",\n        fontWeight: "700"', 'color: Theme.colors.text,\n        fontWeight: "700"')


with open("app/test-competency.tsx", "w") as f:
    f.write(content)

