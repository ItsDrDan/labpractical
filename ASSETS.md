# Station Rotation: art

The instruments students read (graduated cylinder, buret, thermometer, eudiometer, volumetric fill lines, balance), flames, test tubes and molecule models are drawn by the game's code (their markings have to be exact). Don't make those.

## Equipment pictures (`assets/equip/<id>.webp`, 1024 × 1024 transparent)
Used by "Name that equipment" and "What is it for?". If a file is missing, the game shows its built-in drawing. IDs: thermometer, testtube, beaker, watchglass, gradcyl, erlenmeyer, volflask, transferpipet, volpipet, pipetbulb, buret, buretclamp, bunsen, funnel, washbottle, tongs, scoopula, ringstand, utilityclamp, clampholder, crucible, claytriangle, wiregauze, eudiometer, calorimeter, filterflask, buchner. No text or labels in any picture.

## Art package (ChatGPT, Nov 2026), all in place
- Logo: `assets/logo-256.webp`, `logo.png` (512), `assets/favicon-64.png`; hub card `games/assets/games/labpractical.webp`
- Mascot **Tock** (pink lab stopwatch with goggles and a clipboard): `assets/mascot/tock-{idle,thinking,correct,oops,victory}.webp`. Idle on the intro; correct / oops / thinking (Show answer) in feedback; victory, correct or thinking on mock results by score.
- 11 achievement badges: `assets/ach-<id>.webp` (first, streak5, reader, equip, calc, rotation, honor, rainbow, vlab, phet, alllabs), also used in the achievement toast.
- 15 lab tile icons: `assets/labs/<lab id>.webp` (0a 1a 3a 3z 4a 4b 5a 6a 7a 8a 9a 10a 11a 12a 12b). A new lab without a file falls back to its brand-kit badge.

Prompt style: the brand prompt from itsdrdan.github.io/games/brand, changing only the Subject line.
