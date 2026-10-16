# OpenCAD 0.8 — interface and branding validation

This release changes the application identity and interface. The geometry
and DWG support limits documented for 0.7 continue to apply.

- User-supplied logo is used as-is in the UI. A crop of its original symbol
  is converted into PNG/ICO sizes for the window and executable icon.
- Window, help, title, package metadata, PDF creator and Windows executable
  product/version strings now use OpenCAD 0.8.
- Executable resources were rewritten and parsed again. All non-resource
  PE sections were compared byte-for-byte with the original and matched.
- Main workspace: left Layers dock, center drawing/document/command area,
  right Properties/settings dock, blue ribbon and bottom Model/status strip.
- Functional Home/Draw/Modify/Annotate/View ribbon categories, keyboard tab
  navigation, File menu, Plot buttons and Ctrl+K command focus were checked.
- Home screen retains actual recent drawings and generated previews.
  Four small external links occupy the lower-left sidebar. Discord uses
  the English label “Join our community”.
- Link clicks were verified with a mocked desktop bridge; main-process
  allowlist accepts only the four supplied HTTPS URLs. Invalid schemes,
  unrelated destinations and malformed values were rejected.
- Visual/layout checks passed at 1536×1024 and the minimum 1000×650 window.
- Existing home/layer/large-render UI, TRIM/F8, nested-block and advanced
  editing UI suites passed against the new layout.
- Historical user-data folders are reused if a new OpenCAD profile does not
  exist, preserving recent-project data and recovery files. HCAD format stays
  unchanged. Migration behavior still needs target-Windows acceptance.

Windows execution, OS browser launching, shell icon caching and target-CAD
compatibility were not tested on this Linux development host. The program
is not signed. This is not a full AutoCAD-equivalence release.
