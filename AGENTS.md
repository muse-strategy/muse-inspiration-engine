# Muse project rules
- `outputs/` is the canonical application. `work/` holds tests and historical prototypes; do not maintain duplicate runtime code there.
- Keep vanilla HTML/CSS/JS and the dark editorial visual system. No build or backend is required.
- Domain logic belongs in the engine, not render functions. All outputs derive from the same versioned Case.
- Never invent live data or promote user claims/demo content to VERIFIED. Evidence verification requires a source excerpt and an explicit verification record.
- Keep demo brand/industry content only in data fixtures. Engine logic must work across industries.
- Invalidate and hide downstream results on upstream edits. Back never regenerates.
- Use local persistence honestly, validate stored data and preserve the v4 migration source.
- Run unit and browser tests after changes. Never test by clearing a user's existing browser profile.
- Preserve backups. Do not claim tests passed unless actually executed.
