import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal, SectionList,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { getCategories, createCategory, deleteCategory } from '../../../lib/db/categories';
import { getActivitiesByCategory, getUntimedTasksForDay, getSomedayTasks } from '../../../lib/db/activities';
import { Category, Activity } from '../../../types';
import { ActivityCard } from '../../canvas/components/ActivityCard';
import { TaskItem } from '../../canvas/components/TaskItem';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { colors, radii, shadows, spacing } from '../../../theme';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const ICON_OPTIONS = ['📌', '🎯', '💡', '🏋️', '🎵', '🛒', '📞', '✈️', '🎓', '🏠', '💼', '🎮', '📖', '🍳', '🌱', '💰'];
const COLOR_OPTIONS = ['#2D4A3E', '#C4795B', '#7B9E87', '#4A6B8A', '#8B6B8A', '#B8860B', '#EF4444', '#14B8A6', '#F97316', '#0EA5E9'];

type ViewMode = 'categories' | 'timeline' | 'detail';

export function CategoryListScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { quickToggleComplete } = useActivitiesStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);
  const [todayTasks, setTodayTasks] = useState<Activity[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Activity[]>([]);
  const [somedayTasks, setSomedayTasks] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    if (user) {
      loadCategories();
      loadTimelineView();
    }
  }, [user]);

  async function loadCategories() {
    if (!user) return;
    const cats = await getCategories(user.id);
    setCategories(cats);
  }

  async function loadTimelineView() {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const [t, tm, s] = await Promise.all([
      getUntimedTasksForDay(user.id, todayStr),
      getUntimedTasksForDay(user.id, tomorrowStr),
      getSomedayTasks(user.id),
    ]);
    setTodayTasks(t);
    setTomorrowTasks(tm);
    setSomedayTasks(s);
  }

  async function selectCategory(cat: Category) {
    if (!user) return;
    setSelectedCategory(cat);
    setViewMode('detail');
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
    setViewMode('categories');
    await loadCategories();
  }

  // ── Category detail view ──
  if (viewMode === 'detail' && selectedCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('categories')} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory.icon} {selectedCategory.name}</Text>
          <Text style={styles.countBadge}>{categoryActivities.length}</Text>
        </View>
        <FlatList
          data={categoryActivities}
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
          ListEmptyComponent={<Text style={styles.emptyText}>No items in this category</Text>}
        />
      </SafeAreaView>
    );
  }

  // ── Categories list view ──
  if (viewMode === 'categories') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('timeline')} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.addBtnText}>+</Text>
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
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
        {renderCreateModal()}
      </SafeAreaView>
    );
  }

  // ── Timeline view (default) — Today / Tomorrow / Someday ──
  const sections = [
    { title: 'Today', data: todayTasks.length > 0 ? todayTasks : [null as any] },
    { title: 'Tomorrow', data: tomorrowTasks.length > 0 ? tomorrowTasks : [null as any] },
    { title: 'Someday', data: somedayTasks.length > 0 ? somedayTasks : [null as any] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity style={styles.catBtn} onPress={() => setViewMode('categories')}>
          <Text style={styles.catBtnText}>🏷️ Categories</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item?.id ?? `empty-${index}`}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
              {section.data.filter((d: any) => d !== null).length}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (!item) return (
            <Text style={styles.sectionEmpty}>No tasks</Text>
          );
          return (
            <TaskItem
              task={item}
              onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
              onToggle={() => quickToggleComplete(item.id)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
      {renderCreateModal()}
    </SafeAreaView>
  );

  function renderCreateModal() {
    return (
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={colors.muted}
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
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
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
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '600', flex: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backText: { color: colors.text, fontSize: 22 },
  countBadge: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  catBtn: {
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  catBtnText: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', paddingTop: 40 },
  listContent: { paddingBottom: 32, paddingTop: 8 },
  // Section headers (timeline view)
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 8,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  sectionCount: {
    color: colors.muted, fontSize: 12, fontWeight: '600',
    backgroundColor: colors.surface2, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  sectionEmpty: { color: colors.muted, fontSize: 13, paddingHorizontal: spacing.screen, paddingVertical: 12 },
  // Category cards
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderLeftWidth: 4, borderRadius: radii.card,
    padding: 14, marginHorizontal: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  catCardIcon: { fontSize: 24 },
  catCardInfo: { flex: 1 },
  catCardName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  catCardType: { color: colors.muted, fontSize: 12 },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: colors.danger, fontSize: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: colors.bg, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 16, minHeight: 44,
  },
  modalLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  iconChipSelected: { backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: { width: 32, height: 32, borderRadius: 16 },
  colorChipSelected: { borderWidth: 3, borderColor: colors.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.button, backgroundColor: colors.bg },
  modalCancelText: { color: colors.text2, fontSize: 16, fontWeight: '600' },
  modalSave: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radii.button, backgroundColor: colors.primary },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
