import { ResourceRecordPreview } from "./ResourceRecordPreview";

export function ResourceRecordCell({
  archived,
  label,
  name,
  photoUrl,
  subtitle,
}: {
  archived?: boolean;
  label: string;
  name: string;
  photoUrl?: string;
  subtitle: string;
}) {
  return (
    <span
      className="queue-title table-cell table-cell-primary resource-list-primary-cell"
      data-label={label}
    >
      <ResourceRecordPreview
        archived={archived}
        name={name}
        photoUrl={photoUrl}
        subtitle={subtitle}
      />
    </span>
  );
}
