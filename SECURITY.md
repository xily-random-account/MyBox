# SECURITY.md

## Supported Versions

MyBox only receives security fixes for recent versions. Older versions may still run, but they are not maintained.

| Version | Supported |
|--------|-----------|
| main   | ✔️ active fixes |
| 5.x    | ✔️ critical fixes only |


If you rely on older versions, update to the latest release.

---

## Reporting a Vulnerability

If you find a security issue, please report it privately so it can be fixed before it becomes public.

### Where to report
Send reports to:
This github’s repos Issue sections

### What to include
- A clear description of the issue  
- Steps to reproduce  
- Affected versions  
- Any proof‑of‑concept  
- Whether you want credit or anonymity  

### Disclosure
Issues are not made public until a fix is available.  
Coordinated disclosure is preferred.

---

## Scope

This policy covers:

- MyBox Editor  
- MyBox Player  
- MyBox Synth Engine  
- MyBox Website  
- Offline/PWA service worker  
- Sample packs included with MyBox  
- Build output used by the official site  

This policy does **not** cover:

- Third‑party CDNs  
- External sample packs not hosted by MyBox  
- Forks or modified builds  
- Browser‑specific bugs  

---

## Contributor Guidelines

To keep MyBox safe:

- Do not add dynamic script injection  
- Validate user‑provided JSON before loading it  
- Avoid adding external scripts without integrity checks  
- Keep service worker changes simple and predictable  
- Follow versioning rules when changing core files

