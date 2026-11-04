# Soulforge

A classless, single-player desktop WebGL RPG set in Emberfall Valley. Enter the valley for a session-only preview, or open Account & saved characters when Firebase is configured.

## Local play

Use Node 22.13.1 or a newer compatible LTS, npm, and a WebGL 2 desktop browser. From the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The preview works without a Firebase account. For local saved games install the Firebase CLI and Java 21, then start two terminals:

```sh
npm run emulators
npm run dev:emulator
```

The second command starts a separate Vite server. Open its URL and select **Account & saved characters**. Development emulator mode connects only to loopback Auth and Firestore under `demo-soulforge`. Emulator data is ephemeral unless you start the CLI with import/export options. Microsoft Edge is used by the Playwright configuration.

## Field guide

Walk north from Emberfall Village to the woods and ruins. Warden Aster stands beside the starting point. Accept quests before hunting, recover in the village and return to the warden to claim rewards. Tamsin trades equipment for gold. Silverleaf restores mana. Reaching the ruins grants discovery XP.

| Control                 | Action                                               |
| ----------------------- | ---------------------------------------------------- |
| WASD, Shift, Space      | Move relative to the camera, sprint, jump            |
| Drag, scroll            | Orbit, change camera distance                        |
| Tab (canvas focused), F | Cycle nearby targets, toggle auto-attack             |
| 1–6                     | Cast the corresponding equipped design               |
| E, J                    | Interact with a nearby station, open journal         |
| I, C, K                 | Pack, character sheet, Spellforge                    |
| Escape                  | Close the current panel or pause and adjust settings |

In the Spellforge, name a design, select an element, form and modifier, save it and assign a slot. Fire Projectile is a starter attack. Nature Projectile heals the traveler. Barrier absorbs damage and Enchantment augments weapon hits. Recover advanced components from the warden’s quests. Equipment changes and attribute refunds preserve possessions. Spend points from each level to specialize.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
firebase emulators:exec --project demo-soulforge --only auth,firestore "npm run test:backend"
firebase emulators:exec --project demo-soulforge --only hosting "node tests/emulator/hosting.mjs"
```

The ordinary browser suite runs the local preview and skips the emulator-only account test. The backend command runs both browser scenarios plus rules checks. Firebase CLI must be on PATH. Build before the Hosting smoke test. The CLI's installed executable also works when the machine's npx cache is broken.

## Firebase and release

The only production target is **soulforged-34d3c**. For a release, register a Web App within that existing project, enable Email/Password in Authentication, and copy its six public Web SDK values from Project settings into an ignored `.env.local` based on `.env.example`. The production bundle never selects emulator endpoints. Firebase API keys identify the app. Authorization is enforced by rules.

The first character occupies `users/{uid}/characters/first`. One bounded, versioned snapshot keeps currency, equipment, inventory, spell designs, quests, appearance, settings and location consistent in a single transaction. The outer revision prevents an older session overwriting a newer save. Firestore is authoritative. A failed save keeps the running character in memory and offers a retry. A conflict pauses play and offers **Reload cloud progress**, which explicitly discards the older local changes. Use **Save and return to camp** before signing out. A sudden close can lose changes since the last checkpoint.

Prototype rules restrict access to one owner's document, deny list operations, enforce the envelope and revision, and cap payload size. The validated payload represents client-trusted single-player progress. Review and verify the rules before a public release. Competitive rewards, trading, and multiplayer require authoritative backend services.

After explicit production approval, with the production environment configured, build and deploy the reviewed artifacts using `firebase deploy --project soulforged-34d3c --only firestore:rules,hosting`. Hosting serves `dist`, rewrites SPA routes and caches fingerprinted assets. No Functions or paid features are required.

## Presentation and limitations

Models, palette, scene geometry, interface art, the landscape illustration, procedural animations and synthesized audio are original to this repository. There are no externally downloaded art or sound assets. Third-party software licenses ship with the npm packages recorded in the lockfile.

The starter zone uses low-poly geometry, procedural poses, and synthesized sounds. It targets desktop browsers. Performance depends on GPU/browser and viewport. Low graphics reduces rendering resolution. Online account play needs project configuration; previews do not persist. See PROJECT_PLAN.md for verification history and outstanding release work.
