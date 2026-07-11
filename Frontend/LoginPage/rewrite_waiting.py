import re

with open("app/waiting.tsx", "r") as f:
    content = f.read()

# Add imports for Theme
content = content.replace('import { Ionicons } from "@expo/vector-icons";',
'''import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";''')

# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#FFF"', 'backgroundColor: Theme.colors.surface')
content = content.replace('backgroundColor: "#fff"', 'backgroundColor: Theme.colors.surface')
content = content.replace('borderColor: "#FAF6F0"', 'borderColor: Theme.colors.background')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#666"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#ccc"', 'color: Theme.colors.textMuted')

content = content.replace('borderColor: "#F0EFEB"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#EAE6DF"', 'borderColor: Theme.colors.border')
content = content.replace('backgroundColor: "#F2EBE5"', 'backgroundColor: Theme.colors.border')


content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')

with open("app/waiting.tsx", "w") as f:
    f.write(content)

