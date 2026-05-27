import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function TestCompetency() {
    const router = useRouter();
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const questions = [
        {
            category: "KESELAMATAN KERJA",
            question: "Apa langkah pertama yang wajib dilakukan sebelum mulai memperbaiki unit AC yang mati total?",
            options: [
                "Bongkar kompresor dan cek oli",
                "Isi ulang freon sampai penuh",
                "Periksa tegangan dan arus listrik utama"
            ]
        }
    ];

    const currentQuestion = questions[0];

    const handleSubmit = () => {
        if (selectedAnswer !== null) {
            // Once test is completed, we navigate to login or success page
            console.log("Test submitted with answer index:", selectedAnswer);
            router.push("/registration-status" as any);
        }
    };

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tes Kompetensi Dasar</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        Selesaikan 10 pertanyaan untuk memverifikasi keahlian Anda. Pastikan Anda memilih jawaban yang paling tepat.
                    </Text>
                </View>

                {/* Progress Header */}
                <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Pertanyaan 1 dari 10</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarFill} />
                    </View>
                </View>

                {/* Question Card */}
                <View style={styles.questionCard}>
                    <Text style={styles.categoryText}>{currentQuestion.category}</Text>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        isSelected && styles.optionButtonSelected
                                    ]}
                                    onPress={() => setSelectedAnswer(index)}
                                    activeOpacity={0.7}
                                >
                                    {/* Radio Icon */}
                                    <View style={[
                                        styles.radioCircle,
                                        isSelected && styles.radioCircleSelected
                                    ]}>
                                        {isSelected && <View style={styles.radioInnerCircle} />}
                                    </View>

                                    {/* Option Text */}
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            selectedAnswer !== null ? styles.submitButtonActive : styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={selectedAnswer === null}
                    >
                        <Text style={[
                            styles.submitButtonText,
                            selectedAnswer !== null ? styles.submitButtonTextActive : styles.submitButtonTextDisabled
                        ]}>
                            Selesaikan Tes
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F5F0", // Light yellowish/beige background
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    scrollContent: {
        padding: 20,
        alignItems: "center", 
    },
    infoCard: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 15,
        width: "100%",
        maxWidth: 600,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    infoText: {
        fontSize: 14,
        color: "#8B8175",
        lineHeight: 22,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: 600,
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333",
    },
    progressBarContainer: {
        flex: 1,
        height: 6,
        backgroundColor: "#E2DCD0",
        borderRadius: 3,
        marginLeft: 15,
    },
    progressBarFill: {
        width: "10%",
        height: "100%",
        backgroundColor: "#A89785",
        borderRadius: 3,
    },
    questionCard: {
        backgroundColor: "white",
        width: "100%",
        maxWidth: 600,
        padding: 25,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#B3A492",
        letterSpacing: 1.2,
        marginBottom: 10,
        textTransform: "uppercase",
    },
    questionText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#333",
        lineHeight: 26,
        marginBottom: 25,
    },
    optionsContainer: {
        marginBottom: 30,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderWidth: 1,
        borderColor: "#F0EFEB",
        borderRadius: 15,
        marginBottom: 12,
        backgroundColor: "white",
    },
    optionButtonSelected: {
        borderColor: "#B3875E",
        backgroundColor: "#FDFBF9",
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: "#CCC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15,
    },
    radioCircleSelected: {
        borderColor: "#B3875E",
    },
    radioInnerCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#B3875E",
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: "#555",
        fontWeight: "600",
        lineHeight: 22,
    },
    optionTextSelected: {
        color: "#333",
    },
    submitButton: {
        width: "100%",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#D0C9C0",
    },
    submitButtonActive: {
        backgroundColor: "#B3875E",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "700",
    },
    submitButtonTextDisabled: {
        color: "#8C8379",
    },
    submitButtonTextActive: {
        color: "white",
    },
});
