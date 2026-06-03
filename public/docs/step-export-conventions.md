# STEP Export Conventions

Use these conventions before uploading STEP files into Mission Control. Good
exports preserve enough structure for the importer to propose useful subsystem,
mechanism, assembly, and part mappings.

## Naming Rules

Use stable, descriptive names in CAD before exporting. Mission Control can read
names from the STEP assembly tree, but it cannot infer team intent from generic
or duplicated labels.

Recommended prefixes:

- `SUB - <Subsystem>` for top-level subsystem groupings.
- `MECH - <Subsystem> - <Mechanism>` for mechanism-level assemblies.
- `ASM - <Subsystem> - <Assembly>` for reusable or intermediate assemblies.
- `PRT - <Subsystem> - <Part>` for fabricated or tracked part definitions.
- `COTS - <Vendor or type> - <Part>` for purchased parts when they appear in the
  exported assembly.

Naming expectations:

- Keep the same name across repeated exports unless the object truly changed.
- Put subsystem and mechanism context in the name when the CAD hierarchy is
  shallow or shared.
- Avoid names such as `Part 1`, `Copy of bracket`, `Imported 3`, `Assembly`,
  `New folder`, or temporary student initials.
- Prefer singular part-definition names. Repeated instances should share one
  part name instead of gaining unique copy suffixes.
- Include useful side/location words only when they are part of the design
  identity, such as `Left gearbox plate` and `Right gearbox plate`.

## Onshape Export Settings

Export from the master robot assembly or the smallest complete subsystem
assembly that matches the Mission Control review scope.

Recommended Onshape export choices:

- Format: `STEP`.
- Version: AP242 when available; AP214 is acceptable when AP242 is not
  available.
- Export scope: whole assembly or selected assembly with subassemblies included.
- Structure: preserve assemblies and subassemblies; do not flatten.
- Units: use the CAD document's normal robot units consistently across exports.
- Include hidden or suppressed items only when those items should be reviewed in
  Mission Control.

Before exporting:

1. Create a named Onshape version or otherwise record the source state.
2. Confirm major subsystem and mechanism assemblies have final review names.
3. Suppress scratch geometry, construction-only placeholders, and abandoned
   prototypes.
4. Export from the same source assembly across iterations when possible.

## Subassembly Structure

Mission Control works best when the STEP tree mirrors how the team plans and
builds the robot.

Recommended hierarchy:

```text
Robot
  SUB - Drivetrain
    MECH - Drivetrain - Swerve Module
      ASM - Drivetrain - Module Frame
      PRT - Drivetrain - Bearing Block
  SUB - Intake
    MECH - Intake - Pivot
    MECH - Intake - Roller
```

Guidelines:

- Keep subsystem boundaries clear at the first or second assembly level.
- Group mechanisms under the subsystem they belong to.
- Keep repeated modules as repeated assemblies instead of unrelated copied part
  trees.
- Keep COTS hardware grouped near the mechanism that uses it.
- Avoid exporting one flat part list unless the design is intentionally a single
  mechanism.

## Known Limitations

STEP files do not reliably preserve every CAD identity or source relationship.
Mission Control imports what the file contains and then asks the user to review
warnings and mappings.

Current limitations:

- Flattened exports lose subsystem and mechanism context.
- Generic or duplicated names reduce mapping confidence.
- Renames may appear as removed and new objects unless carry-forward mapping
  rules or manual review connect them.
- Geometry viewing, mass properties, material extraction, and shape-level diffs
  are not part of the current web workflow.
- Production subsystem, mechanism, and part records are not created
  automatically from STEP structure without finalization/review support.
- Suppressed, hidden, derived, or imported CAD items may appear differently
  depending on export settings.

When in doubt, upload the STEP snapshot and review the importer warnings before
using the data for planning.
