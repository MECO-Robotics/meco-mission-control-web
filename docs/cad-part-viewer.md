# CAD part display

Use Three.js through React Three Fiber for CAD part rendering. The shared viewer is available in Structure → Import CAD in both signed-in workspaces and local demo/tutorial mode. It is also available in Structure → 3D View, even before subsystems exist. Switching projects or leaving 3D View clears that temporary preview. Map View and List View retain the existing configuration editing tools. Selecting a STEP file prepares its geometry before any server import; rotate, pan, zoom, fit the view, select a part, isolate it, or switch to wireframe.

`occt-import-js` tessellates STEP solids and surfaces in a dedicated, cancellable worker. Mesh positions retain the source assembly placement and use millimeters. React Three Fiber owns the scene and GPU resources; Drei supplies camera framing and orbit controls. The renderer and geometry reader load on demand. File changes terminate obsolete workers and clear selection. Invalid/empty geometry, WebGL failures, files over 50 MB, and parsing beyond two minutes have explicit failure states.

This is a file preview. Geometry is not saved in CAD snapshots, which currently contain hierarchy and mapping metadata. Re-select the STEP file after leaving or reloading the page. Onshape metadata alone cannot supply a 3D model. No database reset or migration is required, and the server import/mapping APIs are unchanged.

The existing metadata parser remains responsible for workspace mappings. A browser tessellator is added because that parser does not produce meshes; replacing it with a rendering engine would discard its mapping responsibilities. Both entrypoints use the same viewer rather than separate display implementations.

React and React DOM are constrained to 19.2 patch releases to match React Three Fiber 9's supported peer range. The document Content Security Policy retains its ban on JavaScript evaluation and inline scripts. One Trusted Types policy accepts only the build's CAD worker URL. Only that worker response permits `unsafe-eval`, required by OCCT's generated Embind functions and WebAssembly; it cannot spawn workers or access the document. Its resource access is limited to the application origin. Vite development/preview and the nginx configuration apply the same exception. Worker and WASM assets are served from the application origin.

Dependencies: [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction), [OCCT importer](https://github.com/kovacsv/occt-import-js). The latter is LGPL-2.1; its source and license are included in the npm distribution and linked here.

## Saved part images

In either viewer, select a CAD mesh, choose its part number/name/revision under **Save image to part**, then choose **Save part image** (or **Replace part image** if it already has one). This explicit association handles duplicate CAD names without guessing which part record owns the shape. Repeat for other parts as needed; no automatic mesh-to-record matching is performed.

The renderer creates a transparent 192 × 192 PNG from a fixed angled camera, centered and fitted to the selected mesh. It saves the small image into the existing part-definition `photoUrl` using the ordinary part update API. The image replaces that definition's existing photo only through this explicit action. Mesh geometry is still temporary. No new storage service, schema, API, or migration is introduced.

The Parts catalog and Robot Configuration's mechanism part lists display ordinary image thumbnails. All instances share their definition's image; Robot Configuration falls back to an instance photo if the definition has none or its image cannot load. Missing images show a neutral part icon. Existing uploaded definition photos work with the same display.

Saved images follow the existing workspace persistence policy: local demo changes survive page reloads in the current tab; tutorial images stay in the tutorial; signed-in state uses the platform's configured snapshot storage. Development servers configured to reset their seed on startup still reset images along with other application data. Production snapshot persistence retains them across process restarts. Editing a revision retains its image until explicitly replaced, following the existing photo behavior; this is not a revision history archive.
