import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { getCategories, createCategory, deleteCategory } from '../../../lib/db/categories';
import { getActivitiesByCategory } from '../../../lib/db/activities';
import { Category, Activity } from '../../../types';
import { ActivityCard } from '../../canvas/components/ActivityCard';
import { useActivitiesStore } from '../../../store/activitiesStore';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const ICON_OPTIONS = ['📌', '🎯', '💡', '🏋️', '🎵', '🛒', '📞', '✈️', '🎓', '🏠', '💼', '🎮', '📖', '🍳', '🌱', '💰'];
const COLOR_OPTIONS = ['#6366F1', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#0EA5E9'];

export function CategoryListScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { quickToggleComplete } = useActivitiesStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    if (user) loadCategories();
  }, [user]);

  async function loadCategories() {
    if (!user) return;
    const cats = await getCategories(user.id);
    setCategories(cats);
  }

  async function selectCategory(cat: Category) {
    if (!user) return;
    setSelectedCategory(cat);
    const acts = await getActivitiesByCategory(user.id, cat.id);
    setCategoryActivities(acts);
  }

  async function handleCreate() {
    if (!user || !newName.trim()) return;
    await createCategory(user.id, newName.trim(), newColor, newIcon);
    setShowCreateModal(false);
    setNewName('');
    await loadCategories();
  }

  async function handleDelete(catId: string) {
    await deleteCategory(catId);
    setSelectedCategory(null);
    setCategoryActivities([]);
    await loadCategories();
  }

  if (selectedCategory) {
    const planned = categoryActivities.filter(a => a.status !== 'COMPLETED');
    const completed = categoryActivities.filter(a => a.status === 'COMPLETED');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory.icon} {selectedCategory.name}</Text>
          <Text style={styles.countBadge}>{categoryActivities.length}</Text>
        </View>
        {categoryActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks in this category</Text>
          </View>
        ) : (
          <FlatList
            data={[...planned, ...completed]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ActivityCard
                activity={item}
                isNow={false}
                onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
                onQuickComplete={() => quickToggleComplete(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catCard, { borderLeftColor: item.color }]}
            onPress={() => selectCategory(item)}
          >
            <Text style={styles.catCardIcon}>{item.icon}</Text>
            <View style={styles.catCardInfo}>
              <Text style={styles.catCardName}>{item.name}</Text>
              <Text style={styles.catCardType}>{item.is_system ? 'System' : 'Custom'}</Text>
            </View>
            {!item.is_system && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteBtn}
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Create Category Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor="#475569"
              value={newName}
              onChangeText={setNewName}
              maxLength={30}
              autoFocus
            />
            <Text style={styles.modalLabel}>ICON</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconChip, newIcon === icon && styles.iconChipSelected]}
                  onPress={() => setNewIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>COLOR</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorChip, { backgroundColor: color }, newColor === color && styles.colorChipSelected]}
                  onPress={() => setNewColor(color)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !newName.trim() && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800', flex: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backText: { color: '#F1F5F9', fontSize: 22 },
  countBadge: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  addButton: {
    backgroundColor: '#6366F1', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#64748B', fontSize: 15 },
  listContent: { paddingBottom: 32, paddingTop: 8 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E293B', borderLeftWidth: 4, borderRadius: 8,
    padding: 14, marginHorizontal: 12, marginBottom: 6,
  },
  catCardIcon: { fontSize: 24 },
  catCardInfo: { flex: 1 },
  catCardName: { color: '#F1F5F9', fontSize: 16, fontWeight: '600' },
  catCardType: { color: '#475569', fontSize: 12 },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#EF4444', fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#0F172A', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, color: '#F1F5F9', fontSize: 16, minHeight: 44,
  },
  modalLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center',
  },
  iconChipSelected: { backgroundColor: '#312E81', borderWidth: 2, borderColor: '#6366F1' },
  iconText: { fontSize: 18 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: { width: 32, height: 32, borderRadius: 16 },
  colorChipSelected: { borderWidth: 3, borderColor: '#F1F5F9' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#0F172A' },
  modalCancelText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  modalSave: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#6366F1' },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
