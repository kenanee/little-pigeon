# Asset credits — Little Pigeon

## Pigeon model

- **Reference:** feathered pigeon model source supplied by the project owner in this conversation.
- **Integration:** adapted as an ES module in `src/pigeon.js`, including layered feather meshes, articulated wings, colour palettes and a smooth analog flight controller.
- **External 3D files:** none required for the pigeon.

## City traffic

- **Traffic:** 144 low-poly sedan-style vehicles generated procedurally in `src/world.js`.
- **Rendering:** five `THREE.InstancedMesh` batches (body, glass, wheels, headlights and tail lights), keeping traffic to a small number of draw calls.
- **External car files:** none loaded at runtime.

## Other game models

- **Fried drumstick pursuers:** custom procedural geometry and a generated crust texture in `src/chicken.js`.
- **Buildings, streets, trees, street furniture and coins:** procedural scene geometry and browser-generated textures in `src/world.js`.

## Music and sound

The ambience and short sound effects are synthesized by `src/audio.js` with the Web Audio API. No commercial music recording or sample is included.
