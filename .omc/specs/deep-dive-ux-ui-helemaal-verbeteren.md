# Deep Dive Spec: UX/UI Volledige Verbetering

## Goal
Herontwerp de SoundCloud music player (index.html) naar een Spotify-achtige, mobile-first interface met paarse accent kleur (#8B5CF6), compacte now-playing bar, full-screen expandable player (swipe-up), swipe gestures op tracks, en verbeterde queue UX. Behoud alle bestaande functionaliteit (SoundCloud Widget API, Media Session API, queue, shuffle).

## Constraints
- **Single-file architectuur**: Alles blijft in index.html (HTML + CSS + JS)
- **Mobile-only focus**: Geen responsive breakpoints voor tablet/desktop nodig
- **Geen accessibility vereisten**: Geen WCAG compliance nodig, focus op visuele UX
- **Bestaande functionaliteit behouden**: SoundCloud Widget, Media Session API, queue, shuffle, lock screen controls
- **168 hardcoded tracks**: TRACK_NAMES array blijft ongewijzigd
- **Geen zoekfunctie**: Scrollen door lijst is voldoende

## Non-Goals
- Desktop/tablet optimalisatie
- WCAG AA compliance of screen reader support
- Zoek/filter functionaliteit
- Album art integratie (SoundCloud Widget biedt dit niet betrouwbaar)
- Offline support of PWA features
- Track reordering via drag-and-drop in de lijst (alleen queue)

## Acceptance Criteria

### Visueel Ontwerp
1. **Accent kleur** is paars (#8B5CF6) met bijpassende dim/glow varianten
2. **Dark theme** met Spotify-achtige kleuren (diep zwart/grijs achtergronden)
3. **Compacte now-playing bar** (~80px) bovenaan: track naam + inline controls (prev/play/next) + dunne progress bar + expand knop
4. **Dunne progress bar** (~4px visueel, grotere touch target) vervangt de huidige 32px waveform bar
5. **Verbeterde typografische hierarchie**: track naam prominenter dan app chrome
6. **Text-dim kleur** heeft voldoende contrast voor leesbaarheid (niet per se WCAG, maar comfortabel)
7. **Bottom spacer** correct berekend met safe-area-inset

### Full-Screen Player
8. **Swipe-up gesture** op mini player/compacte bar opent full-screen player view
9. **Full-screen player** bevat: grote track naam, progress bar met seek, tijd-indicatoren, volledige controls (shuffle, prev, play, next), swipe-down om te sluiten
10. **Smooth transitie** (transform-based) tussen compact en full-screen
11. **Mini player** verschijnt onderaan als user scrollt voorbij de compacte bar (bestaand gedrag, verbeterd)

### Interactie & Touch
12. **Alle touch targets** minimaal 44x44px (buttons, queue items, track actions)
13. **Swipe-right op track** = toevoegen aan queue (met visuele bevestiging)
14. **Swipe-left op track** = verwijderen uit queue (als in queue)
15. **Active states** met scale/opacity feedback op alle interactieve elementen
16. **Queue section** inklapbaar via tap op header
17. **Queue clear** en **queue remove** buttons met adequate touch targets

### Performance
18. **Targeted DOM updates**: geen volledige innerHTML rebuild bij state changes -- alleen gewijzigde elementen updaten
19. **Event delegation** op track list (1 handler op container, niet per item)
20. **GPU-accelerated animaties**: eq-bars via transform:scaleY, progress via transform:scaleX
21. **IntersectionObserver** voor mini player visibility (vervangt scroll + getBoundingClientRect)

### Queue
22. **Queue functionaliteit** volledig behouden (add, remove, clear, play from queue, shuffle queue)
23. **Queue section** visueel verbeterd met betere spacing en touch targets
24. **Swipe-to-remove** als alternatief voor de X-button in queue items

## Assumptions Exposed
- SoundCloud Widget API blijft beschikbaar en stabiel
- Gebruiker opent de player alleen in mobile browsers (Chrome/Safari)
- 168 tracks is het maximum; geen verwachting van significante groei
- Geen internet-vrij gebruik vereist (SoundCloud streaming vereist internet)

## Technical Context
- **Bestaand**: Single HTML file, CSS vars, Inter font, SC Widget API via iframe, Media Session API met silent audio trick
- **Goed om te behouden**: CSS custom properties architectuur, Media Session integration, seek-on-release pattern, passive event listeners, font loading strategy
- **Te refactoren**: renderTracks() innerHTML → targeted updates, eq-bar height → scaleY, progress width → scaleX, scroll-based mini player check → IntersectionObserver

## Trace Findings

### Lane 1 (Visueel Ontwerp) - HIGH confidence
- Zero media queries (niet nodig voor mobile-only)
- --text-dim (#71717a) contrast 3.3:1 op --bg-card (te laag)
- Current track name en header h1 beide 1.1rem (platte hierarchie)
- Progress bar 32px domineert visueel
- Bottom spacer 80px te klein voor safe-area devices
- Add-to-queue 32x32px onder touch minimum

### Lane 2 (Interactie & Touch) - HIGH confidence
- 5 touch targets onder 44px minimum
- Zero gesture support
- Queue header dead interaction (cursor:pointer, geen handler)
- Mini player zonder seek
- Geen visuele touch feedback op utility buttons

### Lane 3 (Performance) - MEDIUM-HIGH confidence
- renderTracks() innerHTML rebuild van 170+ items bij elke state change
- eq-bar height animatie (layout-triggering)
- Progress bar width animatie (layout-triggering)
- Geen event delegation
- ~1000+ DOM nodes altijd in DOM

### Resolved by Interview
- Design richting: Spotify-achtig → compacte layout, dunne progress bar
- Accent kleur: paars #8B5CF6 (niet oranje)
- Queue: essentieel, behouden + verbeteren
- Full-screen player: ja, swipe-up gesture
- Swipe gestures: ja, op track list items
- Layout: compacte now-playing + track list first
- Accessibility: niet belangrijk (persoonlijk project)
- Device focus: mobile-only

## Interview Transcript
1. **Design stijl** → Spotify-achtig (minimalistisch donker, compacte controls, dunne progress bar)
2. **Progress bar** → Geen voorkeur (keuze: dunne bar passend bij Spotify-stijl)
3. **Queue** → Essentieel (actief gebruikt, behouden en verbeteren)
4. **Accessibility** → Niet belangrijk (persoonlijk project)
5. **Devices** → Alleen telefoon (mobile-only)
6. **Full-screen player** → Ja, met swipe-up gesture
7. **Swipe gestures** → Ja, swipe-to-queue en swipe-to-remove
8. **Zoekfunctie** → Niet nodig
9. **Accent kleur** → Paars (#8B5CF6)
10. **Layout** → Compacte now-playing bar (~80px) + track list, full-screen voor details
