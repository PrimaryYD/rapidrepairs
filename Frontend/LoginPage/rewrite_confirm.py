import re

with open("app/confirm-order.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton
content = content.replace('import { useState } from "react";',
'''import { useState } from "react";
import { Theme } from "../constants/Theme";
import AnimatedButton from "../components/ui/AnimatedButton";''')


# Apply Theme colors to styles
content = content.replace('backgroundColor: "#F4E2C7"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')


content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')

content = content.replace('backgroundColor: "#A67C52"', 'backgroundColor: Theme.colors.primary')

# Replace button
pay_btn_code = """            <TouchableOpacity style={styles.payButton}>
                <Text style={styles.payText}>Lanjutkan ke Pembayaran</Text>
            </TouchableOpacity>"""
new_pay_btn = """            <AnimatedButton
                title="Lanjutkan ke Pembayaran"
                onPress={() => {}}
                style={{ marginTop: 10 }}
            />"""
content = content.replace(pay_btn_code, new_pay_btn)

with open("app/confirm-order.tsx", "w") as f:
    f.write(content)

