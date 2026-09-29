import { ResourcePhotoThumbnail } from "@/features/workspace/shared/media/ResourcePhotoThumbnail";
import "./resourceRecordPreview.css";

export function ResourceRecordPreview({
  archived = false,
  name,
  photoUrl,
  subtitle,
}: {
  archived?: boolean;
  name: string;
  photoUrl?: string;
  subtitle: string;
}) {
  return (
    <span className="resource-record-preview">
      <ResourcePhotoThumbnail imageUrl={photoUrl} name={name} />
      <span className="requested-item-meta">
        <strong className="requested-item-title">{name}</strong>
        {archived ? <small className="requested-item-subtitle">Archived</small> : null}
        <small className="requested-item-subtitle" title={subtitle}>{subtitle}</small>
      </span>
    </span>
  );
}
