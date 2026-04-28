import { useState, type ChangeEvent } from "react";

interface PhotoUploadFieldProps {
  accept?: string;
  currentUrl: string;
  label: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export function PhotoUploadField({
  accept = "image/*",
  currentUrl,
  label,
  onChange,
  onUpload,
}: PhotoUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isVideoUrl = (value: string) => /\.(mp4|mov|webm|m4v|ogv|avi)(\?.*)?$/i.test(value);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSelectedFileName(file.name);

    try {
      const uploadedUrl = await onUpload(file);
      onChange(uploadedUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setIsUploading(false);
      event.currentTarget.value = "";
    }
  };

  return (
    <label className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>{label}</span>
      {currentUrl ? (
        isVideoUrl(currentUrl) ? (
          <video
            aria-label={label}
            controls
            playsInline
            preload="metadata"
            src={currentUrl}
            style={{
              border: "1px solid var(--border-base)",
              borderRadius: 12,
              maxHeight: 220,
              objectFit: "cover",
              width: "100%",
            }}
          />
        ) : (
          <img
            alt={label}
            src={currentUrl}
            style={{
              border: "1px solid var(--border-base)",
              borderRadius: 12,
              maxHeight: 220,
              objectFit: "cover",
              width: "100%",
            }}
          />
        )
      ) : null}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <input
          accept={accept}
          disabled={isUploading}
          onChange={handleFileChange}
          type="file"
        />
        <button
          className="secondary-action"
          disabled={!currentUrl || isUploading}
          type="button"
          onClick={() => onChange("")}
        >
          Clear file
        </button>
        {selectedFileName ? (
          <span style={{ color: "var(--text-copy)", fontSize: "0.85rem" }}>
            {selectedFileName}
          </span>
        ) : null}
      </div>
      {isUploading ? (
        <p style={{ margin: 0, color: "var(--text-copy)" }}>Uploading...</p>
      ) : null}
      {errorMessage ? (
        <p role="alert" style={{ margin: 0, color: "var(--danger-text)" }}>
          {errorMessage}
        </p>
      ) : null}
    </label>
  );
}
