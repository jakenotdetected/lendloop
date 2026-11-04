"use client";

import { useMutation } from "convex/react";
import { ImagePlus, LoaderCircle, RefreshCw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORIES,
  CONDITIONS,
  LIMITS,
  PHOTO_TYPES,
  type Category,
  type Condition,
} from "@/convex/lib/validators";
import { errorMessage } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { ConditionIcon } from "./ConditionIcon";
import { Select } from "./Select";

const CONDITION_HINTS: Record<Condition, string> = {
  new: "Barely used, no marks",
  good: "Works well, light wear",
  fair: "Works fine, visible wear",
  worn: "Still works, shows its age",
};

export type ToolFields = {
  name: string;
  category: Category;
  condition: Condition;
  description: string;
};

export type ToolSubmission = ToolFields & { photoId?: Id<"_storage"> | null };

const empty: ToolFields = { name: "", category: "power-tools", condition: "good", description: "" };

export function ToolForm({
  initial = empty,
  initialPhotoUrl = null,
  submitLabel,
  submitIcon,
  onSubmit,
  onCancel,
}: {
  initial?: ToolFields;
  initialPhotoUrl?: string | null;
  submitLabel: string;
  submitIcon?: ReactNode;
  onSubmit: (fields: ToolSubmission) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const generateUploadUrl = useMutation(api.tools.generatePhotoUploadUrl);
  const fileInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<ToolFields>({
    name: initial.name,
    category: initial.category,
    condition: initial.condition,
    description: initial.description,
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"uploading" | "saving" | null>(null);
  const preview = filePreview ?? (photoRemoved ? null : initialPhotoUrl);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(picked: File | undefined) {
    if (!picked) return;
    if (!PHOTO_TYPES.includes(picked.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (picked.size > LIMITS.photoBytes) {
      setError("That photo is over 5 MB. Choose a smaller one.");
      return;
    }
    setError(null);
    setFile(picked);
  }

  function removePhoto() {
    setFile(null);
    setPhotoRemoved(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  async function uploadPhoto(photo: File) {
    const url = await generateUploadUrl();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": photo.type },
      body: photo,
    });
    if (!response.ok) throw new Error("The photo didn't upload. Try again.");
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      let photoId: Id<"_storage"> | null | undefined;
      if (file) {
        setBusy("uploading");
        photoId = await uploadPhoto(file);
      } else if (photoRemoved) {
        photoId = null;
      }
      setBusy("saving");
      await onSubmit({ ...fields, photoId });
      if (!onCancel) {
        setFields(empty);
        setFile(null);
        setPhotoRemoved(false);
        if (fileInput.current) fileInput.current.value = "";
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          required
          maxLength={LIMITS.name}
          value={fields.name}
          onChange={(e) => setFields({ ...fields, name: e.target.value })}
          placeholder="Cordless drill"
        />
      </label>
      <div className="photo-field">
        <span className="select-label">
          Photo <span className="photo-optional">optional</span>
        </span>
        <input
          ref={fileInput}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          aria-label="Choose a photo"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {preview ? (
          <div className="photo-preview">
            <div className="tool-photo">
              <Image src={preview} alt="Chosen photo" fill sizes="460px" unoptimized />
            </div>
            <div className="photo-actions">
              <button type="button" className="button button-small button-ghost" onClick={() => fileInput.current?.click()}>
                <RefreshCw size={16} aria-hidden />
                Change
              </button>
              <button type="button" className="button button-small button-ghost" onClick={removePhoto}>
                <Trash2 size={16} aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={`photo-drop ${dragging ? "is-dragging" : ""}`}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="photo-drop-icon">
              <ImagePlus size={24} aria-hidden />
            </span>
            <span className="photo-drop-title">Add a photo</span>
            <span className="photo-drop-hint">Drop it here or click to choose. JPG, PNG or WebP, up to 5 MB.</span>
          </button>
        )}
      </div>
      <div className="form-row">
        <Select
          label="Category"
          value={fields.category}
          options={CATEGORIES.map((c) => ({ ...c, icon: <CategoryIcon category={c.value} /> }))}
          onChange={(category) => setFields({ ...fields, category })}
        />
        <Select
          label="Condition"
          value={fields.condition}
          options={CONDITIONS.map((c) => ({
            ...c,
            hint: CONDITION_HINTS[c.value],
            icon: <ConditionIcon condition={c.value} />,
          }))}
          onChange={(condition) => setFields({ ...fields, condition })}
        />
      </div>
      <label>
        Short description
        <textarea
          rows={3}
          maxLength={LIMITS.description}
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
          placeholder="Comes with two batteries and a set of bits."
        />
      </label>
      {error && <p className="notice notice-error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            <X size={18} aria-hidden />
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`button button-ink ${onCancel ? "" : "button-large button-block"}`}
          disabled={busy !== null}
        >
          {busy ? <LoaderCircle size={18} className="spin" aria-hidden /> : submitIcon}
          {busy === "uploading" ? "Uploading photo…" : busy === "saving" ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
