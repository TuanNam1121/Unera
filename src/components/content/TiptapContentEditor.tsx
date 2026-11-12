"use client";

import { useEffect, useRef, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  FileCode2,
  FolderOpen,
  Heading2,
  Heading3,
  Heading4,
  Headphones,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MessageSquareQuote,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  X,
  PlaySquare,
} from "lucide-react";
import { AudioBlockExtension } from "@/components/content/extensions/AudioBlockExtension";
import { CalloutBlockExtension } from "@/components/content/extensions/CalloutBlockExtension";
import { ImageBlockExtension } from "@/components/content/extensions/ImageBlockExtension";
import { YouTubeEmbedExtension } from "@/components/content/extensions/YouTubeEmbedExtension";
import { MediaLibraryModal } from "@/components/content/MediaLibraryModal";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentModule } from "@/constants";
import {
  extractYouTubeVideoId,
  isAllowedAudioUrl,
  isSafeWebUrl,
} from "@/lib/content/media-validation";
import {
  estimateReadTimeFromTiptap,
  extractPlainTextFromTiptap,
} from "@/lib/content/tiptap-utils";
import type { IMediaAssetDTO, TiptapJSONDoc } from "@/types";

interface TiptapContentEditorProps {
  value: TiptapJSONDoc;
  onChange: (doc: TiptapJSONDoc) => void;
  module: ContentModule;
  placeholder?: string;
}

type ActiveDialog = "none" | "link" | "audio" | "youtube" | "callout";

function ToolbarBtn({
  active = false,
  disabled = false,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-blue-600 text-white shadow-xs"
          : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

export function TiptapContentEditor({
  value,
  onChange,
  module,
  placeholder = "Bắt đầu soạn thảo bài viết giàu nội dung với Tiptap...",
}: TiptapContentEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>("none");
  const [uploadingKind, setUploadingKind] = useState<"IMAGE" | "AUDIO" | null>(
    null
  );
  const [statusError, setStatusError] = useState<string | null>(null);

  // Sub-dialog inputs
  const [linkUrl, setLinkUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [calloutTitle, setCalloutTitle] = useState("");
  const [calloutVariant, setCalloutVariant] = useState<
    "info" | "tip" | "warning"
  >("info");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const uploadFileToCloudinary = async (
    file: File,
    kind: "IMAGE" | "AUDIO"
  ): Promise<IMediaAssetDTO | null> => {
    setUploadingKind(kind);
    setStatusError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      formData.append("module", module);

      const res = await fetchWithAuth("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.asset) {
        setStatusError(
          data.error ||
            `Upload ${kind === "IMAGE" ? "ảnh" : "audio"} thất bại.`
        );
        return null;
      }

      return data.asset as IMediaAssetDTO;
    } catch {
      setStatusError("Lỗi kết nối khi upload media lên Cloudinary.");
      return null;
    } finally {
      setUploadingKind(null);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
            class: "text-blue-600 underline underline-offset-2",
          },
        },
      }),
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      TableKit.configure({
        table: { resizable: true },
      }),
      ImageBlockExtension,
      AudioBlockExtension,
      YouTubeEmbedExtension,
      CalloutBlockExtension,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor-content min-h-[420px] max-w-none px-5 py-4 text-sm sm:text-base leading-7 text-slate-800 focus:outline-none [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:text-base [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-3 [&_pre]:overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:text-left [&_th]:text-xs [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_hr]:my-5 [&_hr]:border-slate-200",
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        const imageFile = files.find((f) => f.type.startsWith("image/"));
        if (!imageFile) return false;

        event.preventDefault();
        void uploadFileToCloudinary(imageFile, "IMAGE").then((asset) => {
          if (!asset || !editor) return;
          editor
            .chain()
            .focus()
            .setImageBlock({
              src: asset.url,
              publicId: asset.publicId,
              width: asset.width,
              height: asset.height,
            })
            .run();
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find((f) => f.type.startsWith("image/"));
        if (!imageFile) return false;

        event.preventDefault();
        void uploadFileToCloudinary(imageFile, "IMAGE").then((asset) => {
          if (!asset || !editor) return;
          editor
            .chain()
            .focus()
            .setImageBlock({
              src: asset.url,
              publicId: asset.publicId,
              width: asset.width,
              height: asset.height,
            })
            .run();
        });
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(currentEditor.getJSON() as TiptapJSONDoc);
    },
  });

  const plainText = extractPlainTextFromTiptap(value);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = estimateReadTimeFromTiptap(value, plainText);

  const handleImageFilePicked = async (file: File | undefined) => {
    if (!file || !editor) return;
    const asset = await uploadFileToCloudinary(file, "IMAGE");
    if (!asset) return;
    editor
      .chain()
      .focus()
      .setImageBlock({
        src: asset.url,
        publicId: asset.publicId,
        width: asset.width,
        height: asset.height,
      })
      .run();
  };

  const handleAudioFilePicked = async (file: File | undefined) => {
    if (!file || !editor) return;
    const asset = await uploadFileToCloudinary(file, "AUDIO");
    if (!asset) return;
    editor
      .chain()
      .focus()
      .setAudioBlock({
        src: asset.url,
        publicId: asset.publicId,
        title: audioTitle.trim() || asset.originalFilename,
        mimeType: asset.mimeType,
        durationSeconds: asset.duration,
        sourceType: "CLOUDINARY",
      })
      .run();
    setAudioTitle("");
    setAudioUrl("");
    setActiveDialog("none");
  };

  const handleInsertExternalAudio = () => {
    if (!editor) return;
    if (!isAllowedAudioUrl(audioUrl)) {
      setStatusError(
        "URL Audio phải dùng HTTPS và thuộc danh sách domain được phép (VD: res.cloudinary.com)."
      );
      return;
    }
    setStatusError(null);
    editor
      .chain()
      .focus()
      .setAudioBlock({
        src: audioUrl.trim(),
        title: audioTitle.trim() || "Audio đính kèm",
        sourceType: "EXTERNAL_ALLOWLIST",
      })
      .run();
    setAudioTitle("");
    setAudioUrl("");
    setActiveDialog("none");
  };

  const handleInsertYouTube = () => {
    if (!editor) return;
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      setStatusError(
        "Liên kết YouTube không hợp lệ. Hỗ trợ youtube.com/watch?v=..., youtu.be/..., shorts/..."
      );
      return;
    }
    setStatusError(null);
    editor
      .chain()
      .focus()
      .setYouTubeEmbed({
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: youtubeTitle.trim(),
      })
      .run();
    setYoutubeUrl("");
    setYoutubeTitle("");
    setActiveDialog("none");
  };

  const handleApplyLink = () => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      setActiveDialog("none");
      return;
    }
    if (!isSafeWebUrl(trimmed, { allowRelative: true })) {
      setStatusError("Liên kết chỉ hỗ trợ giao thức http://, https:// hoặc đường dẫn nội bộ /...");
      return;
    }
    setStatusError(null);
    editor.chain().focus().setLink({ href: trimmed }).run();
    setLinkUrl("");
    setActiveDialog("none");
  };

  const handleInsertCallout = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setCalloutBlock({
        variant: calloutVariant,
        title: calloutTitle.trim(),
      })
      .run();
    setCalloutTitle("");
    setActiveDialog("none");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleImageFilePicked(file);
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        className="hidden"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleAudioFilePicked(file);
        }}
      />

      {/* Sticky Formatting & Media Toolbar */}
      <fieldset
        disabled={!editor}
        className="m-0 flex min-w-0 flex-wrap items-center gap-1 border-0 border-b border-slate-200 bg-slate-50/90 px-3 py-2"
      >
        <ToolbarBtn
          title="Hoàn tác (Undo)"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Làm lại (Redo)"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarBtn
          title="Tiêu đề H2"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Tiêu đề H3"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Tiêu đề H4"
          active={editor?.isActive("heading", { level: 4 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 4 }).run()
          }
        >
          <Heading4 className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarBtn
          title="In đậm"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="In nghiêng"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Gạch chân"
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Gạch ngang"
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Tô sáng (Highlight)"
          active={editor?.isActive("highlight")}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code nội dòng"
          active={editor?.isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarBtn
          title="Căn trái"
          active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Căn giữa"
          active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Căn phải"
          active={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarBtn
          title="Danh sách chấm"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Danh sách đánh số"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Trích dẫn"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Khối Code"
          active={editor?.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <FileCode2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Đường phân cách"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Chèn bảng 3x3"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarBtn
          title="Chèn / sửa liên kết"
          active={activeDialog === "link" || editor?.isActive("link")}
          onClick={() => {
            const existingHref = editor?.getAttributes("link")?.href || "";
            setLinkUrl(String(existingHref));
            setActiveDialog(activeDialog === "link" ? "none" : "link");
          }}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn
          title="Upload ảnh vào Cloudinary"
          disabled={uploadingKind !== null}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploadingKind === "IMAGE" ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <span className="inline-flex items-center gap-1">
              <ImagePlus className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Ảnh</span>
            </span>
          )}
        </ToolbarBtn>

        <ToolbarBtn
          title="Chọn từ Thư viện Media Cloudinary"
          onClick={() => setMediaModalOpen(true)}
        >
          <span className="inline-flex items-center gap-1">
            <FolderOpen className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Thư viện</span>
          </span>
        </ToolbarBtn>

        <ToolbarBtn
          title="Chèn Audio (Upload MP3/WAV/M4A/OGG hoặc link cho phép)"
          active={activeDialog === "audio"}
          onClick={() =>
            setActiveDialog(activeDialog === "audio" ? "none" : "audio")
          }
        >
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Audio</span>
          </span>
        </ToolbarBtn>

        <ToolbarBtn
          title="Nhúng Video YouTube"
          active={activeDialog === "youtube"}
          onClick={() =>
            setActiveDialog(activeDialog === "youtube" ? "none" : "youtube")
          }
        >
          <span className="inline-flex items-center gap-1">
            <PlaySquare className="h-4 w-4 text-rose-600" />
            <span className="hidden sm:inline">YouTube</span>
          </span>
        </ToolbarBtn>

        <ToolbarBtn
          title="Chèn hộp Callout nổi bật"
          active={activeDialog === "callout"}
          onClick={() =>
            setActiveDialog(activeDialog === "callout" ? "none" : "callout")
          }
        >
          <span className="inline-flex items-center gap-1">
            <MessageSquareQuote className="h-4 w-4 text-amber-600" />
            <span className="hidden sm:inline">Callout</span>
          </span>
        </ToolbarBtn>
      </fieldset>

      {/* Inline Table Helper Bar when cursor is inside a table */}
      {editor?.isActive("table") && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-blue-100 bg-blue-50/60 px-3 py-1.5 text-[11px]">
          <span className="font-semibold text-blue-700 mr-1">Bảng:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="rounded bg-white px-2 py-0.5 text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            + Cột
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="rounded bg-white px-2 py-0.5 text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            - Cột
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="rounded bg-white px-2 py-0.5 text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            + Hàng
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="rounded bg-white px-2 py-0.5 text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            - Hàng
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="rounded bg-white px-2 py-0.5 text-rose-600 border border-rose-200 hover:bg-rose-50 cursor-pointer"
          >
            Xóa bảng
          </button>
        </div>
      )}

      {/* Sub-dialog Panel for Link / Audio / YouTube / Callout */}
      {activeDialog !== "none" && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {activeDialog === "link" && "Chèn liên kết URL"}
              {activeDialog === "audio" &&
                "Chèn Audio Block (Cloudinary hoặc URL allowlist)"}
              {activeDialog === "youtube" && "Nhúng Video YouTube"}
              {activeDialog === "callout" && "Chèn hộp Callout ghi chú"}
            </span>
            <button
              type="button"
              onClick={() => setActiveDialog("none")}
              className="rounded p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activeDialog === "link" && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com hoặc /explore/..."
                className="h-8 flex-1 min-w-[240px] text-xs bg-white"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={handleApplyLink}
              >
                Áp dụng
              </Button>
            </div>
          )}

          {activeDialog === "audio" && (
            <div className="space-y-2.5">
              <Input
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
                placeholder="Tiêu đề đoạn audio / podcast (tùy chọn)..."
                className="h-8 text-xs bg-white"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={uploadingKind === "AUDIO"}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                  onClick={() => audioInputRef.current?.click()}
                >
                  {uploadingKind === "AUDIO" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Headphones className="h-3.5 w-3.5" />
                  )}
                  Upload MP3 / WAV / M4A / OGG (tối đa 15MB)
                </Button>
                <span className="text-xs text-slate-400">hoặc</span>
                <Input
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../audio.mp3"
                  className="h-8 flex-1 min-w-[220px] text-xs bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleInsertExternalAudio}
                >
                  Chèn URL
                </Button>
              </div>
            </div>
          )}

          {activeDialog === "youtube" && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                className="h-8 flex-1 min-w-[240px] text-xs bg-white"
              />
              <Input
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                placeholder="Mô tả video (tùy chọn)"
                className="h-8 w-52 text-xs bg-white"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700"
                onClick={handleInsertYouTube}
              >
                Nhúng Video
              </Button>
            </div>
          )}

          {activeDialog === "callout" && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={calloutVariant}
                onChange={(e) =>
                  setCalloutVariant(
                    e.target.value as "info" | "tip" | "warning"
                  )
                }
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700"
              >
                <option value="info">Thông tin (Info)</option>
                <option value="tip">Mẹo / Gợi ý (Tip)</option>
                <option value="warning">Lưu ý quan trọng (Warning)</option>
              </select>
              <Input
                value={calloutTitle}
                onChange={(e) => setCalloutTitle(e.target.value)}
                placeholder="Tiêu đề Callout (VD: Lưu ý cho sinh viên năm 2)"
                className="h-8 flex-1 min-w-[220px] text-xs bg-white"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700"
                onClick={handleInsertCallout}
              >
                Chèn Callout
              </Button>
            </div>
          )}
        </div>
      )}

      {statusError && (
        <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
          <span>{statusError}</span>
          <button
            type="button"
            onClick={() => setStatusError(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tiptap ProseMirror Surface */}
      <EditorContent editor={editor} />

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
        <span>
          Tiptap Structured JSON • Kéo thả hoặc dán ảnh để tự động tải lên
          Cloudinary
        </span>
        <span className="font-medium text-slate-700">
          {wordCount} từ • ~{readTimeMinutes} phút đọc
        </span>
      </div>

      <MediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        module={module}
        title="Chọn Ảnh hoặc Audio từ Thư viện Cloudinary"
        onSelect={(asset) => {
          if (!editor) return;
          if (asset.mediaKind === "IMAGE") {
            editor
              .chain()
              .focus()
              .setImageBlock({
                src: asset.url,
                publicId: asset.publicId,
                width: asset.width,
                height: asset.height,
              })
              .run();
          } else {
            editor
              .chain()
              .focus()
              .setAudioBlock({
                src: asset.url,
                publicId: asset.publicId,
                title: asset.originalFilename,
                mimeType: asset.mimeType,
                durationSeconds: asset.duration,
                sourceType: "CLOUDINARY",
              })
              .run();
          }
        }}
      />
    </div>
  );
}
