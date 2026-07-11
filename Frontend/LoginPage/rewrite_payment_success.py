import re

with open("app/payment-success.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton
content = content.replace('import { doc, updateDoc } from "firebase/firestore";',
'''import { doc, updateDoc } from "firebase/firestore";
import { Theme } from "../constants/Theme";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Apply Theme colors to styles
content = content.replace('backgroundColor: "#F6F2EA"', 'backgroundColor: Theme.colors.background')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#999"', 'color: Theme.colors.textMuted')
content = content.replace('backgroundColor: "#8B5E3C"', 'backgroundColor: Theme.colors.primary')

# Replace button
button_code = """                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.replace({
                            pathname: "/waiting" as any,
                            params: { orderId }
                        })}
                    >
                        <Text style={{ color: "#fff" }}>Lanjut</Text>
                    </TouchableOpacity>"""
new_button = """                    <AnimatedButton
                        title="Lanjut"
                        onPress={() => router.replace({
                            pathname: "/waiting" as any,
                            params: { orderId }
                        })}
                        style={{ marginTop: 25, width: "70%" }}
                    />"""
content = content.replace(button_code, new_button)


# Typography
content = content.replace('fontWeight: "600",\n        fontSize: 16', '...Theme.typography.subtitle')


with open("app/payment-success.tsx", "w") as f:
    f.write(content)

