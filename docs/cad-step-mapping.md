# STEP CAD Mapping MVP

Mission Control treats STEP uploads as repeatable CAD iterations, not one-time imports.

## Export Guidance

- Export from the master assembly.
- Preserve assembly structure.
- Avoid flattened STEP exports.
- Use meaningful names for assemblies and parts.
- Prefer names such as `SUB - Shooter`, `MECH - Shooter - Flywheel`, `ASM - Shooter - Flywheel`, and `PRT - Shooter - Flywheel - Spacer`.

STEP files do not reliably carry every CAD identity. If an export is flattened or uses generic names, Mission Control imports what it can, creates warnings, and requires manual mapping review.

## Workflow

1. Upload a `.step` or `.stp` file.
2. The parser detects an assembly/part graph and creates a historical CAD snapshot.
3. Mission Control applies active mapping rules to propose subsystem, mechanism, and part mappings.
4. Students review every proposed, unmapped, or low-confidence item.
5. Confirmed mappings can be snapshot-only or saved as rules for future imports.
6. The next STEP upload compares against the previous snapshot and reuses active rules.

## Current Limits

- The MVP uses a parser abstraction with a placeholder local parser for smoke flows.
- A future Open CASCADE or pythonOCC worker should replace the parser adapter without changing the review UI.
- Geometry viewing, mass properties, material extraction, and shape-level diffing are not part of this MVP.
- Mission Control does not create production subsystem, mechanism, or part records automatically from STEP structure.
