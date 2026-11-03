# Soulforge

Read MasterPromt.txt in full before planning changes. It defines the game. Follow PROJECT_PLAN.md in dependency order and update its execution log after verified slices.

- Build a playable desktop single-player classless RPG in Emberfall Valley. Use original or explicitly licensed art/audio and record external attribution. Keep traditional classes, multiplayer and paid services out of the MVP.
- React owns menus and event-driven HUD state. Babylon owns the frame loop, input, camera, collision, animation and effects. Dispose engines, scenes, listeners and observers on navigation. Keep game rules pure, deterministic and independently testable. Prefer composition and stable IDs. Store definitions and balance in versioned data modules.
- Keep character, inventory, spells, equipment and quests serializable. Use trusted component behavior. Recompute derived stats and validate eligibility at load, respec, equip and execution. Bound numbers, costs and capacity. Keep loot and quest rewards consistent on retry.
- Use typed Firebase adapters, user-scoped paths, schema versions, owner-only rules and emulator integration tests. Cloud saves are authoritative. Detect stale revisions. Save on transactions/checkpoints, never per frame. Single-player progression is client-trusted. Future shared gameplay requires authoritative server validation.
- Use npm and commit the lockfile. Keep strict TypeScript, accessible controls, actionable loading/error states and desktop WebGL support. Run format, lint, typecheck, relevant Vitest/RTL and Playwright tests and a production build at each milestone. Test real gameplay and record unverified behavior honestly.
- Work against the existing Soulforge repository and Firebase project soulforged-34d3c. Never commit secrets or service account keys. Use emulators for backend tests. Production deployment and paid service activation require explicit approval.
