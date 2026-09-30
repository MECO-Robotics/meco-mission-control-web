import { useState } from "react";
import { Box } from "lucide-react";
import "./resourcePhotoThumbnail.css";

export function ResourcePhotoThumbnail({ name, imageUrl, fallbackUrl }: { name: string; imageUrl?: string; fallbackUrl?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const url = [imageUrl, fallbackUrl].find((value) => value && !failed.includes(value));
  return url ? <img className="resource-photo-thumbnail" src={url} alt={`${name} preview`} loading="lazy" width={64} height={64}
    onError={() => setFailed((current) => [...current, url])} />
    : <span className="resource-photo-thumbnail resource-photo-thumbnail-empty" role="img" aria-label={`No image for ${name}`}><Box size={24} aria-hidden="true" /></span>;
}
