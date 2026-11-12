"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Award, BookmarkCheck, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { Controller, useFieldArray } from "react-hook-form";
import { CvDatePicker } from "@/components/cv/CvDatePicker";
import type { CvFormSectionProps } from "@/components/cv/editor/CvCoreSectionForms";
import { SortableItemCard } from "@/components/cv/editor/SortableWrappers";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClientItemId } from "@/lib/cv-format";
import type { ICvProfilePrefillSeed } from "@/types/cv";
import { extractYearFromText } from "@/validations/cv";

function useItemSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

export function SkillsSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
  profileSeed,
  locale,
}: CvFormSectionProps & { profileSeed: ICvProfilePrefillSeed | null }) {
  const sensors = useItemSensors();
  const [newSkillText, setNewSkillText] = useState<Record<string, string>>({});
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "skills",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  };

  const handleSyncFromProfile = () => {
    if (!profileSeed) return;
    const currentGroups = watch("skills") || [];
    const nextGroups = currentGroups.map((g) => ({
      ...g,
      items: [...g.items],
    }));

    const mergeGroup = (targetName: string, incoming: string[]) => {
      if (incoming.length === 0) return;
      let grp = nextGroups.find(
        (g) => g.groupName.trim().toLowerCase() === targetName.toLowerCase()
      );
      if (!grp) {
        grp = {
          id: createClientItemId("skg"),
          groupName: targetName,
          items: [],
        };
        nextGroups.push(grp);
      }
      const existingSet = new Set(
        grp.items.map((i) => i.name.trim().toLowerCase())
      );
      for (const s of incoming) {
        if (!existingSet.has(s.toLowerCase())) {
          existingSet.add(s.toLowerCase());
          grp.items.push({ id: createClientItemId("sk"), name: s });
        }
      }
    };

    mergeGroup(
      locale === "en" ? "Technical & Hard Skills" : "Kỹ năng chuyên môn",
      profileSeed.hardSkills
    );
    mergeGroup(
      locale === "en" ? "Soft Skills" : "Kỹ năng mềm",
      profileSeed.softSkills
    );
    mergeGroup(
      locale === "en" ? "Additional Skills" : "Kỹ năng khác",
      profileSeed.extraSkills
    );

    setValue("skills", nextGroups, { shouldValidate: true });
  };

  return (
    <div className="space-y-2.5">
      {profileSeed &&
        profileSeed.hardSkills.length +
          profileSeed.softSkills.length +
          profileSeed.extraSkills.length >
          0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-blue-50/70 border border-blue-200/70 px-3 py-2">
            <span className="text-[11px] text-blue-800">
              Hồ sơ của bạn có{" "}
              <strong>
                {profileSeed.hardSkills.length} chuyên môn ·{" "}
                {profileSeed.softSkills.length} kỹ năng mềm
                {profileSeed.extraSkills.length > 0
                  ? ` · ${profileSeed.extraSkills.length} kỹ năng khác`
                  : ""}
              </strong>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSyncFromProfile}
              className="h-7 px-2.5 text-[11px] bg-white gap-1 shrink-0"
            >
              <RefreshCw className="h-3 w-3 text-blue-600" />
              <span>Đồng bộ hồ sơ</span>
            </Button>
          </div>
        )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => {
              const group = watch(`skills.${index}`);
              const groupErr = errors.skills?.[index];
              const inputVal = newSkillText[field.id] || "";

              const addSkillTag = () => {
                const trimmed = inputVal.trim();
                if (!trimmed) return;
                const current = group?.items || [];
                if (
                  current.some(
                    (it) => it.name.toLowerCase() === trimmed.toLowerCase()
                  )
                ) {
                  setNewSkillText((prev) => ({ ...prev, [field.id]: "" }));
                  return;
                }
                setValue(
                  `skills.${index}.items`,
                  [...current, { id: createClientItemId("sk"), name: trimmed }],
                  { shouldValidate: true }
                );
                setNewSkillText((prev) => ({ ...prev, [field.id]: "" }));
              };

              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={group?.groupName || `Nhóm kỹ năng #${index + 1}`}
                  summarySubtitle={`${group?.items?.length || 0} kỹ năng`}
                  onRemove={() => remove(index)}
                >
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tên nhóm kỹ năng *
                      </label>
                      <Input
                        {...register(`skills.${index}.groupName`)}
                        placeholder="VD: Kỹ năng chuyên môn / Kỹ năng mềm"
                        className="h-8 text-xs"
                      />
                      {groupErr?.groupName?.message && (
                        <p className="text-[11px] text-rose-600">
                          {groupErr.groupName.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(group?.items || []).map((item, skIdx) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs text-slate-800"
                        >
                          <span>{item.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = (group?.items || []).filter(
                                (_, i) => i !== skIdx
                              );
                              setValue(`skills.${index}.items`, next, {
                                shouldValidate: true,
                              });
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <Input
                        value={inputVal}
                        onChange={(e) =>
                          setNewSkillText((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkillTag();
                          }
                        }}
                        placeholder="Nhập kỹ năng rồi nhấn Enter..."
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSkillTag}
                        className="h-8 text-xs px-3"
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>
                </SortableItemCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: createClientItemId("skg"),
            groupName: "Nhóm kỹ năng mới",
            items: [],
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Nhóm kỹ năng</span>
      </Button>
    </div>
  );
}

export function AchievementsSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
  profileSeed,
}: CvFormSectionProps & { profileSeed: ICvProfilePrefillSeed | null }) {
  const sensors = useItemSensors();
  const currentYear = new Date().getFullYear();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "achievements",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  };

  const handleImportAchievements = () => {
    if (!profileSeed || profileSeed.achievements.length === 0) return;
    const current = watch("achievements") || [];
    const existingSet = new Set(
      current.map((item) => item.title.trim().toLowerCase())
    );
    const additions = profileSeed.achievements
      .filter((a) => !existingSet.has(a.title.trim().toLowerCase()))
      .map((a) => ({
        id: createClientItemId("ach"),
        title: a.title,
        year: a.suggestedYear ?? extractYearFromText(a.title),
        issuer: "",
        description: "",
      }));

    if (additions.length > 0) {
      setValue("achievements", [...current, ...additions], {
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-2.5">
      {profileSeed && profileSeed.achievements.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50/70 border border-amber-200/80 px-3 py-2">
          <span className="text-[11px] text-amber-900 inline-flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              Bảng thành tích UNERA có{" "}
              <strong>{profileSeed.achievements.length} thành tích</strong>
            </span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleImportAchievements}
            className="h-7 px-2.5 text-[11px] bg-white gap-1 shrink-0"
          >
            <RefreshCw className="h-3 w-3 text-amber-600" />
            <span>Nhập vào CV</span>
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => {
              const item = watch(`achievements.${index}`);
              const itemErr = errors.achievements?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.title || `Thành tích #${index + 1}`}
                  summarySubtitle={item?.year ? `Năm ${item.year}` : undefined}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tên thành tích / Giải thưởng / Học bổng *
                      </label>
                      <Input
                        {...register(`achievements.${index}.title`)}
                        placeholder="VD: Giải Nhì NCKH Sinh viên cấp Trường"
                        className="h-8 text-xs"
                      />
                      {itemErr?.title?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.title.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Năm đạt được
                      </label>
                      <Controller
                        control={control}
                        name={`achievements.${index}.year`}
                        render={({ field: f }) => (
                          <Input
                            type="number"
                            min={1980}
                            max={currentYear + 1}
                            placeholder="VD: 2025"
                            value={f.value ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              if (!raw) {
                                f.onChange(null);
                                return;
                              }
                              const num = Number(raw);
                              f.onChange(Number.isNaN(num) ? null : num);
                            }}
                            className="h-8 text-xs"
                          />
                        )}
                      />
                      {itemErr?.year?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.year.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Đơn vị trao giải / Tổ chức (tùy chọn)
                      </label>
                      <Input
                        {...register(`achievements.${index}.issuer`)}
                        placeholder="VD: ĐH Ngoại ngữ - ĐHQGHN"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Mô tả thêm (tùy chọn)
                      </label>
                      <textarea
                        {...register(`achievements.${index}.description`)}
                        rows={2}
                        placeholder="Ghi chú thêm thành tích, phạm vi hoặc đóng góp nổi bật..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </SortableItemCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: createClientItemId("ach"),
            title: "",
            year: currentYear,
            issuer: "",
            description: "",
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Thành tích &amp; Giải thưởng</span>
      </Button>
    </div>
  );
}

interface FollowedActivityLite {
  _id: string;
  title: string;
  organizer?: string;
  eventDate?: string | null;
  shortDescription?: string;
}

export function ActivitiesSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [followedItems, setFollowedItems] = useState<FollowedActivityLite[]>([]);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "activities",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  };

  const openFollowedPicker = async () => {
    setPickerOpen(true);
    setLoadingFollowed(true);
    try {
      const res = await fetchWithAuth("/api/activities?tab=followed&limit=20", {
        cache: "no-store",
      });
      const data = await res.json();
      setFollowedItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFollowedItems([]);
    } finally {
      setLoadingFollowed(false);
    }
  };

  const insertFollowedActivity = (act: FollowedActivityLite) => {
    const startMonth = act.eventDate
      ? String(act.eventDate).slice(0, 7)
      : null;
    append({
      id: createClientItemId("act"),
      name: act.title,
      organization: act.organizer || "",
      role: "Thành viên / Thí sinh",
      startDate: /^\d{4}-\d{2}$/.test(startMonth || "") ? startMonth : null,
      endDate: null,
      isCurrent: false,
      description: act.shortDescription || "",
    });
    setPickerOpen(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFollowedPicker}
          className="h-7 px-2.5 text-[11px] gap-1.5 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-50"
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
          <span>Chọn từ Hoạt động đã quan tâm</span>
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => {
              const item = watch(`activities.${index}`);
              const itemErr = errors.activities?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.name || `Hoạt động #${index + 1}`}
                  summarySubtitle={item?.organization}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tên CLB / Hoạt động ngoại khóa *
                      </label>
                      <Input
                        {...register(`activities.${index}.name`)}
                        placeholder="VD: CLB Truyền thông ULIS"
                        className="h-8 text-xs"
                      />
                      {itemErr?.name?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Vai trò
                      </label>
                      <Input
                        {...register(`activities.${index}.role`)}
                        placeholder="Trưởng ban / Tình nguyện viên"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Đơn vị tổ chức
                      </label>
                      <Input
                        {...register(`activities.${index}.organization`)}
                        placeholder="Đoàn Thanh niên..."
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bắt đầu
                      </label>
                      <Controller
                        control={control}
                        name={`activities.${index}.startDate`}
                        render={({ field: f }) => (
                          <CvDatePicker
                            value={f.value}
                            onChange={f.onChange}
                            error={itemErr?.startDate?.message}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Kết thúc
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(item?.isCurrent)}
                            onChange={(e) => {
                              setValue(`activities.${index}.isCurrent`, e.target.checked, {
                                shouldValidate: true,
                              });
                              if (e.target.checked) {
                                setValue(`activities.${index}.endDate`, null, {
                                  shouldValidate: true,
                                });
                              }
                            }}
                            className="h-3.5 w-3.5 accent-blue-600"
                          />
                          <span>Hiện tại</span>
                        </label>
                      </div>
                      <Controller
                        control={control}
                        name={`activities.${index}.endDate`}
                        render={({ field: f }) => (
                          <CvDatePicker
                            value={f.value}
                            onChange={f.onChange}
                            disabled={Boolean(item?.isCurrent)}
                            error={itemErr?.endDate?.message}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Mô tả đóng góp
                      </label>
                      <textarea
                        {...register(`activities.${index}.description`)}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </SortableItemCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: createClientItemId("act"),
            name: "",
            organization: "",
            role: "",
            startDate: null,
            endDate: null,
            isCurrent: false,
            description: "",
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Hoạt động ngoại khóa</span>
      </Button>

      {/* Modal picker for followed student activities */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Hoạt động bạn đã quan tâm
              </h4>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {loadingFollowed ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải hoạt động...</span>
                </div>
              ) : followedItems.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Bạn chưa bấm &ldquo;Quan tâm&rdquo; hoạt động nào trong mục Hoạt động sinh viên.
                </p>
              ) : (
                followedItems.map((act) => (
                  <button
                    key={act._id}
                    type="button"
                    onClick={() => insertFollowedActivity(act)}
                    className="w-full text-left rounded-xl border border-slate-200 p-3 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-0.5"
                  >
                    <p className="text-xs font-bold text-slate-900">
                      {act.title}
                    </p>
                    {act.organizer && (
                      <p className="text-[11px] text-slate-500">
                        Đơn vị: {act.organizer}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CertificationsSectionEditor({
  control,
  register,
  watch,
  errors,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "certifications",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  };

  return (
    <div className="space-y-2.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => {
              const item = watch(`certifications.${index}`);
              const itemErr = errors.certifications?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.name || `Chứng chỉ #${index + 1}`}
                  summarySubtitle={item?.scoreOrLevel}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tên chứng chỉ / Ngoại ngữ *
                      </label>
                      <Input
                        {...register(`certifications.${index}.name`)}
                        placeholder="VD: IELTS Academic / MOS Excel"
                        className="h-8 text-xs"
                      />
                      {itemErr?.name?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Điểm / Cấp độ
                      </label>
                      <Input
                        {...register(`certifications.${index}.scoreOrLevel`)}
                        placeholder="VD: 7.5 / HSK 5"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Đơn vị cấp
                      </label>
                      <Input
                        {...register(`certifications.${index}.issuer`)}
                        placeholder="British Council / Microsoft"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Ngày cấp
                      </label>
                      <Controller
                        control={control}
                        name={`certifications.${index}.issueDate`}
                        render={({ field: f }) => (
                          <CvDatePicker
                            value={f.value}
                            onChange={f.onChange}
                            error={itemErr?.issueDate?.message}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Link xác thực chứng chỉ
                      </label>
                      <Input
                        {...register(`certifications.${index}.credentialUrl`)}
                        placeholder="https://..."
                        className="h-8 text-xs"
                      />
                      {itemErr?.credentialUrl?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.credentialUrl.message}
                        </p>
                      )}
                    </div>
                  </div>
                </SortableItemCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: createClientItemId("cert"),
            name: "",
            issuer: "",
            issueDate: null,
            credentialUrl: "",
            scoreOrLevel: "",
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Chứng chỉ / Ngoại ngữ</span>
      </Button>
    </div>
  );
}

export function CustomSectionsEditor({
  control,
  register,
  watch,
  setValue,
  errors,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "customSections",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  };

  return (
    <div className="space-y-2.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, secIndex) => {
              const section = watch(`customSections.${secIndex}`);
              const secErr = errors.customSections?.[secIndex];
              const subItems = section?.items || [];

              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={section?.sectionTitle || `Mục tùy chỉnh #${secIndex + 1}`}
                  summarySubtitle={`${subItems.length} dòng`}
                  onRemove={() => remove(secIndex)}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tiêu đề mục (VD: Công bố khoa học, Người tham chiếu...) *
                      </label>
                      <Input
                        {...register(`customSections.${secIndex}.sectionTitle`)}
                        className="h-8 text-xs"
                      />
                      {secErr?.sectionTitle?.message && (
                        <p className="text-[11px] text-rose-600">
                          {secErr.sectionTitle.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      {subItems.map((sub, itemIdx) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-slate-200 p-2.5 space-y-2 bg-slate-50/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              {...register(
                                `customSections.${secIndex}.items.${itemIdx}.title`
                              )}
                              placeholder="Tiêu đề mục con *"
                              className="h-8 text-xs flex-1 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = subItems.filter((_, i) => i !== itemIdx);
                                setValue(`customSections.${secIndex}.items`, next, {
                                  shouldValidate: true,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              {...register(
                                `customSections.${secIndex}.items.${itemIdx}.subtitle`
                              )}
                              placeholder="Phụ đề / Tổ chức"
                              className="h-8 text-xs bg-white"
                            />
                            <Input
                              {...register(
                                `customSections.${secIndex}.items.${itemIdx}.dateText`
                              )}
                              placeholder="Mốc thời gian (tùy chọn)"
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                          <textarea
                            {...register(
                              `customSections.${secIndex}.items.${itemIdx}.description`
                            )}
                            rows={2}
                            placeholder="Mô tả chi tiết..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setValue(
                            `customSections.${secIndex}.items`,
                            [
                              ...subItems,
                              {
                                id: createClientItemId("citem"),
                                title: "",
                                subtitle: "",
                                dateText: "",
                                description: "",
                              },
                            ],
                            { shouldValidate: true }
                          )
                        }
                        className="h-7 text-[11px] gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Thêm nội dung trong mục này</span>
                      </Button>
                    </div>
                  </div>
                </SortableItemCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: createClientItemId("csec"),
            sectionTitle: "Người tham chiếu",
            items: [
              {
                id: createClientItemId("citem"),
                title: "",
                subtitle: "",
                dateText: "",
                description: "",
              },
            ],
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Mục tùy chỉnh</span>
      </Button>
    </div>
  );
}

