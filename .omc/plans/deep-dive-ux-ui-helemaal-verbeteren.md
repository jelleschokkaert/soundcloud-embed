# Implementation Plan: UX/UI Volledige Verbetering

## Context
Single-file SoundCloud music player (`index.html`, ~1600 lines) needs a full UX/UI overhaul to a Spotify-like mobile-first interface. All changes stay within the single file. The current codebase has: CSS custom properties (lines 18-29), a now-playing card with 32px waveform progress bar, basic controls, queue section, track list rendered via innerHTML, scroll-based mini player, and Media Session API integration.

## Work Objectives
Transform the player from an orange-accented card-based layout into a purple-accented Spotify-style interface with compact now-playing bar, full-screen expandable player, swipe gestures, and performance optimizations.

## Guardrails
### Must Have
- All existing functionality preserved (SoundCloud Widget API, Media Session API, queue, shuffle, lock screen controls)
- Single-file architecture maintained
- Mobile-only focus
- TRACK_NAMES array untouched

### Must NOT Have
- Desktop/tablet breakpoints
- New external dependencies
- Search/filter functionality
- Drag-and-drop reordering
- Breaking changes to SoundCloud Widget integration

---

## Task Flow

### Phase 1: CSS Custom Properties & Color System
**File:** `index.html`, lines 18-29 (`:root` block)
**Dependencies:** None (foundation for all other phases)

**Changes:**
```css
:root {
    --bg: #0a0a0b;                          /* Deeper black */
    --bg-card: #141416;                      /* Darker card */
    --bg-active: #1f1f23;                    /* Subtle active */
    --bg-elevated: #1a1a1e;                  /* New: elevated surfaces */
    --accent: #8B5CF6;                       /* Purple accent */
    --accent-dim: rgba(139, 92, 246, 0.15);  /* Purple dim */
    --accent-glow: rgba(139, 92, 246, 0.4);  /* Purple glow */
    --accent-bright: #A78BFA;                /* New: lighter purple for hover */
    --text: #fafafa;
    --text-dim: #9ca3af;                     /* Was #71717a (3.3:1) -> now ~4.5:1 contrast on --bg-card */
    --text-muted: #6b7280;                   /* New: for truly secondary text */
    --border: #27272a;
    --success: #22c55e;
    --danger: #ef4444;                       /* New: for destructive actions */
}
```

**Also update:**
- Line 243: `.progress-fill` gradient from `var(--accent) 0%, #cc4400 100%` to `var(--accent) 0%, #7C3AED 100%`
- Line 308: `.control-btn.play` background to `var(--accent)`
- Line 312: `.control-btn.play:active` background to `#7C3AED`
- Line 1466-1471: `DEFAULT_ARTWORK` SVG rect fill from `#ff5500` to `#8B5CF6`
- Line 805: iframe `color=%23ff5500` to `color=%238B5CF6`

**Acceptance Criteria:**
- All orange (#ff5500) references replaced with purple (#8B5CF6)
- `--text-dim` contrast ratio >= 4.5:1 against `--bg-card`
- Visual inspection: entire app reads as purple-accented dark theme

---

### Phase 2: Compact Now-Playing Bar (~80px) Replacing Card
**File:** `index.html`
**Dependencies:** Phase 1 (color vars)

**HTML Changes (lines 704-755):** Replace the entire `.now-playing-card` with a compact bar:
```html
<!-- Compact Now Playing Bar -->
<div class="now-playing-bar" id="nowPlayingBar">
    <div class="now-playing-bar-content">
        <div class="now-playing-bar-info">
            <div class="equalizer" id="eqBars">
                <div class="eq-bar"></div>
                <div class="eq-bar"></div>
                <div class="eq-bar"></div>
                <div class="eq-bar"></div>
            </div>
            <div class="now-playing-bar-track" id="currentTrackName">Select a track to play</div>
        </div>
        <div class="now-playing-bar-controls">
            <button class="bar-control-btn" id="prevBtn" aria-label="Previous">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="bar-control-btn bar-play-btn" id="playBtn" aria-label="Play">
                <svg viewBox="0 0 24 24" id="playIcon"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="bar-control-btn" id="nextBtn" aria-label="Next">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
        </div>
        <button class="bar-expand-btn" id="expandBtn" aria-label="Expand player">
            <svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
        </button>
    </div>
    <div class="now-playing-bar-progress" id="barProgressContainer">
        <div class="bar-progress-track">
            <div class="bar-progress-fill" id="progressFill"></div>
        </div>
    </div>
</div>
```

**CSS Changes:** Remove `.now-playing-card` styles (lines 79-185). Add:
```css
/* Compact Now Playing Bar */
.now-playing-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    padding-top: max(0.5rem, env(safe-area-inset-top));
}

.now-playing-bar.playing {
    border-bottom-color: var(--accent);
}

.now-playing-bar-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    height: 60px;
}

.now-playing-bar-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.now-playing-bar-track {
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.now-playing-bar.playing .now-playing-bar-track {
    color: var(--accent);
}

.now-playing-bar-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.bar-control-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.1s ease;
}

.bar-control-btn:active {
    transform: scale(0.9);
    background: var(--bg-active);
}

.bar-control-btn svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
}

.bar-play-btn {
    background: var(--accent);
    width: 40px;
    height: 40px;
}

.bar-play-btn:active {
    background: #7C3AED;
}

.bar-play-btn svg {
    width: 20px;
    height: 20px;
}

.bar-expand-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}

.bar-expand-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}

/* Body overflow lock for fullscreen */
body.fs-open {
    overflow: hidden;
}
```

**Remove:** The separate `.header` (lines 42-76) -- merge into the now-playing bar (the bar IS the header now).

**JS Changes:**
- Update all `nowPlayingCard` references to `nowPlayingBar` (`document.getElementById('nowPlayingBar')`)
- Update `updatePlayingState()` to toggle class on `nowPlayingBar`
- Update `checkMiniPlayer()` to use `nowPlayingBar.getBoundingClientRect()`

**Acceptance Criteria:**
- Now-playing bar is ~80px total (60px content + ~20px progress + safe-area padding)
- Contains: track name (left), equalizer bars, prev/play/next (center-right), expand button (right)
- Sticky at top of viewport
- Progress bar at bottom of the bar
- `body.fs-open` CSS class defined for fullscreen overflow lock

---

### Phase 3: Thin Progress Bar (~4px visual, larger touch target)
**File:** `index.html`
**Dependencies:** Phase 2 (new bar structure)

**IMPORTANT: Split approach for compact bar vs fullscreen bar.**

**CSS for compact bar progress (replaces lines 187-275):**
```css
/* Thin Progress Bar in compact bar - uses scaleX (no pseudo-elements) */
.now-playing-bar-progress {
    height: 24px;           /* Touch target */
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    touch-action: none;
    padding: 0 1rem;
}

.bar-progress-track {
    width: 100%;
    height: 4px;            /* Visual height */
    background: var(--bg-active);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
}

.bar-progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    width: 100%;             /* Full width, controlled by scaleX */
    transform: scaleX(0);
    transform-origin: left center;
    will-change: transform;
    /* scaleX is safe here: no ::after pseudo-element on compact bar fill */
}

/* During seeking, show a wider track */
.now-playing-bar-progress:active .bar-progress-track {
    height: 6px;
    transition: height 0.1s ease;
}

/* Mini player progress also uses scaleX (no pseudo-elements) */
.mini-progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    width: 100%;
    transform: scaleX(0);
    transform-origin: left center;
    will-change: transform;
}

/* Remove old waveform styles entirely */
```

**CSS for fullscreen progress (uses width, NOT scaleX, because of ::after seek handle):**
```css
/* Fullscreen progress bar - uses width percentage (has ::after seek handle) */
.fs-progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    width: 0%;               /* Controlled by width, NOT scaleX */
    position: relative;
    /* Do NOT use scaleX here - it distorts the ::after seek handle circle */
}

/* Seek handle on fullscreen - requires width-based parent to avoid distortion */
.fs-progress-fill::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    opacity: 0;
    transition: opacity 0.15s;
}

.fs-progress-bar:active .fs-progress-fill::after,
.fullscreen-player.seeking .fs-progress-fill::after {
    opacity: 1;
}
```

**JS Changes:**
- Compact bar + mini player: `progressFill.style.transform = 'scaleX(' + percent/100 + ')'` (GPU-accelerated, safe since no pseudo-elements)
- Mini player: `miniProgressFill.style.transform = 'scaleX(' + percent/100 + ')'`
- Fullscreen bar: `fsProgressFill.style.width = percent + '%'` (avoids distorting the ::after seek handle)
- Update seek() function to reference new `barProgressContainer` element

**Acceptance Criteria:**
- Compact bar progress uses `transform: scaleX()` (no pseudo-elements on `.bar-progress-fill`)
- Mini player progress uses `transform: scaleX()` (no pseudo-elements on `.mini-progress-fill`)
- Fullscreen progress uses `width` percentage (preserves circular ::after seek handle)
- Seek handle in fullscreen remains a perfect circle (not ellipse) at all progress values
- Progress bar is 4px visually, 24px touch target
- Smooth seeking without jank

---

### Phase 4: Full-Screen Player with Swipe-Up/Down
**File:** `index.html`
**Dependencies:** Phase 2, Phase 3

**New HTML (add after now-playing-bar):**
```html
<!-- Full-Screen Player -->
<div class="fullscreen-player" id="fullscreenPlayer">
    <div class="fs-drag-handle"></div>
    <button class="fs-close-btn" id="fsCloseBtn" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
    </button>
    <div class="fs-content">
        <div class="fs-track-info">
            <div class="fs-label">Now Playing</div>
            <div class="fs-track-name" id="fsTrackName">-</div>
        </div>
        <div class="fs-progress">
            <div class="fs-progress-bar" id="fsProgressBar">
                <div class="fs-progress-track">
                    <div class="fs-progress-fill" id="fsProgressFill"></div>
                </div>
            </div>
            <div class="fs-times">
                <span class="fs-time" id="fsTimeNow">0:00</span>
                <span class="fs-time" id="fsTimeTotal">0:00</span>
            </div>
        </div>
        <div class="fs-controls">
            <button class="fs-control-btn" id="fsShuffleBtn" aria-label="Shuffle">
                <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
            <button class="fs-control-btn" id="fsPrevBtn" aria-label="Previous">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="fs-control-btn fs-play-btn" id="fsPlayBtn" aria-label="Play">
                <svg viewBox="0 0 24 24" id="fsPlayIcon"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="fs-control-btn" id="fsNextBtn" aria-label="Next">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button class="fs-control-btn" style="width:44px;height:44px;visibility:hidden;"></button>
        </div>
    </div>
</div>
```

**New CSS:**
```css
/* Full-Screen Player */
.fullscreen-player {
    position: fixed;
    inset: 0;
    background: var(--bg);
    z-index: 300;
    display: flex;
    flex-direction: column;
    padding: max(1.5rem, env(safe-area-inset-top)) 1.5rem max(2rem, env(safe-area-inset-bottom));
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    will-change: transform;
}

.fullscreen-player.open {
    transform: translateY(0);
}

.fs-drag-handle {
    width: 36px;
    height: 4px;
    background: var(--text-dim);
    border-radius: 2px;
    margin: 0 auto 1.5rem;
    opacity: 0.5;
}

.fs-close-btn {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    right: 1rem;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.fs-close-btn svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
}

.fs-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3rem;
}

.fs-track-info {
    text-align: center;
}

.fs-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--accent);
    margin-bottom: 1rem;
}

.fs-track-name {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
    /* Allow wrapping for long names */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.fs-progress {
    width: 100%;
}

.fs-progress-bar {
    height: 32px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
}

.fs-progress-track {
    width: 100%;
    height: 4px;
    background: var(--bg-active);
    border-radius: 2px;
    overflow: visible;
    position: relative;
}

/* fs-progress-fill CSS is in Phase 3 (uses width, not scaleX) */

.fs-times {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
}

.fs-time {
    font-size: 0.75rem;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}

.fs-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
}

.fs-control-btn {
    width: 52px;
    height: 52px;
    border: none;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.1s ease;
}

.fs-control-btn:active {
    transform: scale(0.9);
    background: var(--bg-active);
}

.fs-control-btn svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
}

.fs-play-btn {
    width: 64px;
    height: 64px;
    background: var(--accent);
    border-radius: 50%;
}

.fs-play-btn:active {
    background: #7C3AED;
}

.fs-play-btn svg {
    width: 32px;
    height: 32px;
}

.fs-control-btn.active {
    color: var(--accent);
}
```

**JS Changes:**

**4a. Fullscreen player state and open/close logic:**
```javascript
const fullscreenPlayer = document.getElementById('fullscreenPlayer');
const miniPlayer = document.getElementById('miniPlayer');
let fsOpen = false;

function openFullscreen() {
    fullscreenPlayer.classList.add('open');
    fsOpen = true;
    // Use CSS class for body overflow (not inline style)
    document.body.classList.add('fs-open');
    // Hide mini player when fullscreen is open
    miniPlayer.classList.remove('visible');
    // Push history state for Android back button support
    history.pushState({ fsOpen: true }, '', '');
    // Sync state immediately including progress
    syncFullscreenState();
    // Sync progress bar position immediately on open
    widget.getPosition((pos) => {
        if (pos > 0 && duration > 0) {
            const percent = (pos / duration) * 100;
            fsProgressFill.style.width = percent + '%';
            fsTimeNow.textContent = formatTime(pos);
            fsTimeTotal.textContent = formatTime(duration);
        }
    });
}

function closeFullscreen() {
    fullscreenPlayer.classList.remove('open');
    fsOpen = false;
    document.body.classList.remove('fs-open');
    // Restore mini player visibility check
    if (currentIndex >= 0) {
        const barRect = document.getElementById('nowPlayingBar').getBoundingClientRect();
        if (barRect.bottom < 0) {
            miniPlayer.classList.add('visible');
        }
    }
}

function syncFullscreenState() {
    fsTrackName.textContent = currentTrackName.textContent;
    fsPlayIcon.innerHTML = playIcon.innerHTML;
    fsShuffleBtn.classList.toggle('active', isShuffled);
}

// Android back button support
window.addEventListener('popstate', (e) => {
    if (fsOpen) {
        closeFullscreen();
    }
});
```

**4b. Swipe-up gesture on now-playing bar AND mini player to open fullscreen:**
```javascript
// Reusable swipe-up-to-open handler for both now-playing bar and mini player
function addSwipeUpToOpen(element) {
    let touchStartY = 0;
    let touchStartTime = 0;

    element.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        const deltaTime = Date.now() - touchStartTime;
        // Swipe up: distance > 50px or velocity > 0.3px/ms
        if (deltaY > 50 || (deltaY > 20 && deltaY / deltaTime > 0.3)) {
            openFullscreen();
        }
    }, { passive: true });
}

// Wire swipe-up on both the compact bar and the mini player
addSwipeUpToOpen(document.getElementById('nowPlayingBar'));
addSwipeUpToOpen(document.getElementById('miniPlayer'));
```

**4c. Swipe-down to close fullscreen (with seek guard and passive:false):**
```javascript
let fsTouchStartY = 0;
let fsSwiping = false;

fullscreenPlayer.addEventListener('touchstart', (e) => {
    // GUARD: do not start swipe-down if user is touching the seek bar
    if (e.target.closest('.fs-progress-bar')) return;
    fsTouchStartY = e.touches[0].clientY;
    fsSwiping = true;
}, { passive: true });

// MUST be { passive: false } to allow e.preventDefault() for scroll blocking
fullscreenPlayer.addEventListener('touchmove', (e) => {
    if (!fsSwiping) return;
    const deltaY = e.touches[0].clientY - fsTouchStartY;
    if (deltaY > 0) {
        // Prevent page scroll behind the fullscreen overlay
        e.preventDefault();
        fullscreenPlayer.style.transform = `translateY(${deltaY}px)`;
    }
}, { passive: false });

fullscreenPlayer.addEventListener('touchend', (e) => {
    if (!fsSwiping) return;
    fsSwiping = false;
    const deltaY = e.changedTouches[0].clientY - fsTouchStartY;
    fullscreenPlayer.style.transform = '';
    if (deltaY > 100) {
        closeFullscreen();
    }
});
```

**4d. Fullscreen seek using reusable createSeekHandler() (see Phase 7 for implementation):**
```javascript
// Wire fullscreen seek using the reusable helper (created in Phase 7)
// createSeekHandler returns { onStart, onMove, onEnd } for a given progress bar
const fsSeekHandlers = createSeekHandler(
    document.getElementById('fsProgressBar'),
    document.getElementById('fsProgressFill'),
    true  // useWidth = true (fullscreen uses width%, not scaleX)
);
document.getElementById('fsProgressBar').addEventListener('touchstart', fsSeekHandlers.onStart, { passive: true });
document.getElementById('fsProgressBar').addEventListener('touchmove', fsSeekHandlers.onMove, { passive: false });
document.getElementById('fsProgressBar').addEventListener('touchend', fsSeekHandlers.onEnd);

// Also wire compact bar seek using the same helper
const barSeekHandlers = createSeekHandler(
    document.getElementById('barProgressContainer'),
    document.getElementById('progressFill'),
    false  // useWidth = false (compact bar uses scaleX)
);
document.getElementById('barProgressContainer').addEventListener('touchstart', barSeekHandlers.onStart, { passive: true });
document.getElementById('barProgressContainer').addEventListener('touchmove', barSeekHandlers.onMove, { passive: false });
document.getElementById('barProgressContainer').addEventListener('touchend', barSeekHandlers.onEnd);
```

**4e. Wire up FS controls and extend updatePlayIcons:**
```javascript
document.getElementById('fsCloseBtn').addEventListener('click', closeFullscreen);
document.getElementById('fsPlayBtn').addEventListener('click', () => widget.toggle());
document.getElementById('fsPrevBtn').addEventListener('click', () => widget.prev());
document.getElementById('fsNextBtn').addEventListener('click', () => { /* same logic as nextBtn */ });
document.getElementById('fsShuffleBtn').addEventListener('click', () => {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
    document.getElementById('fsShuffleBtn').classList.toggle('active', isShuffled);
    if (isShuffled && queue.length > 0) { shuffleArray(queue); renderQueue(); }
});
document.getElementById('expandBtn').addEventListener('click', openFullscreen);

// Extend updatePlayIcons() to include fullscreen play icon
// In the existing updatePlayIcons function, ADD:
//   fsPlayIcon.innerHTML = isPlaying ? pausePath : playPath;
// This ensures the fullscreen play/pause icon stays synced.
```

**4f. Wire syncFullscreenState into monkey-patched functions:**
```javascript
// In the existing monkey-patched updateCurrentTrack, ADD (guarded):
//   if (fsOpen) syncFullscreenState();
// In the existing monkey-patched updatePlayingState, ADD (guarded):
//   if (fsOpen) syncFullscreenState();
// This ensures fullscreen track name and play icon update when track changes.
```

**Update `PLAY_PROGRESS` handler to also update FS elements (using width, not scaleX):**
```javascript
// In PLAY_PROGRESS callback, add:
if (fsOpen) {
    fsProgressFill.style.width = percent + '%';  // width, NOT scaleX (seek handle)
    fsTimeNow.textContent = formatTime(e.currentPosition);
    fsTimeTotal.textContent = formatTime(duration);
}
```

**4g. Fullscreen z-index vs mini player:**
When fullscreen opens, mini player is hidden via `miniPlayer.classList.remove('visible')`. When fullscreen closes, mini player visibility is re-evaluated based on scroll position (see openFullscreen/closeFullscreen above).

**Acceptance Criteria:**
- Tapping expand button or swiping up on compact bar opens full-screen player
- Swiping up on mini player also opens full-screen player
- Full-screen shows: track name (large), progress with seek + times, shuffle/prev/play/next
- Swipe-down or close button dismisses with smooth transform transition
- Swiping down on the seek bar area does NOT trigger close (seek guard)
- touchmove on fullscreen uses `{ passive: false }` with conditional `e.preventDefault()`
- Android back button closes fullscreen (popstate listener)
- Progress bar syncs immediately on open via `widget.getPosition()`
- Body overflow locked via CSS class `body.fs-open`, not inline style
- Mini player hidden when fullscreen is open, restored on close
- `fsPlayIcon` included in `updatePlayIcons()` for consistent play/pause state
- `syncFullscreenState()` called from monkey-patched `updateCurrentTrack` and `updatePlayingState` (guarded by `if (fsOpen)`)
- All controls in full-screen work identically to compact bar controls
- Progress syncs between compact and full-screen views (scaleX for compact, width for fullscreen)
- Fullscreen seek uses `createSeekHandler()` with `useWidth=true` (not hand-waved)

---

### Phase 5: Swipe Gestures on Track Items
**File:** `index.html`
**Dependencies:** Phase 1

**New CSS:**
```css
/* Swipe gesture container - wrapper reveals action underneath */
.track-item-wrapper {
    position: relative;
    overflow: hidden;
}

.track-item-action {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
}

.track-item-action.queue-action {
    right: 0;
    background: var(--accent);
}

.track-item-action.remove-action {
    left: 0;
    background: var(--danger);
}

.track-item {
    position: relative;
    z-index: 1;
    background: var(--bg-card);
    transition: transform 0.2s ease;
    touch-action: pan-y;
}

/* Swipe feedback toast */
.swipe-toast {
    position: fixed;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 1rem);
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background: var(--accent);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 400;
    pointer-events: none;
}

.swipe-toast.visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}
```

**HTML: Update buildTrackItemHTML() to generate wrapper + action elements:**
The `buildTrackItemHTML()` function (see Phase 7) MUST generate a `.track-item-wrapper` containing both the `.track-item` and the `.track-item-action` reveal elements. The swipe JS translates the `.track-item` within the wrapper, revealing the action underneath.

```javascript
function buildTrackItemHTML(i) {
    const title = getTrackTitle(i);
    const dur = getTrackDuration(i);
    const isCurrentPlaying = i === currentIndex;
    const isInQueue = queue.includes(i);
    return `
        <div class="track-item-wrapper">
            <div class="track-item-action remove-action">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" transform="rotate(45 12 12)"/></svg>
                Remove
            </div>
            <div class="track-item-action queue-action">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Queue
            </div>
            <div class="track-item ${isCurrentPlaying ? 'playing' : ''} ${isInQueue ? 'in-queue' : ''}" data-index="${i}">
                <div class="track-number">
                    <span>${i + 1}</span>
                    <div class="playing-icon">
                        <div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div>
                    </div>
                </div>
                <div class="track-info">
                    <div class="track-title">${title}</div>
                    <div class="track-duration">${formatTime(dur)}</div>
                </div>
                <button class="add-to-queue ${isInQueue ? 'added' : ''}" data-index="${i}" aria-label="Add to queue">
                    <svg viewBox="0 0 24 24">${isInQueue ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' : '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>'}</svg>
                </button>
            </div>
        </div>`;
}
```

**JS: Swipe gesture handler (with click suppression):**
```javascript
// Swipe gesture state
let swipeStartX = 0;
let swipeStartY = 0;
let swipeTarget = null;
let swipeDirection = null; // 'left' | 'right' | null
let swipeOccurred = false; // Click suppression flag
const SWIPE_THRESHOLD = 60;

trackListEl.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.track-item');
    if (!item) return;
    swipeTarget = item;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeDirection = null;
    swipeOccurred = false; // Reset on new touch
}, { passive: true });

trackListEl.addEventListener('touchmove', (e) => {
    if (!swipeTarget) return;
    const deltaX = e.touches[0].clientX - swipeStartX;
    const deltaY = e.touches[0].clientY - swipeStartY;

    // Lock direction after 10px movement
    if (!swipeDirection && Math.abs(deltaX) > 10) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            swipeDirection = deltaX > 0 ? 'right' : 'left';
        } else {
            swipeTarget = null; // Vertical scroll, abort
            return;
        }
    }

    if (swipeDirection) {
        // Clamp to max 80px
        const clampedDelta = Math.max(-80, Math.min(80, deltaX));
        swipeTarget.style.transform = `translateX(${clampedDelta}px)`;
    }
}, { passive: true });

trackListEl.addEventListener('touchend', (e) => {
    if (!swipeTarget) return;

    const deltaX = e.changedTouches[0].clientX - swipeStartX;

    // Set click suppression flag if any meaningful horizontal movement occurred
    if (Math.abs(deltaX) > 10) {
        swipeOccurred = true;
    }

    if (!swipeDirection) {
        swipeTarget = null;
        return;
    }

    const index = parseInt(swipeTarget.dataset.index);

    // Only call renderTracks() inside the threshold branches, NOT on every touchend
    if (deltaX > SWIPE_THRESHOLD) {
        // Swipe right -> add to queue
        if (!queue.includes(index)) {
            queue.push(index);
            if (isShuffled) shuffleArray(queue);
            renderQueue();
            renderTracks(); // Only here
            showSwipeToast('Added to queue');
        }
    } else if (deltaX < -SWIPE_THRESHOLD) {
        // Swipe left -> remove from queue (if in queue)
        const pos = queue.indexOf(index);
        if (pos > -1) {
            queue.splice(pos, 1);
            renderQueue();
            renderTracks(); // Only here
            showSwipeToast('Removed from queue');
        }
    }

    // Always reset transform (snap back if threshold not met)
    swipeTarget.style.transform = '';
    swipeTarget = null;
});

function showSwipeToast(message) {
    let toast = document.getElementById('swipeToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'swipeToast';
        toast.className = 'swipe-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('visible'), 1500);
}
```

**Acceptance Criteria:**
- `buildTrackItemHTML()` generates `.track-item-wrapper` containing action elements and `.track-item`
- Swipe translates `.track-item` within wrapper, revealing action underneath
- Swipe right on any track item adds it to queue with visual toast "Added to queue"
- Swipe left on a queued track removes it with toast "Removed from queue"
- Swipe detection does not interfere with vertical scrolling
- Swipe has 60px threshold to prevent accidental triggers
- `renderTracks()` only called inside threshold branches, NOT on every touchend
- Click suppression: `swipeOccurred = true` set in touchend when `Math.abs(deltaX) > 10`, checked and skipped in click delegation handler, reset in next touchstart

---

### Phase 6: Queue UX Improvements
**File:** `index.html`
**Dependencies:** Phase 1, Phase 5

**CSS Changes to queue section (lines 332-435):**
```css
/* Updated Queue Section */
.queue-section {
    margin: 0 1rem 1rem;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow: hidden;
}

.queue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    min-height: 48px;        /* Touch target */
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    user-select: none;
}

/* Collapse chevron */
.queue-header::after {
    content: '';
    width: 20px;
    height: 20px;
    background: currentColor;
    -webkit-mask: url("data:image/svg+xml,...chevron-down...");
    transition: transform 0.2s ease;
}

.queue-section.collapsed .queue-header::after {
    transform: rotate(-90deg);
}

.queue-section.collapsed .queue-list {
    max-height: 0;
    overflow: hidden;
    border: none;
}

.queue-clear {
    min-width: 44px;
    min-height: 44px;        /* Touch target */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: var(--text-dim);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
}

.queue-clear:active {
    background: var(--bg-active);
    color: var(--danger);
}

.queue-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    min-height: 48px;        /* Touch target */
    border-bottom: 1px solid var(--border);
    position: relative;
    touch-action: pan-y;
}

.queue-remove {
    width: 44px;             /* Touch target */
    height: 44px;            /* Touch target */
    border: none;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.queue-remove:active {
    background: rgba(239, 68, 68, 0.15);
    color: var(--danger);
}
```

**JS Changes:**
```javascript
// Queue collapse toggle
const queueHeader = document.getElementById('queueHeader');
const queueSection = document.getElementById('queueSection');

queueHeader.addEventListener('click', (e) => {
    if (e.target.closest('.queue-clear')) return;
    queueSection.classList.toggle('collapsed');
});
```

Add swipe-to-remove on queue items (same pattern as track swipe, but left-swipe only, targeting `.queue-item`).

**Acceptance Criteria:**
- Queue header tappable to collapse/expand with chevron animation
- Queue clear button has 44x44px touch target
- Queue remove buttons have 44x44px touch targets
- Queue items support swipe-left to remove
- All existing queue functionality preserved (add, remove, clear, play-from-queue, shuffle)

---

### Phase 7: Performance Optimizations & Helper Functions
**File:** `index.html`
**Dependencies:** Phase 2, Phase 5 (relies on new HTML structure)

**7a. Reusable helper functions (create BEFORE wiring in Phase 4):**

```javascript
// Centralized progress bar sync - call from PLAY_PROGRESS handler
function syncAllProgressBars(percent) {
    // Compact bar: scaleX (no pseudo-elements)
    progressFill.style.transform = 'scaleX(' + percent / 100 + ')';
    // Mini player: scaleX (no pseudo-elements)
    miniProgressFill.style.transform = 'scaleX(' + percent / 100 + ')';
    // Fullscreen: width percentage (has ::after seek handle)
    if (fsOpen) {
        fsProgressFill.style.width = percent + '%';
    }
}

// Centralized play icon sync - call from updatePlayIcons()
function syncAllPlayIcons(isPlaying) {
    const path = isPlaying ? pausePath : playPath;
    playIcon.innerHTML = path;
    miniPlayIcon.innerHTML = path;
    fsPlayIcon.innerHTML = path;  // Always sync fullscreen icon
}

// Reusable seek handler factory - parameterized for compact bar and fullscreen bar
function createSeekHandler(progressBarEl, progressFillEl, useWidth) {
    let seeking = false;

    function getPercent(e) {
        const rect = progressBarEl.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e.changedTouches[0];
        const x = touch.clientX - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
    }

    function updateFill(percent) {
        if (useWidth) {
            progressFillEl.style.width = percent + '%';
        } else {
            progressFillEl.style.transform = 'scaleX(' + percent / 100 + ')';
        }
    }

    return {
        onStart(e) {
            seeking = true;
            const percent = getPercent(e);
            updateFill(percent);
        },
        onMove(e) {
            if (!seeking) return;
            e.preventDefault(); // Prevent scroll while seeking
            const percent = getPercent(e);
            updateFill(percent);
        },
        onEnd(e) {
            if (!seeking) return;
            seeking = false;
            const percent = getPercent(e);
            updateFill(percent);
            // Seek the widget
            if (duration > 0) {
                widget.seekTo(duration * (percent / 100));
            }
        }
    };
}
```

**7b. Targeted DOM Updates (replace renderTracks innerHTML):**

Replace `renderTracks()` (lines 1067-1119) with:
```javascript
function renderTracks() {
    const count = trackCount || tracks.length;
    if (count === 0) {
        trackListEl.innerHTML = '<div class="loading">...</div>';
        return;
    }

    // Initial render: build once
    if (!trackListEl.dataset.initialized) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += buildTrackItemHTML(i);
        }
        trackListEl.innerHTML = html;
        trackListEl.dataset.initialized = 'true';
    }

    // Subsequent updates: only update changed items
    const wrappers = trackListEl.querySelectorAll('.track-item-wrapper');
    wrappers.forEach((wrapper) => {
        const item = wrapper.querySelector('.track-item');
        if (!item) return;
        const index = parseInt(item.dataset.index);
        const isCurrentPlaying = index === currentIndex;
        const isInQueue = queue.includes(index);

        // Update classes only if changed
        item.classList.toggle('playing', isCurrentPlaying);
        item.classList.toggle('in-queue', isInQueue);

        // Update add-to-queue button icon
        const btn = item.querySelector('.add-to-queue');
        if (btn) {
            const wasAdded = btn.classList.contains('added');
            if (wasAdded !== isInQueue) {
                btn.classList.toggle('added', isInQueue);
                btn.querySelector('svg').innerHTML = isInQueue
                    ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
                    : '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>';
            }
        }

        // Update title/duration if cache changed
        const titleEl = item.querySelector('.track-title');
        const newTitle = getTrackTitle(index);
        if (titleEl && titleEl.textContent !== newTitle) {
            titleEl.textContent = newTitle;
        }

        const durEl = item.querySelector('.track-duration');
        const newDur = formatTime(getTrackDuration(index));
        if (durEl && durEl.textContent !== newDur) {
            durEl.textContent = newDur;
        }
    });
}

// buildTrackItemHTML is defined in Phase 5 (includes wrapper + action elements)
```

**7c. Event Delegation with click suppression (replace per-item listeners):**

Remove the `document.querySelectorAll('.track-item').forEach(...)` and `document.querySelectorAll('.add-to-queue').forEach(...)` blocks from old `renderTracks()`. Add single delegated handler:
```javascript
// Event delegation on track list (one handler) with swipe click suppression
trackListEl.addEventListener('click', (e) => {
    // Click suppression after swipe gesture
    if (swipeOccurred) {
        swipeOccurred = false;
        return;
    }

    const queueBtn = e.target.closest('.add-to-queue');
    if (queueBtn) {
        e.stopPropagation();
        const index = parseInt(queueBtn.dataset.index);
        toggleQueue(index);
        return;
    }
    const trackItem = e.target.closest('.track-item');
    if (trackItem) {
        const index = parseInt(trackItem.dataset.index);
        playTrack(index);
    }
});

// Same for queue list
queueList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.queue-remove');
    if (removeBtn) {
        e.stopPropagation();
        const pos = parseInt(removeBtn.dataset.queuePos);
        queue.splice(pos, 1);
        renderQueue();
        renderTracks();
        return;
    }
    const queueItem = e.target.closest('.queue-item');
    if (queueItem) {
        const trackIndex = parseInt(queueItem.dataset.index);
        const queuePos = parseInt(queueItem.dataset.queuePos);
        queue.splice(queuePos, 1);
        playTrack(trackIndex);
    }
});
```

**7d. GPU-Accelerated Animations**

EQ bars (lines 148-176): change from `height` animation to `transform: scaleY`:
```css
.eq-bar {
    width: 3px;
    height: 12px;           /* Fixed base height */
    background: var(--accent);
    border-radius: 1px;
    transform-origin: bottom;
    will-change: transform;
}

.playing .eq-bar {
    animation: eq 0.5s ease-in-out infinite alternate;
}

.eq-bar:nth-child(1) { transform: scaleY(0.4); animation-delay: 0s; }
.eq-bar:nth-child(2) { transform: scaleY(0.7); animation-delay: 0.1s; }
.eq-bar:nth-child(3) { transform: scaleY(0.5); animation-delay: 0.2s; }
.eq-bar:nth-child(4) { transform: scaleY(0.9); animation-delay: 0.15s; }

@keyframes eq {
    from { transform: scaleY(0.2); }
    to { transform: scaleY(1); }
}
```

Progress bar: already handled in Phase 3 (scaleX for compact/mini, width for fullscreen).

**7e. IntersectionObserver for Mini Player**

Replace scroll-based `checkMiniPlayer()` (line 1274-1278) and the scroll listener (line 1459):
```javascript
// IntersectionObserver for mini player visibility
const miniPlayerObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    // Only show mini player if bar is off-screen AND fullscreen is NOT open
    const shouldShow = !entry.isIntersecting && currentIndex >= 0 && !fsOpen;
    miniPlayer.classList.toggle('visible', shouldShow);
}, { threshold: 0 });

// Observe the now-playing bar
miniPlayerObserver.observe(document.getElementById('nowPlayingBar'));

// Remove: window.addEventListener('scroll', checkMiniPlayer, { passive: true });
// Remove: function checkMiniPlayer() { ... }
```

**Acceptance Criteria:**
- `syncAllProgressBars(percent)` centralizes all progress bar updates (scaleX for compact/mini, width for fullscreen)
- `syncAllPlayIcons(playing)` centralizes all play icon updates (compact, mini, fullscreen)
- `createSeekHandler(barEl, fillEl, useWidth)` is reusable for both compact and fullscreen seek
- renderTracks() does NOT call innerHTML on subsequent updates (only on first render)
- renderTracks() iterates `.track-item-wrapper` elements (not `.track-item` directly as children)
- Track list and queue list use event delegation (1 click handler each, not per-item)
- Click delegation handler checks `swipeOccurred` flag and skips if true
- EQ bar animation uses transform:scaleY (verify: no "height" in eq keyframes)
- Progress bar uses transform:scaleX for compact/mini (verify: no "width" changes)
- Fullscreen progress uses width (verify: seek handle stays circular)
- Mini player uses IntersectionObserver with `!fsOpen` guard
- No functional regressions (play, pause, next, prev, queue, shuffle all work)

---

### Phase 8: Touch Targets & Typography
**File:** `index.html`
**Dependencies:** Phase 1

**Touch target fixes (all elements must be >= 44x44px):**

| Element | Current Size | Fix |
|---------|-------------|-----|
| `.add-to-queue` (line 534) | 32x32px | Change to `width: 44px; height: 44px;` |
| `.queue-remove` (line 419) | 28x28px | Change to `width: 44px; height: 44px;` |
| `.mini-expand` (line 632) | 36x36px | Change to `width: 44px; height: 44px;` |
| `.mini-play-btn` (line 586) | 40x40px | Change to `width: 44px; height: 44px;` |
| `.queue-clear` (line 366) | padding-based | Add `min-height: 44px; min-width: 44px;` |

**Typography hierarchy:**
```css
/* Track name in compact bar - most prominent */
.now-playing-bar-track {
    font-size: 0.95rem;
    font-weight: 600;
}

/* Track name in full-screen - largest */
.fs-track-name {
    font-size: 1.5rem;
    font-weight: 700;
}

/* Track title in list - readable */
.track-title {
    font-size: 0.9rem;
    font-weight: 500;
}

/* Section titles - subdued */
.section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}
```

**Bottom spacer fix (line 687):**
```css
.bottom-spacer {
    height: calc(80px + env(safe-area-inset-bottom, 0px));
}
```

**Acceptance Criteria:**
- All interactive elements measure >= 44x44px (verifiable via DevTools)
- Typography hierarchy: fs-track-name (1.5rem/700) > bar-track (0.95rem/600) > track-title (0.9rem/500) > section-title (0.75rem/600)
- `--text-dim` (#9ca3af) readable against all backgrounds
- Bottom spacer accounts for safe-area-inset

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **SoundCloud Widget API breakage** during refactor | Medium | High | Phase 2 preserves all widget event bindings; test play/pause/seek after each phase |
| **Seek handle distortion** if scaleX used on fullscreen progress | High (if not split) | Medium | Phase 3 explicitly splits: scaleX for compact/mini (no pseudo-elements), width for fullscreen (has ::after handle) |
| **Swipe-down triggers during seek** in fullscreen | High (if no guard) | Medium | Phase 4 adds `e.target.closest('.fs-progress-bar')` guard in touchstart |
| **Ghost clicks after swipe** on track items | High (if no suppression) | Low | Phase 5 sets `swipeOccurred` flag, Phase 7 checks it in click delegation |
| **Page scroll behind fullscreen overlay** | Medium | Low | Phase 4 uses `{ passive: false }` on touchmove with conditional `e.preventDefault()` |
| **Fullscreen state desync** (wrong track name, wrong play icon) | Medium | Medium | Phase 4 wires `syncFullscreenState()` into monkey-patched `updateCurrentTrack`/`updatePlayingState`; Phase 7 creates `syncAllPlayIcons()` |
| **Mini player visible behind fullscreen** | Low | Low | Phase 4 hides mini player on open, re-evaluates on close; Phase 7 IntersectionObserver includes `!fsOpen` guard |
| **Android back button doesn't close fullscreen** | Medium | Low | Phase 4 adds `history.pushState` on open and `popstate` listener |
| **renderTracks() called excessively** on swipe | Medium | Medium | Phase 5 only calls `renderTracks()` inside threshold branches |
| **168-item innerHTML rebuild** on every state change | Already present | High | Phase 7 initial-render-only innerHTML with subsequent targeted class/text updates |

---

## Summary of Changes by File Section

| Section | Lines (approx) | Changes |
|---------|----------------|---------|
| CSS Variables | 18-29 | Purple color system, better text-dim |
| Header CSS | 42-76 | REMOVE (merged into now-playing bar) |
| Now Playing Card CSS | 79-185 | REPLACE with compact bar CSS + `body.fs-open` |
| Progress Bar CSS | 187-275 | REPLACE with thin 4px bar CSS (scaleX for compact/mini) |
| Controls CSS | 277-330 | Adapt for bar-control-btn style |
| Queue CSS | 332-435 | Update touch targets, add collapse |
| Track List CSS | 437-561 | Add swipe wrapper/action styles, fix touch targets |
| Mini Player CSS | 563-648 | Fix touch targets |
| Bottom Spacer CSS | 687-689 | Safe-area calc |
| NEW: Full-screen player CSS | -- | ~150 lines new CSS (width-based progress fill) |
| NEW: Swipe gesture CSS | -- | ~40 lines new CSS (wrapper + action) |
| Header HTML | 694-702 | REMOVE (merged) |
| Now Playing Card HTML | 704-755 | REPLACE with compact bar |
| NEW: Full-screen player HTML | -- | ~40 lines new HTML |
| buildTrackItemHTML() JS | -- | Generate wrapper + action elements + track-item |
| renderTracks() JS | 1067-1119 | Targeted DOM updates via wrapper iteration + event delegation |
| renderQueue() JS | 1122-1160 | Event delegation |
| checkMiniPlayer() JS | 1274-1278 | Replace with IntersectionObserver (with !fsOpen guard) |
| EQ animation CSS | 148-176 | scaleY instead of height |
| Progress update JS | 1318-1326 | syncAllProgressBars() helper |
| updatePlayIcons() JS | -- | syncAllPlayIcons() helper (includes fsPlayIcon) |
| NEW: Helper functions JS | -- | syncAllProgressBars(), syncAllPlayIcons(), createSeekHandler() |
| NEW: Swipe gesture JS | -- | ~70 lines (with click suppression) |
| NEW: Full-screen player JS | -- | ~100 lines (seek guard, passive:false, back button, mini player hide) |
| NEW: Mini player swipe-up JS | -- | ~15 lines (reusable addSwipeUpToOpen) |
| NEW: Queue collapse JS | -- | ~5 lines |
| Seek JS | 1389-1456 | Refactored to use createSeekHandler() for both bars |
| monkey-patched functions | -- | Add guarded syncFullscreenState() calls |

---

## RALPLAN-DR Summary

### Principles
1. **Preserve functionality first** - Every existing feature (SC Widget, Media Session, queue, shuffle) must work identically after the redesign
2. **Mobile-first, single-file** - All changes stay within index.html; optimize for touch interaction
3. **Performance by default** - Every animation uses GPU-composited properties (transform, opacity); DOM updates are minimal and targeted
4. **Progressive enhancement of UX** - Each phase can be built and tested independently without breaking existing functionality
5. **Touch-native interactions** - Every interactive element >= 44px; swipe gestures complement tap actions (never replace)

### Decision Drivers (top 3)
1. **Single-file constraint** - Cannot split into components; must manage complexity within one file via clear CSS/JS sections
2. **SoundCloud Widget API coupling** - Widget controls playback; UI is a facade over the iframe API. Must not break the widget lifecycle or event bindings
3. **168-item list performance** - With ~1000+ DOM nodes, innerHTML rebuilds and per-item event listeners are the primary bottleneck

### Viable Options

**Option A: Phased In-Place Refactor (RECOMMENDED)**
- Modify the existing file section-by-section in 8 ordered phases
- Each phase is independently testable
- Pros: Lower risk, easier to verify, rollback per phase
- Cons: Requires careful ordering, intermediate states may look inconsistent

**Option B: Full Rewrite**
- Rewrite the entire index.html from scratch using the spec
- Pros: Clean slate, no legacy CSS/JS cruft
- Cons: HIGH risk of breaking SoundCloud Widget integration, Media Session API, seek behavior, and edge cases in queue management. The existing codebase has nuanced workarounds (silent audio trick, seek-on-release pattern, monkey-patched functions for Media Session) that are easy to lose in a rewrite.

### Recommended Option
**Option A: Phased In-Place Refactor**

The existing codebase has battle-tested integrations with the SoundCloud Widget API and Media Session API that include non-obvious workarounds (silent audio for lock screen, seek-on-release for mobile, monkey-patched updateCurrentTrack/updatePlayingState). A phased approach preserves these while transforming the UI. The 8 phases have clear acceptance criteria and can each be verified before proceeding.

### ADR

**Decision:** Phased in-place refactor of index.html in 8 ordered phases.

**Drivers:** Single-file constraint, SC Widget API coupling, performance requirements for 168-item list.

**Alternatives considered:** Full rewrite (rejected due to high risk of breaking non-obvious API integrations).

**Why chosen:** Preserves existing workarounds while enabling incremental verification. Each phase has clear acceptance criteria.

**Consequences:** Intermediate states during development may look inconsistent. Phase ordering must be respected (1 before 2-8, 2 before 3-4, etc.).

**Follow-ups:** After all phases complete, do a final cleanup pass to remove any orphaned CSS rules from the old design. Test on iOS Safari and Chrome Android for safe-area-inset behavior.

---

## Success Criteria (Final)
1. All 10 acceptance criteria groups from the spec are met
2. SoundCloud Widget playback works (play, pause, seek, next, prev, skip-to-track)
3. Media Session API works (lock screen controls, metadata, seek)
4. Queue works (add, remove, clear, play-from-queue, shuffle)
5. No JavaScript errors in console
6. All touch targets >= 44px (verified via DevTools)
7. Compact/mini progress bar uses transform:scaleX (verified via DevTools computed styles)
8. Fullscreen progress bar uses width percentage (seek handle stays circular)
9. EQ bars use transform:scaleY (verified via animation inspector)
10. No scroll event listener for mini player (IntersectionObserver only)
11. renderTracks() does not rebuild innerHTML after initial render
12. Swipe-up on mini player opens fullscreen
13. Swipe-down on fullscreen does NOT trigger when touching seek bar
14. Android back button closes fullscreen
15. No ghost clicks after swipe gestures on track items
