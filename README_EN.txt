OPENCAD 0.9 — WINDOWS x64
Local 2D CAD workspace. English interface.

START
Extract the entire ZIP, then open OpenCAD.exe. Keep resources, locales and
DLL files beside the executable. Python and Node.js are not required.
Open DWG, DXF or HCAD from the home screen. Recent drawings have previews.
Files are processed locally. Save HCAD to retain editable project data.

CHANGES IN 0.9
- Click-to-trim plus continuous left-button TRIM strokes across objects.
  The drawing is changed only on release. Escape cancels the preview;
  one Undo reverses the entire stroke. Cutting edges stay fixed per stroke.
- Independent drawing tabs: New/Open no longer replace the active drawing.
  Each tab retains its geometry, layers, view, drafting flags and undo history.
- Close tabs with Save project / Discard / Cancel. Canceling the native save
  dialog keeps the drawing open. Unsaved tabs display an asterisk.
- Workspace autosave includes all open drawings and their views/settings.
- The original wordmark blends with the header and home sidebar without
  its dark rectangular backdrop. The original bitmap is preserved.

DRAWING TABS
Use + above the canvas for a new drawing, or the adjacent Open button for
another DWG/DXF/HCAD. Ctrl+N and Ctrl+O do the same. Ctrl+Tab / Ctrl+Shift+Tab
switch tabs; Ctrl+W or the tab X closes a drawing. Reopening the same path
activates its existing tab and preserves unsaved edits.
Save project (Ctrl+S) writes the active tab as HCAD. DWG/DXF/PDF are exports;
exporting does not clear the project's unsaved marker. Window close checks
all tabs. Cancel that prompt to save drawings individually first.
Every 30 seconds, an unsaved workspace is copied to crash recovery (up to
100 MB total serialized data); save individual projects for durable copies.
Recovery restores drawings/views, not the session's undo histories.
These are document tabs, not paper-space layouts or split-screen viewports.

PREVIOUS CHANGES IN 0.8
- OpenCAD name, supplied logo, Windows icon and application metadata.
- Blue ribbon UI: Home, Draw, Modify, Annotate and View. Layers on the left;
  drawing/command line in the center; properties and settings on the right.
- Home screen previews plus GitHub, Instagram, X and Discord links at the
  lower left. Links open your default browser. Discord: Join our community.
- Existing user data is reused when no new OpenCAD profile exists.
- Ctrl+K focuses the command line. Advanced tools are on the Modify tab.

PREVIOUS CHANGES IN 0.7
- Imported static blocks remain single selectable objects, including nested
  blocks. Member layers and inherited visibility are retained.
- BLOCK (B) creates a block from selected objects with a name and base point.
  EXPLODE (X) opens one level. MOVE, COPY, ROTATE and SCALE work on blocks.
- TRIM supports lines, arcs, circles and open/closed straight or curved
  polylines. EXTEND supports lines, arcs and open polylines.
- F8 no longer collapses the opposite corner of a rectangle onto one axis.
- Background settings offer dark/white and adaptive color contrast. These
  affect the screen only; saved layer and output colors are unchanged.
- English menus, command prompts, dialogs and help.
- DWG export can use a separately installed ODA File Converter. The bundled
  LibreDWG writer remains experimental.

TRIM / EXTEND
Type TR and Enter without a selection to use all visible cutting edges.
Click the portion to remove, or hold the left button and sweep across many
parts. Release applies the preview; Escape cancels it. A stroke is one Undo.
Fast pointer movements use segment intersections, not isolated cursor samples.
Alternatively, preselect cutting edges first; selected edges are protected.
Objects with no valid cutting intersection are left unchanged.
Type EX and Enter, then click near the endpoint to extend to a boundary.
Geometry can be on different layers; the current layer does not restrict it.
Locked objects may act as boundaries but cannot be modified. Hidden objects
are excluded. To trim a block member, EXPLODE the block first.
Enter finishes; Escape cancels. Ctrl+Z / Ctrl+Y undo and redo.
Not every AutoCAD TRIM/EXTEND option or object class is implemented.

DRAWING / PRECISION
L LINE; PL PLINE; REC RECTANG; C CIRCLE; A ARC; T TEXT; DIM; H HATCH.
M MOVE; CO COPY; RO ROTATE; SC SCALE; MI MIRROR; E ERASE.
Select objects before these transformation commands.
PEDIT / PE edits polylines; JOIN / J joins compatible connected paths.
FILLET / FI, CHAMFER / CHA, ARRAY / AR, BREAK / BR, BREAKATPOINT / BRP,
LENGTHEN / LEN and STRETCH / S provide their supported 2D operations.
F8 toggles Ortho; rectangle corners remain free in both axes.
F12 toggles cursor-side dynamic input. F1 opens help.
Coordinates: 100,200; relative: @500,0; polar: @500<30.
Use a decimal point and a comma between coordinates.
Changing drawing units changes the unit label, not existing geometry.
Mouse wheel zooms; middle button pans; Z fits the drawing.
Ctrl+O opens, Ctrl+N creates, Ctrl+S saves, Ctrl+P opens Plot.

DWG EXPORT AND RECOVERY
Use DWG engine settings to auto-detect or select an installed
ODAFileConverter.exe. ODA is not bundled. Conversion requests DWG 2000 with
auditing enabled. With no ODA installation, the bundled experimental
LibreDWG writer is used. Other CAD applications may request recovery for
LibreDWG output; reopening successfully here does not prove full compatibility.
Before writing, the application compares supported object types, layers,
block structure, extents and lineweights with the DXF export representation.
A failed verification prevents replacement of the destination file.
This does not detect all possible semantic losses or certify AutoCAD behavior.
Keep the original DWG and save edited output under a separate name.
The user's reported damaged DWG was not supplied for reproduction.

BLOCK / FORMAT LIMITS
Static INSERT nesting, placement and member layers are preserved. Export
creates a separate definition per instance. Shared definition editing, block
libraries, dynamic behavior and editable attributes are not implemented.
Imported attribute values become plain text. Dimensions and hatches may be
converted to geometry/text; MTEXT becomes plain text; curves may be approximated.
Unsupported objects are listed in the import report and cannot be restored
by export. DWG/DXF colors are mapped to the ACI palette.
There is no full AutoCAD parity, 3D solids, paper-space editing, attached XREF,
SHX support, LISP or complete style/proxy/AEC round-trip support.
Input limits: 512 MB, 2,000,000 decoded objects, ten-minute parser timeout.
Limits are ceilings, not guarantees for every drawing or available RAM.

SCALED PDF
Plot offers A0-A4 or custom paper, orientation, units, Extents/Display/Window/
Selection, center/offset, 1:N scale, lineweights and saved page setups.
A drawing that does not fit is rejected instead of silently rescaled.
Enable Fit to paper explicitly when desired. Print the PDF at 100% / Actual
size, with viewer scaling disabled. Layer lineweights use physical millimeters.
Physical printer selection, CTB/STB, multiple layouts/viewports and batch
plotting are not implemented.

VALIDATION
0.9 checks: fast sweep TRIM, immutable preview, one-step undo/redo, curved
polylines, cross-layer and hidden/locked protection; independent document
history/view, duplicate-file activation, save cancellation, tab closure,
workspace recovery, queued recovery writes and close/discard behavior.
Existing F8/polyline TRIM, home/large-render, block, advanced editing and
responsive shell suites passed. Desktop services are mocked in browser tests.
Windows EXE launch, native Windows dialogs and target AutoCAD acceptance
have not been run here. See docs/Test_Raporu_0.9.md for the tested scope.
Earlier format/large-import tests are recorded in the earlier reports.

SOURCE / LICENSE
Source is included in resources/app. GPL-3.0-only; see LICENSE and third-party
notices. Existing bundled runtime/converter licenses remain in the package.
ODA is a separate installation and is not redistributed here.
