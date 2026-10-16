# Hendese CAD 0.7 — validation record

Environment: Linux development host; Node.js geometry/file tests and Chromium
headless UI. Windows runtime is packaged but has not been executed here.

| Area | Result and scope |
|---|---|
| Geometry and import | Core, precision, polyline-import, modify, export, blocks and trim suites passed. Includes real DWG parsing, DXF round-trip, transformed geometry and project validation. |
| F8 rectangle | Real pointer input with Ortho enabled produced a rectangle with both dimensions; command state remained consistent. |
| TRIM | Line ends/middle, open/closed/curved polylines and circles; tangent/no-intersection rejection; block cutting edges; layer/style preservation. UI tested a non-current target layer, locked cutting edges, locked target protection, Enter exit and undo. |
| EXTEND | Nearest-boundary line and open-polyline extension tested. Not every curve/degenerate configuration or AutoCAD option is covered. |
| Blocks | Nested INSERT transforms, array instances, layer inheritance, polygon closure, move/rotate/scale, one-level EXPLODE, hit/snap filtering and visible PDF layout. UI single selection, properties/move, undo/redo and nested block creation passed. |
| Appearance | Adaptive contrast and white/dark background tested without modifying stored colors. Hidden members excluded from hit testing. |
| Existing editing UI | Fillet/chamfer preview, commit/cancel, arrays, break, lengthen, stretch, undo/redo and invalid-value handling passed with English controls. |
| Home/layers | Recent previews, search/missing/remove/new, inherited visibility, 1,501 paginated layers and 50,000-object rendering cache passed. |
| Large import | Synthetic DXF: 510,000 objects, 45,966,902 bytes; index 3,477 ms, worker open 2,706 ms on this host. Parsing cancellation and timeout behavior passed. This is not a large real-world DWG benchmark. |
| DXF/PDF | R2000 layers, units, lineweights, nested BLOCK_RECORD/BLOCK/INSERT; vector PDF scale transforms, overflow rejection, custom paper/window clipping and explicit fit-to-paper passed. Independent ezdxf audit of modern DXF reported zero errors/fixes. |
| Native DWG | Linux build of the bundled LibreDWG version wrote and reopened samples including 3 top-level INSERTs / 4 block definitions. Independent native conversion still emitted handle/ENDBLK warnings. Output is experimental and may trigger recovery in other CAD applications. |
| Optional ODA | Two samples converted with auditing enabled, then passed the application's structural verifier: nested block sample (3 root entities / 4 blocks), office sample (30 normalized entities / 0 blocks). Windows ODA selection and the optional empty-drawing fixture were not tested. ODA is not bundled. |

## Scope and outstanding checks

- The DWG verifier compares exported supported geometry, entity/layer counts,
  nested block structure, extents and lineweights. It is not a complete DWG
  validator and cannot recover objects skipped during import.
- The screenshot showed a recovery warning, but the original problematic DWG
  was not supplied. That exact failure is not reproduced or declared fixed.
- Windows startup, file dialogs, native Windows converter and AutoCAD opening
  remain acceptance checks for the target system.
- Blocks are static trees; export uses separate definitions per instance.
  Dynamic blocks, editable attributes, shared definition editing and full
  AutoCAD command/format compatibility are outside this release.
- Locked targets intentionally remain protected. Block members require
  EXPLODE before TRIM. Unsupported entity types are not silently claimed to work.

No QA screenshots are part of the new deliverables.
