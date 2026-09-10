import { useState } from "react";
import { Box } from "lucide-react";
import "./partThumbnail.css";

export function PartThumbnail({ name, imageUrl, fallbackUrl }: { name: string; imageUrl?: string; fallbackUrl?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const url = [imageUrl, fallbackUrl].find((value) => value && !failed.includes(value));
  return url ? <img className="part-thumbnail" src={url} alt={`${name} part image`} loading="lazy" width={64} height={64}
    onError={() => setFailed((current) => [...current, url])} />
    : <span className="part-thumbnail part-thumbnail-empty" role="img" aria-label={`No image for ${name}`}><Box size={24} aria-hidden="true" /></span>;
}
