import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";

const QUESTIONS_DATA: any = {
    "AC": [
        { q: "Apa fungsi utama kompresor pada sistem AC?", options: ["Mendinginkan udara", "Memompa refrigeran ke seluruh sistem", "Menyaring debu", "Mengatur suhu ruangan"], a: 1 },
        { q: "Jenis refrigeran mana yang paling ramah lingkungan?", options: ["R22", "R12", "R32", "R134a"], a: 2 },
        { q: "Apa penyebab utama AC indoor meneteskan air?", options: ["Kurang freon", "Saluran pembuangan tersumbat", "Filter bersih", "Remote rusak"], a: 1 },
        { q: "Apa fungsi filter udara pada unit indoor?", options: ["Mendinginkan freon", "Menyaring partikel debu", "Mengatur kelembaban", "Menambah tekanan"], a: 1 },
        { q: "Berapa tekanan standar R32 pada AC 1 PK saat menyala?", options: ["60-80 PSI", "140-160 PSI", "250-300 PSI", "20-40 PSI"], a: 1 },
        { q: "Apa fungsi kapasitor pada unit outdoor AC?", options: ["Mengatur suhu", "Membantu start motor kompresor", "Mengubah AC ke DC", "Menyimpan data"], a: 1 },
        { q: "Mengapa unit outdoor AC harus diletakkan di tempat terbuka?", options: ["Biar tidak dicuri", "Untuk membuang panas kondensor", "Biar kena hujan", "Agar suara lebih keras"], a: 1 },
        { q: "Apa itu evaporator?", options: ["Tempat pembuangan air", "Bagian yang menyerap panas ruangan", "Bagian yang membuang panas", "Pompa freon"], a: 1 },
        { q: "Berapa bulan sekali sebaiknya AC dicuci rutin?", options: ["1 tahun", "3-4 bulan", "Setiap minggu", "Bila rusak saja"], a: 1 },
        { q: "Gejala apa yang muncul jika AC kekurangan freon?", options: ["Udara sangat dingin", "Pipa kecil (discharge) membeku/berbunga es", "Suara indoor hilang", "Lampu indikator mati"], a: 1 },
    ],
    "Kulkas": [
        { q: "Apa fungsi thermostat pada kulkas?", options: ["Mengatur suhu", "Mengatur lampu", "Menghemat listrik", "Pompa freon"], a: 0 },
        { q: "Mengapa bunga es bisa menumpuk tebal di freezer manual?", options: ["Pintu jarang dibuka", "Sering dibuka atau karet pintu bocor", "Kulkas terlalu dingin", "Listrik sering padam"], a: 1 },
        { q: "Apa fungsi heater pada kulkas No-Frost?", options: ["Menghangatkan makanan", "Mencairkan bunga es secara otomatis", "Mendinginkan sayur", "Menstabilkan tegangan"], a: 1 },
        { q: "Jenis gas pendingin yang umum digunakan kulkas modern?", options: ["R22", "R134a / R600a", "Oksigen", "Nitrogen"], a: 1 },
        { q: "Apa penyebab kulkas tidak dingin tapi lampu menyala?", options: ["Lampu rusak", "Kompresor tidak bekerja/macet", "Pintu tertutup rapat", "Stop kontak lepas"], a: 1 },
        { q: "Apa itu Overload Protector pada kompresor?", options: ["Pengatur suhu", "Pemutus arus jika kompresor terlalu panas", "Penambah daya", "Penyaring air"], a: 1 },
        { q: "Berapa suhu ideal untuk ruang freezer?", options: ["0°C", "10°C", "-15°C s/d -18°C", "5°C"], a: 2 },
        { q: "Di mana biasanya letak pipa kondensor pada kulkas?", options: ["Di dalam rak", "Di samping atau belakang body", "Di bawah laci sayur", "Di atas pintu"], a: 1 },
        { q: "Apa fungsi karet pintu (gasket)?", options: ["Hiasan", "Menjaga udara dingin agar tidak keluar", "Peredam getaran", "Alat pembuka"], a: 1 },
        { q: "Mengapa kulkas harus diletakkan berjarak dari dinding?", options: ["Agar mudah dibersihkan", "Untuk sirkulasi pembuangan panas", "Biar tidak lecet", "Aturan pabrik"], a: 1 },
    ],
    "Mesin Cuci": [
        { q: "Apa keunggulan utama mesin cuci Front Loading?", options: ["Harga paling murah", "Lebih hemat air dan deterjen", "Bisa nambah baju saat jalan", "Ukuran paling besar"], a: 1 },
        { q: "Apa fungsi Water Level Sensor?", options: ["Mengukur suhu air", "Mendeteksi ketinggian air", "Membuang air", "Memutar tabung"], a: 1 },
        { q: "Mengapa mesin cuci bergetar sangat kuat saat proses Spin?", options: ["Beban tidak seimbang", "Air terlalu banyak", "Pintu terbuka", "Kabel kepanjangan"], a: 0 },
        { q: "Apa penyebab air tidak mau keluar (drain) pada mesin cuci?", options: ["Kran tertutup", "Motor drain rusak atau tersumbat", "Tabung bocor", "Sabun terlalu banyak"], a: 1 },
        { q: "Apa fungsi kapasitor pada motor mesin cuci?", options: ["Mengatur waktu", "Membantu putaran awal motor", "Menyimpan air", "Mengubah tegangan"], a: 1 },
        { q: "Di mana letak Coin Trap/Filter pada mesin cuci Front Loading?", options: ["Di atas tabung", "Di bagian depan bawah", "Di dalam selang input", "Di belakang mesin"], a: 1 },
        { q: "Apa penyebab mesin cuci berbau tidak sedap?", options: ["Terlalu sering dipakai", "Sisa deterjen dan jamur di sela tabung", "Baju terlalu bersih", "Kabel terbakar"], a: 1 },
        { q: "Apa fungsi pulsator pada mesin cuci 2 tabung?", options: ["Memeras baju", "Memutar air dan pakaian", "Mengeringkan", "Memompa air"], a: 1 },
        { q: "Berapa kapasitas ideal beban pakaian?", options: ["Sampai penuh sesak", "Maksimal 80% kapasitas tabung", "Hanya 1 lembar", "Tergantung keinginan"], a: 1 },
        { q: "Apa bahaya menggunakan terlalu banyak deterjen?", options: ["Baju makin bersih", "Merusak mesin dan sensor", "Baju jadi wangi", "Listrik lebih irit"], a: 1 },
    ],
    "Kelistrikan Umum": [
        { q: "Apa fungsi utama MCB (Miniature Circuit Breaker)?", options: ["Menambah daya", "Proteksi arus lebih dan korsleting", "Menghemat listrik", "Penyambung kabel"], a: 1 },
        { q: "Warna kabel apa yang standarnya digunakan untuk Grounding (Arde)?", options: ["Hitam", "Kuning strip Hijau", "Biru", "Merah"], a: 1 },
        { q: "Apa itu korsleting (Hubung Singkat)?", options: ["Listrik padam", "Pertemuan langsung fasa dan netral", "Tegangan naik", "Kabel putus"], a: 1 },
        { q: "Alat apa yang digunakan untuk mengukur tegangan listrik?", options: ["Amperemeter", "Voltmeter / Multimeter", "Thermometer", "Barometer"], a: 1 },
        { q: "Berapa tegangan standar PLN untuk rumah tangga di Indonesia?", options: ["110V", "220V", "380V", "12V"], a: 1 },
        { q: "Apa fungsi Tespen?", options: ["Memotong kabel", "Mengecek adanya tegangan fasa", "Mengukur arus", "Mengupas kabel"], a: 1 },
        { q: "Mengapa kabel listrik bisa terasa panas saat digunakan?", options: ["Kabel terlalu tebal", "Beban berlebih (overload)", "Udara dingin", "Kabel baru"], a: 1 },
        { q: "Satuan daya listrik adalah?", options: ["Volt", "Watt", "Ampere", "Ohm"], a: 1 },
        { q: "Apa fungsi saklar?", options: ["Menambah daya", "Memutus dan menyambung arus", "Meningkatkan tegangan", "Merubah AC ke DC"], a: 1 },
        { q: "Mengapa dilarang menyentuh stop kontak dengan tangan basah?", options: ["Biar tidak licin", "Air adalah konduktor, bisa tersetrum", "Nanti airnya tumpah", "Stop kontak bisa karatan"], a: 1 },
    ],
    "Furniture": [
        { q: "Jenis kayu apa yang terkenal paling tahan terhadap rayap?", options: ["Kayu Sengon", "Kayu Jati", "MDF", "Partikel Board"], a: 1 },
        { q: "Apa fungsi proses Finishing (Plitur/Varnish)?", options: ["Menambah berat", "Melindungi kayu dan mempercantik tampilan", "Menghilangkan serat", "Membuat kayu jadi besi"], a: 1 },
        { q: "Alat apa yang paling tepat untuk memotong kayu secara lurus dan panjang?", options: ["Gergaji Tangan", "Circular Saw", "Pahat", "Palu"], a: 1 },
        { q: "Apa itu HPL (High Pressure Laminate)?", options: ["Jenis kayu solid", "Lapisan finishing plastik keras", "Alat perekat", "Jenis baut"], a: 1 },
        { q: "Cara paling efektif mengatasi engsel pintu yang berderit?", options: ["Dicat ulang", "Diberi pelumas / oli", "Diganti pintu baru", "Dibiarkan saja"], a: 1 },
        { q: "Apa fungsi Lem Kuning (Aica Aibon) pada furniture?", options: ["Menyambung kayu jati", "Merekatkan HPL ke multiplek", "Menutup lubang paku", "Mewarnai kayu"], a: 1 },
        { q: "Mengapa multiplek lebih tahan melengkung dibanding kayu solid lebar?", options: ["Lebih berat", "Terdiri dari lapisan yang bersilangan", "Harganya mahal", "Karena dicat"], a: 1 },
        { q: "Alat apa yang digunakan untuk meratakan permukaan kayu secara manual?", options: ["Bor", "Serut / Ketam", "Obeng", "Tang"], a: 1 },
        { q: "Apa fungsi Sekrup dibanding Paku pada furniture?", options: ["Hanya hiasan", "Daya ikat lebih kuat dan bisa dilepas", "Lebih murah", "Gampang dipasang"], a: 1 },
        { q: "Bagaimana cara menutup lubang bekas paku agar rapi?", options: ["Ditutup isolasi", "Diberi Wood Filler / Dempul kayu", "Dibiarkan saja", "Disiram air"], a: 1 },
    ]
};

export default function TestCompetency() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Spec selected in step 1
    const specialization = (params.specialization as string) || "AC";
    const questions = QUESTIONS_DATA[specialization] || QUESTIONS_DATA["AC"];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [answers, setAnswers] = useState<any[]>([]);

    const handleNext = () => {
        if (selectedOption === null) return;

        const currentQ = questions[currentIndex];
        const newAnswer = {
            question: currentQ.q,
            selected: currentQ.options[selectedOption],
            correct: currentQ.options[currentQ.a],
            isCorrect: selectedOption === currentQ.a
        };
        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);

        // Check answer
        if (selectedOption === currentQ.a) {
            setScore(score + 10);
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
        } else {
            setIsFinished(true);
        }
    };

    const handleFinish = () => {
        // Navigate back to registration with all data + step 2 flag
        router.replace({
            pathname: "/register-technician",
            params: {
                ...params,
                step: "2",
                testScore: score.toString(),
                testAnswersJson: JSON.stringify(answers)
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Uji Kompetensi: {specialization}</Text>
                <Text style={styles.headerSubtitle}>Pertanyaan {currentIndex + 1} dari 10</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(currentIndex + 1) * 10}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{questions[currentIndex].q}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {questions[currentIndex].options.map((opt: string, idx: number) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.optionItem,
                                selectedOption === idx && styles.optionSelected
                            ]}
                            onPress={() => setSelectedOption(idx)}
                        >
                            <View style={[
                                styles.radio,
                                selectedOption === idx && styles.radioActive
                            ]}>
                                {selectedOption === idx && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[
                                styles.optionText,
                                selectedOption === idx && styles.optionTextSelected
                            ]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
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
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        padding: 20,
        backgroundColor: Theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Theme.colors.textMuted,
        marginTop: 4,
    },
    progressContainer: {
        height: 6,
        backgroundColor: Theme.colors.border,
        width: "100%",
    },
    progressBar: {
        height: "100%",
        backgroundColor: Theme.colors.primary,
    },
    scrollContent: {
        padding: 20,
    },
    questionCard: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    questionText: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.surface,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    optionSelected: {
        borderColor: Theme.colors.primary,
        backgroundColor: "#FDFBF8",
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Theme.colors.border,
        marginRight: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    radioActive: {
        borderColor: Theme.colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.primary,
    },
    optionText: {
        fontSize: 15,
        color: Theme.colors.textMuted,
        fontWeight: "500",
        flex: 1,
    },
    optionTextSelected: {
        color: Theme.colors.text,
        fontWeight: "700",
    },
    footer: {
        padding: 20,
        backgroundColor: Theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    nextBtn: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    nextBtnDisabled: {
        backgroundColor: "#D9CFC3",
    },
    nextBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    finishContainer: {
        alignItems: "center",
    },
    resultBadge: {
        alignItems: "center",
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 14,
        color: Theme.colors.textMuted,
        fontWeight: "600",
    },
    resultScore: {
        fontSize: 36,
        fontWeight: "900",
        color: Theme.colors.primary,
    },
    finishBtn: {
        backgroundColor: Theme.colors.primary,
        width: "100%",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    finishBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
