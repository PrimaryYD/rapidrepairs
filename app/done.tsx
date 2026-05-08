import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity
, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Done() {

    const router = useRouter();
    const [rating, setRating] = useState(0);

    const quick = ["Pelanggan Ramah", "Sesuai Titik Maps", "Responsif"];
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>

            <Text style={styles.title}>Pekerjaan Selesai!</Text>

            {/* ⭐ RATING */}
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setRating(i)}>
                        <Ionicons
                            name={i <= rating ? "star" : "star-outline"}
                            size={30}
                            color="#F4B400"
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* TAG */}
            <View style={styles.tagRow}>
                {quick.map((item, i) => {
                    const active = selectedTags.includes(item);

                    return (
                        <TouchableOpacity
                            key={i}
                            style={[styles.tag, active && styles.tagActive]}
                            onPress={() => toggleTag(item)}
                        >
                            <Text style={active && { color: "#fff" }}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* BUTTON */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/review-success")}
            >
                <Text style={{ color: "#fff" }}>Kirim Penilaian</Text>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F2EA" },
    title: { fontWeight: "600", marginBottom: 10 },

    starRow: {
        flexDirection: "row",
        marginVertical: 10
    },

    tagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center"
    },

    tag: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#eee",
        margin: 5
    },

    tagActive: {
        backgroundColor: "#8B5E3C"
    },

    button: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        marginTop: 20
    }
});