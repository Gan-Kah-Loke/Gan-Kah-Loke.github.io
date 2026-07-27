// ─────────────────────────────────────────────────────────────
//  ARTWORKS PANEL — renders the in-page Artworks tab/grid
//  Reuses the ARTWORKS catalogue + FOLDER mapping from
//  artworks-data.js. Include that script BEFORE this one.
// ─────────────────────────────────────────────────────────────
(function () {
    const FOLDER = { 'pixel-art': 'art/pixelart/', 'traditional': 'art/traditional/' };
    const grid = document.getElementById('artworksGrid');
    const wrap = document.querySelector('.artworks-grid-wrap');
    const tabs = document.querySelectorAll('.artworks-tab');
    const lightbox = document.getElementById('artworkLightbox');
    const lightboxImg = document.getElementById('artworkLightboxImg');
    const lightboxTitle = document.getElementById('artworkLightboxTitle');
    const lightboxClose = document.getElementById('artworkLightboxClose');
    const lightboxBackdrop = document.getElementById('artworkLightboxBackdrop');
    if (!grid || typeof ARTWORKS === 'undefined') return;

    // ── Fade + slide-in reveal ────────────────────────────────
    const STAGGER_MS = 45;   // delay between each card's animation start
    const ANIM_MS = 420;     // must match the CSS transition duration

    let renderToken = 0; // bumps on tab switch / panel re-entry to cancel stale animations

    function revealIn(card, index, token) {
        setTimeout(() => {
            if (token !== renderToken) return;
            requestAnimationFrame(() => {
                card.classList.add('is-visible');
            });
        }, index * STAGGER_MS);
    }

    function fadeOut(cards) {
        if (!cards.length) return Promise.resolve();
        cards.forEach(card => card.classList.remove('is-visible'));
        return new Promise(resolve => setTimeout(resolve, ANIM_MS));
    }

    // ── Grid rendering ───────────────────────────────────────
    function buildCard(art) {
        const src = FOLDER[art.category] + art.file;
        const card = document.createElement('div');
        card.className = 'artwork-card';
        const img = document.createElement('img');
        img.src = src;
        img.alt = art.title;
        img.loading = 'lazy';
        img.style.objectPosition = art.pos || 'center center';
        img.style.setProperty('--art-zoom', art.zoom || 1);
        card.appendChild(img);
        const overlay = document.createElement('div');
        overlay.className = 'artwork-overlay';
        overlay.innerHTML = `<span class="artwork-title">${art.title}</span>`;
        card.appendChild(overlay);
        card.addEventListener('click', () => openLightbox(src, art.title));
        return card;
    }

    async function render(category) {
        const token = ++renderToken;
        const existingCards = Array.from(grid.children);

        if (existingCards.length) {
            await fadeOut(existingCards);
            if (token !== renderToken) return; // a newer switch happened mid-animation
        }

        grid.innerHTML = '';
        const list = ARTWORKS
            .filter(a => a.category === category)
            .sort((a, b) => b.dateSort.localeCompare(a.dateSort));

        list.forEach((art, i) => {
            const card = buildCard(art);
            grid.appendChild(card);
            revealIn(card, i, token);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            render(tab.dataset.category);
        });
    });

    // ── Keep scrolling inside the box from triggering page/panel navigation ──
    if (wrap) {
        wrap.addEventListener('wheel', e => {
            e.stopPropagation();
        }, { passive: true });
        wrap.addEventListener('touchmove', e => {
            e.stopPropagation();
        }, { passive: true });
    }

    // ── Lightbox ──────────────────────────────────────────────
    const ZOOM_STEP = 2.5;      // zoom level used by click-toggle
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 4;
    const WHEEL_SENSITIVITY = 0.0015;
    const DRAG_THRESHOLD = 6;   // px — below this, a pointerdown+up counts as a click

    let zoom = 1;
    let tx = 0, ty = 0;         // pan offset in screen px
    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0, dragStartY = 0;
    let dragOriginTx = 0, dragOriginTy = 0;

    if (lightboxImg) {
        lightboxImg.draggable = false;
        lightboxImg.addEventListener('dragstart', e => e.preventDefault());
    }

    function applyTransform() {
        if (!lightboxImg) return;
        lightboxImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
        lightboxImg.style.cursor = zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
    }

    function clampPan() {
        const rect = lightboxImg.getBoundingClientRect();
        const overflowX = Math.max(0, (rect.width * zoom - rect.width) / 2);
        const overflowY = Math.max(0, (rect.height * zoom - rect.height) / 2);
        tx = Math.min(overflowX, Math.max(-overflowX, tx));
        ty = Math.min(overflowY, Math.max(-overflowY, ty));
    }

    function resetZoom() {
        zoom = 1;
        tx = 0;
        ty = 0;
        applyTransform();
    }

    // Zoom to `newZoom`, keeping the point under (clientX, clientY) visually fixed.
    function zoomAt(clientX, clientY, newZoom) {
        const rect = lightboxImg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const ox = (clientX - centerX - tx) / zoom;
        const oy = (clientY - centerY - ty) / zoom;

        newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
        tx = (clientX - centerX) - newZoom * ox;
        ty = (clientY - centerY) - newZoom * oy;
        zoom = newZoom;

        clampPan();
        applyTransform();
    }

    function openLightbox(src, title) {
        if (!lightbox) return;
        lightboxImg.src = src;
        lightboxImg.alt = title;
        lightboxTitle.textContent = title || '';
        resetZoom();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        resetZoom();
    }
    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxBackdrop?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox();
    });

    // Wheel: zoom in/out anchored at the cursor. Stops propagation so
    // the panel-scroll handler never sees the event while open.
    lightbox?.addEventListener('wheel', e => {
        if (!lightbox.classList.contains('open')) return;
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY * WHEEL_SENSITIVITY;
        zoomAt(e.clientX, e.clientY, zoom + delta * zoom);
    }, { passive: false });

    // Click: toggle between 1x and ZOOM_STEP, anchored at the click point.
    // Suppressed if the pointer actually dragged.
    lightboxImg?.addEventListener('click', e => {
        if (dragMoved) { dragMoved = false; return; }
        if (zoom > 1) {
            resetZoom();
        } else {
            zoomAt(e.clientX, e.clientY, ZOOM_STEP);
        }
    });

    // Drag-to-pan (mouse + touch + pen via Pointer Events).
    lightboxImg?.addEventListener('pointerdown', e => {
        if (zoom <= 1) return;
        e.preventDefault();
        dragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragOriginTx = tx;
        dragOriginTy = ty;
        lightboxImg.setPointerCapture(e.pointerId);
        applyTransform();
    });
    lightboxImg?.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (!dragMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD) dragMoved = true;
        if (!dragMoved) return;
        tx = dragOriginTx + dx;
        ty = dragOriginTy + dy;
        clampPan();
        applyTransform();
    });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        applyTransform();
        if (dragMoved) setTimeout(() => { dragMoved = false; }, 0);
    }
    lightboxImg?.addEventListener('pointerup', endDrag);
    lightboxImg?.addEventListener('pointercancel', endDrag);

    // ── Re-trigger the reveal whenever the Artworks panel
    //    becomes the active one (e.g. scrolled/navigated to), and
    //    reset the grid's scroll position when it's scrolled away from ──
    const artworksPanel = document.getElementById('artworks');
    if (artworksPanel) {
        const panelObserver = new MutationObserver(() => {
            if (artworksPanel.classList.contains('panel-active')) {
                const activeTab = document.querySelector('.artworks-tab.active');
                const category = activeTab ? activeTab.dataset.category : 'pixel-art';
                render(category);
            } else if (wrap) {
                wrap.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        panelObserver.observe(artworksPanel, { attributes: true, attributeFilter: ['class'] });
    }

    render('pixel-art');
})();