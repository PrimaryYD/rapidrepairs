import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';

interface Item {
    id: string;
    name: string;
    regency_id?: string;
}

interface SearchableDropdownProps {
    data: Item[];
    value: string; // The display name
    onSelect: (item: Item) => void;
    placeholder: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

export default function SearchableDropdown({
    data,
    value,
    onSelect,
    placeholder,
    searchPlaceholder = "Cari...",
    disabled = false,
}: SearchableDropdownProps) {
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');

    const filteredData = useMemo(() => {
        if (!search) return data;
        const lowerSearch = search.toLowerCase();
        return data.filter((item) => item.name.toLowerCase().includes(lowerSearch));
    }, [data, search]);

    const handleSelect = (item: Item) => {
        onSelect(item);
        setVisible(false);
        setSearch('');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.inputButton, disabled && styles.disabled]}
                onPress={() => {
                    if (!disabled) {
                        setVisible(true);
                    }
                }}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <View style={styles.inputLeft}>
                    <Ionicons name="location-outline" size={20} color={Theme.colors.textMuted} />
                    <Text style={[styles.inputText, !value && styles.placeholderText]} numberOfLines={1}>
                        {value || placeholder}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setVisible(false)}
            >
                <SafeAreaView style={styles.modalSafeArea}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{placeholder}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={Theme.colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={searchPlaceholder}
                            placeholderTextColor={Theme.colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            autoCorrect={false}
                        />
                    </View>

                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id}
                        initialNumToRender={20}
                        maxToRenderPerBatch={20}
                        windowSize={10}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.listItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.listItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Tidak ditemukan.</Text>
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FAF6F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#EAE6DF',
    },
    disabled: {
        backgroundColor: '#F0EFEB',
        opacity: 0.7,
    },
    inputLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    inputText: {
        marginLeft: 12,
        fontSize: 14,
        color: Theme.colors.text,
        flex: 1,
    },
    placeholderText: {
        color: '#999',
    },
    modalSafeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.colors.text,
    },
    listItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    listItemText: {
        fontSize: 16,
        color: Theme.colors.text,
    },
    separator: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginHorizontal: 20,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Theme.colors.textMuted,
    },
});
