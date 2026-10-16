# OpenCAD 0.9 — TRIM strokes and document tabs

Validated on a Linux development host with Node.js and headless Chromium.
Browser tests use a mocked desktop bridge; the native-host test mocks Electron
and dialogs while exercising real temporary-file writes.

## Passed

- `trim-sweep.test.cjs`: 40 targets crossed in one fast move; fixed source
  cutting edges; selected-edge protection; hidden/locked targets; repeated
  cuts on the same original; curved polylines; immutable preview; one undo/redo.
- `trim.test.cjs`: line/end/middle, open/closed/curved polyline, circle,
  tangency/no-intersection rejection, block cutting edges and cross-layer style.
- `tabs-sweep-ui.test.cjs`: independent document histories and views; drafting
  settings; duplicate-file activation preserves edits; new tabs; Ctrl+Tab;
  Save/Discard/Cancel; canceled save keeps the tab; inactive dirty drawings
  contribute to window-close state; workspace restore; real pointer sweep
  with OSNAP/grid enabled; release commits once; Escape cancels without edits.
- `workspace-host.test.cjs`: queued atomic recovery writes, recovery cleanup,
  save path identity, canceled close, discard close and rejection of late
  autosave writes after closing starts.
- Existing `trim-ui`, `shell-ui`, `home-ui`, `blocks-ui`, `modify-ui` suites
  passed. These include F8 rectangle, direct-click polyline TRIM, responsive
  1536×1024/1000×650 shell, 1501-layer paging, 50k-object cached render, nested
  block editing, display contrast, arrays, corners, break and stretch.
- `blocks.test.cjs`: block transforms, layer inheritance, nested selection,
  explode and DXF BLOCK/INSERT round-trip passed.
- The header/home wordmark was visually inspected after CSS contrast/blending.
  Its black rectangle is no longer visible; the original bitmap is retained.

## Packaging and limits

The Windows executable resource metadata is updated to 0.9.0; non-resource
PE sections are compared byte-for-byte. JavaScript syntax and ZIP integrity
are checked before delivery. QA screenshots and generated test output are
excluded from the package.

Windows execution, OS dialogs, Explorer icon refresh and target AutoCAD
acceptance remain untested. No new DWG import/export coverage is claimed in
this release. The bundled LibreDWG writer remains experimental; source DWG
files should be preserved. These tabs are independent model drawings, not
paper-space layouts or split viewports. Block members still require EXPLODE
for TRIM. Crash recovery is capped at 100 MB and does not retain Undo history.
