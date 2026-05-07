import { PhotoUploadField } from "../../../shared/media/PhotoUploadField";

interface TaskEditorAdvancedMediaSectionProps {
  currentUrl: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export function TaskEditorAdvancedMediaSection({
  currentUrl,
  onChange,
  onUpload,
}: TaskEditorAdvancedMediaSectionProps) {
  return (
    <PhotoUploadField
      currentUrl={currentUrl}
      label="Task photo"
      onChange={onChange}
      onUpload={onUpload}
    />
  );
}
