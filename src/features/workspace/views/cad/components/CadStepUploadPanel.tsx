import type { ChangeEvent, FormEvent } from "react";

export function CadStepUploadPanel({
  fileName,
  isUploading,
  label,
  onFileChange,
  onLabelChange,
  onSubmit,
}: {
  fileName: string;
  isUploading: boolean;
  label: string;
  onFileChange: (file: File | null) => void;
  onLabelChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0] ?? null);
  };

  return (
    <section className="cad-card cad-step-upload-card">
      <div className="cad-section-heading">
        <span className="cad-eyebrow">STEP upload</span>
        <h3>Detect CAD structure</h3>
        <p>
          Export from the master assembly, preserve assembly hierarchy, avoid flattened STEP, and use meaningful
          assembly and part names.
        </p>
      </div>
      <form className="cad-step-upload-form" onSubmit={onSubmit}>
        <label className="cad-field">
          <span>Snapshot label</span>
          <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Robot iteration 3" />
        </label>
        <label className="cad-field">
          <span>STEP file</span>
          <input accept=".step,.stp" onChange={handleFileChange} type="file" />
        </label>
        <div className="cad-step-guidance">
          <strong>Naming conventions</strong>
          <span>SUB - Drivetrain</span>
          <span>MECH - Drivetrain - Swerve Module</span>
          <span>ASM - Intake</span>
          <span>PRT - Drivetrain - Bearing Block</span>
        </div>
        <button className="primary-button" disabled={!fileName || isUploading} type="submit">
          {isUploading ? "Uploading STEP..." : "Upload STEP"}
        </button>
      </form>
    </section>
  );
}
