"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const SHORTCODES = [
  { key: "student_name", label: "اسم الطالب", labelEn: "Student Name" },
  { key: "course_name", label: "اسم الدورة", labelEn: "Course Name" },
  { key: "date", label: "التاريخ", labelEn: "Date" },
  { key: "grade", label: "التقدير", labelEn: "Grade" },
  { key: "certificate_no", label: "رقم الشهادة", labelEn: "Certificate No" },
  { key: "instructor_name", label: "اسم المدرب", labelEn: "Instructor Name" },
];

export const MEMBERSHIP_SHORTCODES = [
  { key: "member_name", label: "اسم العضو", labelEn: "Member Name" },
  { key: "membership_no", label: "رقم العضوية", labelEn: "Membership No" },
  { key: "package_title", label: "اسم الباقة", labelEn: "Package Title" },
  { key: "level", label: "المستوى", labelEn: "Level" },
  { key: "course_count", label: "عدد الدورات", labelEn: "Course Count" },
  { key: "duration", label: "المدة", labelEn: "Duration" },
  { key: "issued_date", label: "تاريخ الإصدار", labelEn: "Issued Date" },
  { key: "expires_date", label: "تاريخ الانتهاء", labelEn: "Expires Date" },
];

export type ShortcodeOption = { key: string; label: string; labelEn: string };

export interface OverlayField {
  id: string;
  shortcode: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface CertificateTemplateEditorProps {
  imageUrl: string
  overlayFields: OverlayField[]
  onImageChange: (url: string) => void
  onOverlayChange: (fields: OverlayField[]) => void
  onOverlayCommit?: (fields: OverlayField[]) => void
  isAr?: boolean
  shortcodes?: ShortcodeOption[]
}

const ACCEPTED_IMAGE_TYPES =
  "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp";

export default function CertificateTemplateEditor({
  imageUrl,
  overlayFields,
  onImageChange,
  onOverlayChange,
  onOverlayCommit,
  isAr = true,
  shortcodes = SHORTCODES,
}: CertificateTemplateEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    fieldX: 0,
    fieldY: 0,
  });
  const [imageAspect, setImageAspect] = useState<number>(210 / 297);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef(dragStart);
  const fieldsRef = useRef(overlayFields);
  const draggingRef = useRef<string | null>(null);
  const onOverlayChangeRef = useRef(onOverlayChange);
  const onOverlayCommitRef = useRef(onOverlayCommit);
  dragStartRef.current = dragStart;
  fieldsRef.current = overlayFields;
  onOverlayChangeRef.current = onOverlayChange;
  onOverlayCommitRef.current = onOverlayCommit;

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        setImageAspect(img.naturalWidth / img.naturalHeight);
      }
    },
    [],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/gif",
        "image/bmp",
      ];
      if (!validTypes.includes(file.type)) return;
      const reader = new FileReader();
      reader.onloadend = () => onImageChange(reader.result as string);
      reader.readAsDataURL(file);
    },
    [onImageChange],
  );

  const addField = () => {
    const newField: OverlayField = {
      id: crypto.randomUUID(),
      shortcode: shortcodes[0].key,
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#1e293b",
    };
    onOverlayChange([...overlayFields, newField]);
    setSelectedId(newField.id);
  };

  const removeField = (id: string) => {
    onOverlayChange(overlayFields.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateField = (id: string, updates: Partial<OverlayField>) => {
    onOverlayChange(
      overlayFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const field = overlayFields.find((f) => f.id === id);
    if (!field) return;
    setSelectedId(id);
    setDragging(id);
    draggingRef.current = id;
    const start = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };
    setDragStart(start);
    dragStartRef.current = start;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dragId = draggingRef.current;
    if (!dragId) return;
    const start = dragStartRef.current;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - start.x) / rect.width) * 100;
    const dy = ((e.clientY - start.y) / rect.height) * 100;
    const next = fieldsRef.current.map((f) =>
      f.id === dragId
        ? {
            ...f,
            x: Math.max(0, Math.min(100, start.fieldX + dx)),
            y: Math.max(0, Math.min(100, start.fieldY + dy)),
          }
        : f,
    );
    fieldsRef.current = next;
    onOverlayChangeRef.current(next);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) {
      onOverlayChangeRef.current(fieldsRef.current);
      onOverlayCommitRef.current?.(fieldsRef.current);
    }
    draggingRef.current = null;
    setDragging(null);
  }, []);

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const selected = overlayFields.find((f) => f.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800">
          {isAr ? "صورة الشهادة" : "Certificate Image"}
        </label>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={handleFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                {isAr ? "رفع صورة" : "Upload"}
              </span>
            </Button>
          </label>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 rounded-xl bg-primary"
            onClick={addField}
          >
            <Plus className="w-4 h-4" />
            {isAr ? "إضافة حقل" : "Add Field"}
          </Button>
        </div>
      </div>

      {!imageUrl ? (
        <div
          onClick={() =>
            document
              .querySelector<HTMLInputElement>('input[type="file"]')
              ?.click()
          }
          className="flex flex-col items-center justify-center gap-3 p-12 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Upload className="w-12 h-12 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            {isAr
              ? "اضغط لرفع صورة الشهادة (PNG, JPG, WEBP, GIF)"
              : "Click to upload certificate image"}
          </p>
        </div>
      ) : (
        <div className="flex gap-4 flex-col lg:flex-row">
          <div
            ref={containerRef}
            className="relative flex-1 max-h-[500px] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100"
            style={{ aspectRatio: imageAspect }}
          >
            <img
              src={imageUrl}
              alt="Certificate"
              onLoad={onImageLoad}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {overlayFields.map((f) => {
              const label =
                shortcodes.find((s) => s.key === f.shortcode)?.label ??
                f.shortcode;
              const isSelected = selectedId === f.id;
              return (
                <div
                  key={f.id}
                  onMouseDown={(e) => handleMouseDown(e, f.id)}
                  className={cn(
                    "absolute cursor-move select-none flex items-center gap-1 px-2 py-1 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-slate-300",
                  )}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    fontSize: f.fontSize,
                    color: f.color,
                    fontFamily: "inherit",
                  }}
                >
                  <GripVertical className="w-4 h-4 opacity-50 shrink-0" />
                  <span>{`{${f.shortcode}}`}</span>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="w-full lg:w-72 shrink-0 p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
              <p className="text-sm font-semibold text-slate-800">
                {isAr ? "تعديل الحقل" : "Edit Field"}
              </p>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {isAr ? "البيانات" : "Data"}
                </label>
                <select
                  value={selected.shortcode}
                  onChange={(e) =>
                    updateField(selected.id, { shortcode: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                >
                  {shortcodes.map((s) => (
                    <option key={s.key} value={s.key}>
                      {isAr ? s.label : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {isAr ? "حجم الخط" : "Font Size"}
                </label>
                <input
                  type="range"
                  min={12}
                  max={72}
                  value={selected.fontSize}
                  onChange={(e) =>
                    updateField(selected.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-xs text-slate-500">
                  {selected.fontSize}px
                </span>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {isAr ? "اللون" : "Color"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) =>
                      updateField(selected.id, { color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={selected.color}
                    onChange={(e) =>
                      updateField(selected.id, { color: e.target.value })
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
                onClick={() => removeField(selected.id)}
              >
                <Trash2 className="w-4 h-4" />
                {isAr ? "حذف الحقل" : "Remove Field"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
