export type CadStepPreviewDiffTone = "added" | "changed" | "removed" | "warning";

export interface CadStepPreviewDiffItem {
  id: string;
  title: string;
  detail: string;
  tone: CadStepPreviewDiffTone;
}

export interface CadStepPreviewDiffGroup {
  id: string;
  title: string;
  empty: string;
  items: CadStepPreviewDiffItem[];
}
