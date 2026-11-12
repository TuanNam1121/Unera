"use client";

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
import { Plus, Sparkles, X } from "lucide-react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
} from "react-hook-form";
import { CvDatePicker } from "@/components/cv/CvDatePicker";
import { SortableItemCard } from "@/components/cv/editor/SortableWrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CV_ACTION_VERB_SUGGESTIONS } from "@/constants/cv";
import { createClientItemId } from "@/lib/cv-format";
import type { CvLocale } from "@/types/cv";
import type { CvContentFormValues } from "@/validations/cv";

export interface CvFormSectionProps {
  control: Control<CvContentFormValues>;
  register: UseFormRegister<CvContentFormValues>;
  watch: UseFormWatch<CvContentFormValues>;
  setValue: UseFormSetValue<CvContentFormValues>;
  errors: FieldErrors<CvContentFormValues>;
  locale: CvLocale;
}

function useItemSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

export function PersonalInfoEditor({
  register,
  errors,
}: Pick<CvFormSectionProps, "register" | "errors">) {
  const err = errors.personalInfo;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Thông tin cá nhân (Header)
        </h3>
        <span className="text-[11px] text-slate-400">Luôn ở đầu CV</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <Input
            {...register("personalInfo.fullName")}
            placeholder="VD: Nguyễn Minh Anh"
            className="h-9 text-xs"
          />
          {err?.fullName?.message && (
            <p className="text-[11px] text-rose-600">{err.fullName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Chức danh / Vị trí mục tiêu
          </label>
          <Input
            {...register("personalInfo.jobTitle")}
            placeholder="VD: Marketing Intern"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Email liên hệ
          </label>
          <Input
            {...register("personalInfo.email")}
            placeholder="email@example.com"
            className="h-9 text-xs"
          />
          {err?.email?.message && (
            <p className="text-[11px] text-rose-600">{err.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Số điện thoại
          </label>
          <Input
            {...register("personalInfo.phone")}
            placeholder="0912 345 678"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Địa điểm
          </label>
          <Input
            {...register("personalInfo.location")}
            placeholder="Hà Nội / TP. HCM"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Năm sinh / Ngày sinh
          </label>
          <Input
            {...register("personalInfo.dateOfBirth")}
            placeholder="VD: 2005"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            LinkedIn
          </label>
          <Input
            {...register("personalInfo.linkedin")}
            placeholder="https://linkedin.com/in/..."
            className="h-9 text-xs"
          />
          {err?.linkedin?.message && (
            <p className="text-[11px] text-rose-600">{err.linkedin.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            GitHub
          </label>
          <Input
            {...register("personalInfo.github")}
            placeholder="https://github.com/..."
            className="h-9 text-xs"
          />
          {err?.github?.message && (
            <p className="text-[11px] text-rose-600">{err.github.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Portfolio / Behance
          </label>
          <Input
            {...register("personalInfo.portfolio")}
            placeholder="https://..."
            className="h-9 text-xs"
          />
          {err?.portfolio?.message && (
            <p className="text-[11px] text-rose-600">{err.portfolio.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">
            Ảnh đại diện (URL)
          </label>
          <Input
            {...register("personalInfo.avatarUrl")}
            placeholder="https://... (cho mẫu hỗ trợ ảnh)"
            className="h-9 text-xs"
          />
          {err?.avatarUrl?.message && (
            <p className="text-[11px] text-rose-600">{err.avatarUrl.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SummaryEditor({
  register,
  errors,
}: Pick<CvFormSectionProps, "register" | "errors">) {
  return (
    <div className="space-y-1.5">
      <textarea
        {...register("summary")}
        rows={4}
        placeholder="Tóm tắt ngắn gọn 2–4 câu về định hướng nghề nghiệp, thế mạnh chuyên môn và giá trị bạn mang lại cho vị trí ứng tuyển..."
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {errors.summary?.message && (
        <p className="text-[11px] text-rose-600">{errors.summary.message}</p>
      )}
    </div>
  );
}

export function EducationSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "education",
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
              const item = watch(`education.${index}`);
              const itemErr = errors.education?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.school || `Học vấn #${index + 1}`}
                  summarySubtitle={item?.major}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Trường / Cơ sở đào tạo *
                      </label>
                      <Input
                        {...register(`education.${index}.school`)}
                        placeholder="VD: Trường ĐH Ngoại ngữ - ĐHQGHN"
                        className="h-8 text-xs"
                      />
                      {itemErr?.school?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.school.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bằng cấp
                      </label>
                      <Input
                        {...register(`education.${index}.degree`)}
                        placeholder="Cử nhân / Kỹ sư"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Ngành học
                      </label>
                      <Input
                        {...register(`education.${index}.major`)}
                        placeholder="VD: Ngôn ngữ Anh"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        GPA / Xếp loại
                      </label>
                      <Input
                        {...register(`education.${index}.gpa`)}
                        placeholder="VD: 3.7/4.0"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(item?.isCurrent)}
                          onChange={(e) => {
                            setValue(`education.${index}.isCurrent`, e.target.checked, {
                              shouldValidate: true,
                            });
                            if (e.target.checked) {
                              setValue(`education.${index}.endDate`, null, {
                                shouldValidate: true,
                              });
                            }
                          }}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span>Đang theo học</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bắt đầu
                      </label>
                      <Controller
                        control={control}
                        name={`education.${index}.startDate`}
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
                      <label className="text-[11px] font-semibold text-slate-700">
                        Kết thúc (hoặc dự kiến)
                      </label>
                      <Controller
                        control={control}
                        name={`education.${index}.endDate`}
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
                        Mô tả thêm (Học bổng, môn học tiêu biểu...)
                      </label>
                      <textarea
                        {...register(`education.${index}.description`)}
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
            id: createClientItemId("edu"),
            school: "",
            degree: "Cử nhân",
            major: "",
            gpa: "",
            startDate: null,
            endDate: null,
            isCurrent: false,
            description: "",
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Học vấn</span>
      </Button>
    </div>
  );
}

function HighlightsFieldList({
  items,
  onChange,
  locale,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  locale: CvLocale;
  placeholder: string;
}) {
  const verbs = CV_ACTION_VERB_SUGGESTIONS[locale];

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="text-[11px] font-semibold text-slate-700">
          Mô tả công việc / Thành tựu (Bullet points)
        </label>
        <div className="flex flex-wrap gap-1">
          {verbs.slice(0, 3).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange([...items, v])}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium cursor-pointer"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>+{v.slice(0, 18)}…</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((line, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="mt-2 text-xs text-slate-400">•</span>
            <Input
              value={line}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="h-8 text-xs flex-1"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
      >
        <Plus className="h-3 w-3" />
        <span>Thêm gạch đầu dòng</span>
      </button>
    </div>
  );
}

export function ExperienceSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
  locale,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "experience",
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
              const item = watch(`experience.${index}`);
              const itemErr = errors.experience?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.position || `Kinh nghiệm #${index + 1}`}
                  summarySubtitle={item?.company}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Vị trí / Chức danh *
                      </label>
                      <Input
                        {...register(`experience.${index}.position`)}
                        placeholder="VD: Marketing Intern"
                        className="h-8 text-xs"
                      />
                      {itemErr?.position?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.position.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Công ty / Tổ chức *
                      </label>
                      <Input
                        {...register(`experience.${index}.company`)}
                        placeholder="VD: Unilever Vietnam"
                        className="h-8 text-xs"
                      />
                      {itemErr?.company?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.company.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Địa điểm
                      </label>
                      <Input
                        {...register(`experience.${index}.location`)}
                        placeholder="Hà Nội"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(item?.isCurrent)}
                          onChange={(e) => {
                            setValue(`experience.${index}.isCurrent`, e.target.checked, {
                              shouldValidate: true,
                            });
                            if (e.target.checked) {
                              setValue(`experience.${index}.endDate`, null, {
                                shouldValidate: true,
                              });
                            }
                          }}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span>Đang làm việc tại đây</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bắt đầu
                      </label>
                      <Controller
                        control={control}
                        name={`experience.${index}.startDate`}
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
                      <label className="text-[11px] font-semibold text-slate-700">
                        Kết thúc
                      </label>
                      <Controller
                        control={control}
                        name={`experience.${index}.endDate`}
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

                    <div className="sm:col-span-2">
                      <HighlightsFieldList
                        items={item?.highlights || []}
                        onChange={(next) =>
                          setValue(`experience.${index}.highlights`, next, {
                            shouldValidate: true,
                          })
                        }
                        locale={locale}
                        placeholder="Mô tả kết quả đạt được gắn với con số cụ thể..."
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
            id: createClientItemId("exp"),
            position: "",
            company: "",
            location: "",
            startDate: null,
            endDate: null,
            isCurrent: false,
            highlights: [""],
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Kinh nghiệm làm việc</span>
      </Button>
    </div>
  );
}

export function ProjectsSectionEditor({
  control,
  register,
  watch,
  setValue,
  errors,
  locale,
}: CvFormSectionProps) {
  const sensors = useItemSensors();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "projects",
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
              const item = watch(`projects.${index}`);
              const itemErr = errors.projects?.[index];
              return (
                <SortableItemCard
                  key={field.id}
                  id={field.id}
                  summaryTitle={item?.name || `Dự án #${index + 1}`}
                  summarySubtitle={item?.role}
                  onRemove={() => remove(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tên dự án *
                      </label>
                      <Input
                        {...register(`projects.${index}.name`)}
                        placeholder="VD: Unera Career Platform"
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
                        {...register(`projects.${index}.role`)}
                        placeholder="Team Lead / Developer"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Công nghệ / Công cụ
                      </label>
                      <Input
                        {...register(`projects.${index}.technologies`)}
                        placeholder="React, Next.js, MongoDB..."
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Liên kết dự án
                      </label>
                      <Input
                        {...register(`projects.${index}.link`)}
                        placeholder="https://github.com/..."
                        className="h-8 text-xs"
                      />
                      {itemErr?.link?.message && (
                        <p className="text-[11px] text-rose-600">
                          {itemErr.link.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bắt đầu
                      </label>
                      <Controller
                        control={control}
                        name={`projects.${index}.startDate`}
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
                              setValue(`projects.${index}.isCurrent`, e.target.checked, {
                                shouldValidate: true,
                              });
                              if (e.target.checked) {
                                setValue(`projects.${index}.endDate`, null, {
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
                        name={`projects.${index}.endDate`}
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

                    <div className="sm:col-span-2">
                      <HighlightsFieldList
                        items={item?.highlights || []}
                        onChange={(next) =>
                          setValue(`projects.${index}.highlights`, next, {
                            shouldValidate: true,
                          })
                        }
                        locale={locale}
                        placeholder="Mô tả tính năng, đóng góp và kết quả..."
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
            id: createClientItemId("proj"),
            name: "",
            role: "",
            link: "",
            technologies: "",
            startDate: null,
            endDate: null,
            isCurrent: false,
            highlights: [""],
          })
        }
        className="w-full border-dashed text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm Dự án</span>
      </Button>
    </div>
  );
}

