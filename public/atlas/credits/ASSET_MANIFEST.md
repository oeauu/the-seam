# Museum Atlas asset manifest

This manifest covers the local geometry used by the parchment atlas. V2 does not
download map data from a CDN and does not add a new external image or font.

| File | Role | Current provenance | Rights status | Integrity |
| --- | --- | --- | --- | --- |
| `public/countries-110m.json` | World country contours for the 3D globe and region navigation | Inherited from the repository's initial import (`ad6916e`); the upstream dataset name is not recorded in the repository | Attribution/license verification required before public production use | SHA-256 `2516C915867C7BAF18DDEC727AEC46C315541A07CFB3D79A6559B05D5E94EEE8` |
| `public/china.json` | Existing local China/province geometry retained for future regional detail | Inherited from the repository's initial import (`ad6916e`) | Attribution/license verification required before public production use | SHA-256 `A250D8ED7EDA5F25918A77CC4F339507F48BE75FAB3F3029A3F3979324DBC698` |
| `src/features/atlas/rendering/parchmentTexture.ts` | Procedural color, roughness, and normal maps | Generated locally from a fixed seed; no external asset | Repository code | Fixed seed `0x51f0cafe`, quality levels high/medium/low |

The atlas currently uses `countries-110m.json` at runtime through the local
`/countries-110m.json` path. It intentionally does not present the inherited
geometry as a historical-border claim: the 3D surface is a navigation layer.
Before a public release, record the upstream dataset URL, version, attribution,
and license here and in the project legal review checklist.
