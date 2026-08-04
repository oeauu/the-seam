# Parchment Coordinate Atlas V2 execution report

日期：2026-08-04
仓库：`Adrerie/Thequeerarchive`
功能分支：`feat/parchment-coordinate-atlas-v2`
禁止操作：未修改、未合并 `main`

## 1. Source and branch provenance

- Requested source branch: `feat/museum-atlas-3d`.
- GitHub API verified its latest commit as `11c3a66cebf5009095119da06ef465cec1296489`.
- The local Git HTTPS transport repeatedly failed to connect to GitHub port 443. The exact latest branch snapshot was therefore downloaded through authenticated `gh api`, extracted outside the workspace, and its complete V2 plan directory was copied into the new feature branch.
- The local starting code commit was `50109c999ecffa18142139b5286a8afd8926a473` because the transport failure prevented adding the remote commit object to the local graph. The resulting working tree contains the verified latest plan files; this fallback is recorded rather than being presented as a normal Git fetch.
- Feature commit SHA: `580f3c2d0b82b9a5408e4a7bd5a6f8d76c0e4e99` (`feat: add parchment coordinate atlas v2`).

## 2. Required plan reading order

Read completely in the README-specified order:

1. `README.md`
2. `00_MASTER_EXECUTION_PLAN.md`
3. `01_CURRENT_IMPLEMENTATION_AUDIT.md`
4. `02_VISUAL_SYSTEM_PARCHMENT_MAP.md`
5. `03_INTERACTION_AND_LABEL_SPEC.md`
6. `04_TECHNICAL_ARCHITECTURE_AND_MIGRATION.md`
7. `05_IMPLEMENTATION_PHASES.md`
8. `06_TESTING_ACCEPTANCE_AND_HANDOFF.md`
9. `07_ASSET_CONTENT_AND_RIGHTS_RULES.md`
10. `08_MOTIONSITES_REFERENCE_GUIDE.md`

## 3. Phase result

| Phase | Result | Evidence |
| --- | --- | --- |
| 0 baseline and branch | Completed | New branch, baseline build/lint/unit/E2E run, `artifacts/baseline-v1-global.png` |
| 1 coordinate model and grouping | Completed | `rendering/locationGroups.ts`, `rendering/regionProjection.ts`, 10 focused tests; precision-aware tolerances and explicit location IDs |
| 2 parchment material | Completed | Fixed-seed color/roughness/normal textures; high/medium/low resolutions; explicit disposal |
| 3 global parchment globe | Completed | `GlobeScene.tsx`, local country TopoJSON, parchment material and boundary lines |
| 4 real region map | Completed | `CountryBoundaryLayer.tsx`, `RegionAtlasScene.tsx`, shared projection; no rectangle region surface; Europe screenshot in `artifacts/region-parchment-map.png` |
| 5 coordinate marker system | Completed | `CoordinateMarker3D.tsx`, `CoordinateMarkerLayer.tsx`; `ArchiveCard3D.tsx` remains only as deprecated compatibility code and is not rendered by the formal Atlas scenes |
| 6 label layout and avoidance | Completed | Screen-space projection, back-face/frustum culling, four-way placement, collision and mobile budgets; focused label tests |
| 7 parchment timeline | Completed | `ParchmentTimeline.tsx`; RAF-coalesced preview updates, release/blur/keyboard commit, `previewRange` vs `committedRange`, year zero normalization |
| 8 same-location interaction and details | Completed in-session | Multi-entry coordinate popover, entry selection, hash state, Escape/back behavior and shared detail drawer; `artifacts/multi-entry-location.png` and `artifacts/detail-drawer.png` |
| 9 MotionSites pattern rewrite | Completed | Slider hold/release, drawer/popover, hover/focus and reduced-motion ideas were rewritten in local React/CSS; no Framer Motion, Tailwind, CDN asset or premium dependency added |
| 10 quality/mobile/reduced motion | Completed | High/medium/low DPR and texture/label budgets, progressive performance downgrade, reduced-motion remains low-dynamic 3D, explicit user-controlled 2D fallback |
| 11 minimal 2D fallback | Completed | `Atlas2DFallback.tsx` loads the same local country contours and retains shared filters/details; explicit inherited-shape fallback is only used if the local asset request fails |
| 12 acceptance and delivery | Completed | Final tests and screenshots passed; feature commit and report amendment are committed; branch push is recorded below |

## 4. Implementation files and decisions

- State: `src/features/atlas/types.ts`, `src/features/atlas/state/atlasReducer.ts`.
- 3D scenes: `Atlas3DScene.tsx`, `AtlasCameraRig.tsx`, `GlobeScene.tsx`, `RegionAtlasScene.tsx`.
- Local geometry: `CountryBoundaryLayer.tsx`, `public/countries-110m.json`, existing `public/china.json` retained.
- Coordinate and labels: `CoordinateMarker3D.tsx`, `CoordinateMarkerLayer.tsx`, `AtlasLabelLayer.tsx`, `rendering/locationGroups.ts`, `rendering/labelLayout.ts`.
- Material: `rendering/parchmentTexture.ts`, `rendering/parchmentMaterial.ts`, `ParchmentGlobeMaterial.tsx`, `ParchmentRegionSurface.tsx`.
- Time and interaction: `ParchmentTimeline.tsx`, `LocationEntryPopover.tsx`, `AtlasViewport.tsx`.
- Fallback: `Atlas2DFallback.tsx` uses local TopoJSON and the same archive filters.
- Rights record: `public/atlas/credits/ASSET_MANIFEST.md`.
- No new package dependency was required; existing React Three Fiber, Drei, Three, D3 and TopoJSON packages were reused.

## 5. MotionSites rewrite record

The plan's public MotionSites reference guide was used for interaction concepts only. The implementation keeps the current React/TypeScript/Vite architecture and rewrites those concepts as:

- timeline press/drag preview followed by release, blur or keyboard commit;
- CSS-backed parchment drawer and location popover with Escape/back handling;
- marker hover/selected emphasis and screen-space label avoidance;
- reduced-motion camera interpolation and no automatic switch to 2D.

No external MotionSites asset, prompt, premium template, Framer Motion, Tailwind, or new animation framework was introduced.

## 6. Verification

Passed on 2026-08-04:

- `npm run build` — passed. Vite reported the existing large-chunk warning.
- `npm run lint` — passed with existing repository warnings in `eventsData.js`, `App.tsx`, and `InteractiveMap.tsx`; no new lint error.
- `npm run test` — **8 files / 27 tests passed**.
- `npm run test:e2e` — **5 tests passed**, including the four existing flows and `tests/e2e/atlas-visual.spec.ts`.
- The visual test launches the running app in Chromium and writes all required screenshots. It also verifies reduced-motion 3D and a simulated WebGL failure.

Observed build output:

- main chunk: 370.87 kB minified / 123.55 kB gzip;
- `Atlas3DScene` chunk: 952.25 kB minified / 256.56 kB gzip;
- Vite warning: chunks exceed 500 kB; no claim is made that the production bundle budget is fully closed.

Manual/runtime coverage:

- Chromium channel, 1440×900, local Vite runtime with real WebGL;
- reduced-motion media emulation;
- WebGL context failure emulation;
- no physical mobile device or GPU/browser matrix was available in this run. Mobile label budgets and responsive CSS are covered in code, but physical-device performance remains follow-up work.

## 7. Required screenshot artifacts

All were captured from the running UI, not generated artwork:

- `artifacts/global-parchment-globe.png`
- `artifacts/region-parchment-map.png`
- `artifacts/coordinate-labels.png`
- `artifacts/timeline-dragging.png`
- `artifacts/timeline-committed.png`
- `artifacts/multi-entry-location.png`
- `artifacts/detail-drawer.png`
- `artifacts/reduced-motion-3d.png`
- `artifacts/webgl-fallback-2d.png`

`artifacts/baseline-v1-global.png` records the pre-V2 dark wireframe globe and external timeline for comparison. Local `debug-*.png` captures are excluded from delivery by `artifacts/.gitignore`.

## 8. Known follow-up and rights boundary

- The inherited world and China geometry files were present before this V2 work. Their exact upstream source and license are not recorded in the repository; `public/atlas/credits/ASSET_MANIFEST.md` records hashes and requires attribution/license verification before public production release.
- The contours are explicitly presented as a navigation layer, not a historical-border claim.
- The 3D chunk remains above the current Vite warning threshold; a future performance pass should split or reduce it after real device profiling.

## 9. Delivery status

- Feature branch only: `feat/parchment-coordinate-atlas-v2`.
- `main` was not modified or merged.
- Feature commit: `580f3c2d0b82b9a5408e4a7bd5a6f8d76c0e4e99`.
- Report amendment commit: recorded after this file is committed.
- Push status: pending final `git push` from this branch.
