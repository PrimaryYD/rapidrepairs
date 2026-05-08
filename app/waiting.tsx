import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Waiting() {

    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.replace("/done");
        }, 5000); // simulasi teknisi selesai
    }, []);

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>
            <Text style={styles.title}>Perbaikan Sedang Berlangsung</Text>
            <Text style={styles.desc}>
                Teknisi sedang mengerjakan AC Anda...
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F2EA" },
    title: { fontWeight: "600" },
    desc: { fontSize: 12, color: "#666", marginTop: 5 }
});