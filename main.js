(function () {
    'use strict';

    const navbar = document.querySelector('.navbar');
    const burger = document.getElementById('navBurger');
    const content = document.querySelector('.page-content');
    const breakWord = document.getElementById('breakWord');
    const isFileMode = window.location.protocol === 'file:';
    const fadeTarget = content || document.body;

    /* ── Font Loading ─────────────────────────────────────── */

    document.documentElement.classList.add('fonts-loading');
    document.fonts.ready.then(() => {
        document.documentElement.classList.replace('fonts-loading', 'fonts-loaded');
    });

    /* ── Scroll Restoration ───────────────────────────────── */

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('load', () => window.scrollTo(0, 0));

    /* ── Navbar Burger ────────────────────────────────────── */

    if (burger && navbar) {
        burger.addEventListener('click', () => navbar.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(link =>
            link.addEventListener('click', () => navbar.classList.remove('active'))
        );
    }

    /* ── Page Transitions ─────────────────────────────────── */

    if (fadeTarget) {
        fadeTarget.style.opacity    = '0';
        fadeTarget.style.transition = 'opacity 0.45s ease';

        window.addEventListener('load', () => {
            requestAnimationFrame(() => {
                navbar?.classList.remove('nav-exit');
                fadeTarget.style.opacity = '1';
            });
        });

        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (
                !href ||
                href.startsWith('#') ||
                href.startsWith('javascript') ||
                a.target === '_blank' ||
                a.hasAttribute('download')
            ) return;

            a.addEventListener('click', e => {
                if (isFileMode) return;
                const url      = new URL(a.href, window.location.href);
                const samePage = url.pathname === window.location.pathname &&
                                 url.hash     === window.location.hash;
                if (samePage) return;

                e.preventDefault();
                navbar?.classList.add('nav-exit');
                fadeTarget.style.opacity = '0';
                setTimeout(() => { window.location.href = a.href; }, 450);
            });
        });
    }

    /* ── Panel Navigation (Game Screen System) ────────────── */

    const panels = Array.from(document.querySelectorAll('.panel'));
    const panelPrev = document.getElementById('panelPrev');
    const panelNext = document.getElementById('panelNext');
    const panelDots = document.querySelectorAll('.panel-dot');
    const sideNavLinks = document.querySelectorAll('.side-nav-btn');
    const panelTriggers = document.querySelectorAll('[data-panel]');

    let currentPanel = 0;
    const totalPanels = panels.length;

    const panelPageLabel = document.getElementById('panelPageLabel');
    const panelLabels = { 1: 'About', 2: 'Projects' };

    function renderPanels() {
        panels.forEach(panel => {
            const idx = parseInt(panel.dataset.panelIndex, 10);
            const offset = (idx - currentPanel) * 100;
            panel.style.transform = `translateX(${offset}%)`;
            panel.style.opacity = idx === currentPanel ? '1' : '0';
            panel.classList.toggle('panel-active', idx === currentPanel);
            panel.classList.toggle('in-view', idx === currentPanel);
        });

        panelDots.forEach(dot => {
            dot.classList.toggle('active', parseInt(dot.dataset.panel, 10) === currentPanel);
        });

        if (panelPageLabel) {
            const label = panelLabels[currentPanel];
            panelPageLabel.textContent = label || '';
            panelPageLabel.classList.toggle('visible', Boolean(label));
        }

        sideNavLinks.forEach(link => {
            link.classList.toggle('active', parseInt(link.dataset.panel, 10) === currentPanel);
        });

        if (panelPrev) panelPrev.disabled = currentPanel === 0;
        if (panelNext) panelNext.disabled = currentPanel === totalPanels - 1;
    }

    function goToPanel(index) {
        currentPanel = Math.max(0, Math.min(totalPanels - 1, index));
        renderPanels();
    }

    if (panels.length) {
        renderPanels();

        if (panelPrev) panelPrev.addEventListener('click', () => goToPanel(currentPanel - 1));
        if (panelNext) panelNext.addEventListener('click', () => goToPanel(currentPanel + 1));

        panelTriggers.forEach(el => {
            const target = el.dataset.panel;
            if (target === undefined) return;
            el.addEventListener('click', e => {
                e.preventDefault();
                goToPanel(parseInt(target, 10));
            });
        });

        // Keyboard navigation
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight') goToPanel(currentPanel + 1);
            if (e.key === 'ArrowLeft') goToPanel(currentPanel - 1);
        });

        // Mouse wheel / trackpad navigation
        let wheelLock = false;

        window.addEventListener('wheel', e => {
            if (e.target.closest('.about-timeline-scroll')) return; // let the timeline scroll natively

            if (wheelLock) return;

            // Ignore tiny trackpad movements
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY)
                ? e.deltaX
                : e.deltaY;

            if (Math.abs(delta) < 10) return;

            wheelLock = true;
            goToPanel(currentPanel + (delta > 0 ? 1 : -1));

            setTimeout(() => {
                wheelLock = false;
            }, 700);
        }, { passive: true });
    }

    /* ── Avatar Flip ──────────────────────────────────────── */

    const avatarFlip = document.getElementById('avatarFlip');
    if (avatarFlip) {
        avatarFlip.addEventListener('click', () => {
            avatarFlip.classList.toggle('flipped');
        });
    }

    /* ── FAQ Accordion (event-delegated) ─────────────────── */

    document.addEventListener('click', e => {
        const trigger = e.target.closest('.faq-trigger');
        if (!trigger) return;

        const group = trigger.closest('.faq-group');
        const body = group?.querySelector('.faq-body');
        const container = group?.closest('.faq-right');
        if (!body || !container) return;

        const isOpen = group.classList.contains('faq-open');

        // Close all groups in this accordion first
        container.querySelectorAll('.faq-group.faq-open').forEach(openGroup => {
            openGroup.classList.remove('faq-open');
            openGroup.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
            const openBody = openGroup.querySelector('.faq-body');
            if (openBody) openBody.style.maxHeight = '0px';
        });

        // Reopen the clicked one only if it wasn't already open
        if (!isOpen) {
            group.classList.add('faq-open');
            trigger.setAttribute('aria-expanded', 'true');
            body.style.maxHeight = body.scrollHeight + 'px';
        }
    });

    window.addEventListener('resize', () => {
        document.querySelectorAll('.faq-group.faq-open .faq-body').forEach(body => {
            body.style.maxHeight = body.scrollHeight + 'px';
        });
    });

    /* ── About "More About Me" Cycle Button ─────────────── */
    const aboutFlipGrid = document.getElementById('aboutFlipGrid');
    const aboutCycleBtn = document.getElementById('aboutCycleBtn');
    const aboutTimelineOverlay = document.getElementById('aboutTimelineOverlay');
    const aboutTimelineScroll = document.getElementById('aboutTimelineScroll');

    if (aboutFlipGrid && aboutCycleBtn) {
        const segs = aboutCycleBtn.querySelectorAll('.about-cycle-seg');
        const label = aboutCycleBtn.querySelector('.about-cycle-label');
        // Labels describe what's currently showing, not the next action
        const labels = ['About Me →', 'Biography →', 'Experience →', 'QA →'];

        function syncAboutFlipHeights() {
            aboutFlipGrid.querySelectorAll('.about-flip-col').forEach(col => {
                const inner = col.querySelector('.about-flip-inner');
                const front = col.querySelector('.about-flip-front');
                const back = col.querySelector('.about-flip-back');
                if (!inner || !front || !back) return;
                inner.style.height = 'auto'; // reset first, so we measure natural content height
                const h = Math.max(front.scrollHeight, back.scrollHeight);
                inner.style.height = h + 'px';
            });
        }
        syncAboutFlipHeights();
        document.fonts.ready.then(syncAboutFlipHeights);
        window.addEventListener('resize', syncAboutFlipHeights);

        function setupDragScrollBox(scrollEl, overlayEl) {
            if (!scrollEl) return null;

            function updateShadows() {
                if (!overlayEl) return;
                const hasTop = scrollEl.scrollTop > 2;
                const hasBottom = scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 2;
                overlayEl.classList.toggle('has-scroll-top', hasTop);
                overlayEl.classList.toggle('has-scroll-bottom', hasBottom);

                const isScrollable = scrollEl.scrollHeight > scrollEl.clientHeight + 2;
                scrollEl.classList.toggle('is-scrollable', isScrollable);
            }

            scrollEl.addEventListener('scroll', updateShadows, { passive: true });
            window.addEventListener('resize', updateShadows);

            let isDown = false;
            let hasDragged = false;
            let startY = 0;
            let startScrollTop = 0;

            scrollEl.addEventListener('mousedown', e => {
                if (e.target.closest('a, button')) return; // don't intercept real controls at all
                isDown = true;
                hasDragged = false;
                startY = e.pageY;
                startScrollTop = scrollEl.scrollTop;
                scrollEl.classList.add('dragging');
            });

            window.addEventListener('mousemove', e => {
                if (!isDown) return;
                const dy = e.pageY - startY;
                if (Math.abs(dy) > 5) hasDragged = true;
                scrollEl.scrollTop = startScrollTop - dy;
            });

            window.addEventListener('mouseup', () => {
                if (!isDown) return;
                isDown = false;
                scrollEl.classList.remove('dragging');
            });

            return updateShadows;
        }

        const updateTimelineShadows = setupDragScrollBox(aboutTimelineScroll, aboutTimelineOverlay);
        const aboutFaqScroll = document.getElementById('aboutFaqScroll');
        const aboutFaqOverlay = document.getElementById('aboutFaqOverlay');
        const updateFaqShadows = setupDragScrollBox(aboutFaqScroll, aboutFaqOverlay);

        function renderState(state) {
            segs.forEach((seg, i) => seg.classList.toggle('filled', i <= state));
            label.textContent = labels[state];
        }

        function morphBioToExperience() {
            const leftBox = aboutFlipGrid.querySelector('.about-flip-col:not(.about-flip-col-right) .about-flip-photo-box');
            const rightBox = aboutFlipGrid.querySelector('.about-flip-col-right .about-flip-back-content');

            if (!leftBox || !rightBox || !aboutTimelineScroll || !aboutTimelineOverlay) {
                aboutFlipGrid.classList.add('state-2');
                requestAnimationFrame(updateTimelineShadows);
                return;
            }

            const gridRect = aboutFlipGrid.getBoundingClientRect();
            const centerX = gridRect.left + gridRect.width / 2;
            const centerY = gridRect.top + gridRect.height / 2;

            leftBox.classList.add('content-fade');
            rightBox.classList.add('content-fade');

            requestAnimationFrame(() => {
                [leftBox, rightBox].forEach(box => {
                    const rect = box.getBoundingClientRect();
                    const boxCenterX = rect.left + rect.width / 2;
                    const boxCenterY = rect.top + rect.height / 2;
                    const deltaX = centerX - boxCenterX;
                    const deltaY = centerY - boxCenterY;
                    box.style.transition = 'transform 0.4s cubic-bezier(0.65,0,0.35,1)';
                    box.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.001)`;
                });
            });

            let shrinkCount = 0;
            const onShrinkDone = (e) => {
                if (e.propertyName !== 'transform') return;
                shrinkCount++;
                if (shrinkCount < 2) return;
                leftBox.removeEventListener('transitionend', onShrinkDone);
                rightBox.removeEventListener('transitionend', onShrinkDone);

                [leftBox, rightBox].forEach(box => {
                    box.style.transition = '';
                    box.style.transform = '';
                    box.classList.remove('content-fade');
                });

                aboutTimelineOverlay.classList.add('state-2-instant', 'hide-scroll-shadows');
                aboutFlipGrid.classList.add('state-2');

                aboutTimelineScroll.classList.add('content-fade');
                aboutTimelineScroll.style.transition = 'none';
                aboutTimelineScroll.style.transform = 'scale(0.001)';
                void aboutTimelineScroll.offsetWidth; // force reflow

                requestAnimationFrame(() => {
                    aboutTimelineScroll.style.transition = 'transform 0.45s cubic-bezier(0.34,1.3,0.4,1)';
                    aboutTimelineScroll.style.transform = 'scale(1)';
                    requestAnimationFrame(updateTimelineShadows);
                });

                const onExpandDone = (e2) => {
                    if (e2.target !== aboutTimelineScroll || e2.propertyName !== 'transform') return;
                    aboutTimelineScroll.removeEventListener('transitionend', onExpandDone);
                    aboutTimelineScroll.style.transition = '';
                    aboutTimelineScroll.style.transform = '';
                    aboutTimelineScroll.classList.remove('content-fade');
                    aboutTimelineOverlay.classList.remove('state-2-instant', 'hide-scroll-shadows');
                    if (updateTimelineShadows) updateTimelineShadows();
                };
                aboutTimelineScroll.addEventListener('transitionend', onExpandDone);
            };

            leftBox.addEventListener('transitionend', onShrinkDone);
            rightBox.addEventListener('transitionend', onShrinkDone);
        }

        function morphTimelineToFaq() {
            if (!aboutTimelineScroll || !aboutFaqScroll) {
                aboutFlipGrid.classList.add('state-3');
                requestAnimationFrame(updateFaqShadows);
                return;
            }

            // Reset any leftover transform from a previous cycle before measuring
            aboutTimelineScroll.style.transition = 'none';
            aboutTimelineScroll.style.transform = 'none';
            void aboutTimelineScroll.offsetWidth; // force reflow

            const fromRect = aboutTimelineScroll.getBoundingClientRect();
            const toRect = aboutFaqScroll.getBoundingClientRect();

            const scaleX = toRect.width / fromRect.width;
            const scaleY = toRect.height / fromRect.height;

            const fromCenterX = fromRect.left + fromRect.width / 2;
            const fromCenterY = fromRect.top + fromRect.height / 2;
            const toCenterX = toRect.left + toRect.width / 2;
            const toCenterY = toRect.top + toRect.height / 2;

            const deltaX = toCenterX - fromCenterX;
            const deltaY = toCenterY - fromCenterY;

            aboutTimelineScroll.classList.add('content-fade', 'hide-shadow-instant');
            aboutTimelineOverlay.classList.add('hide-scroll-shadows');

            requestAnimationFrame(() => {
                aboutTimelineScroll.style.transition = 'transform 0.5s cubic-bezier(0.65,0,0.35,1)';
                aboutTimelineScroll.style.transform =
                    `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
            });

            const onScaleDone = (e) => {
                if (e.target !== aboutTimelineScroll || e.propertyName !== 'transform') return;
                aboutTimelineScroll.removeEventListener('transitionend', onScaleDone);

                aboutFlipGrid.classList.add('state-3');
                requestAnimationFrame(updateFaqShadows);

                setTimeout(() => {
                    aboutTimelineScroll.style.transition = '';
                    aboutTimelineScroll.style.transform = '';
                    aboutTimelineScroll.classList.remove('content-fade', 'hide-shadow-instant');
                    aboutTimelineOverlay.classList.remove('hide-scroll-shadows');
                }, 550);
            };
            aboutTimelineScroll.addEventListener('transitionend', onScaleDone);
        }

        let state = 0;
        renderState(state);

        function advance() {
            const nextState = (state + 1) % 4;

            if (state === 0 && nextState === 1) {
                syncAboutFlipHeights();
                aboutFlipGrid.classList.add('flipped');
            } else if (state === 1 && nextState === 2) {
                morphBioToExperience();
            } else if (state === 2 && nextState === 3) {
                morphTimelineToFaq();
            } else if (state === 3 && nextState === 0) {
                aboutFlipGrid.classList.remove('state-3');
                aboutFlipGrid.classList.remove('state-2');
                aboutFlipGrid.classList.remove('flipped');
            }

            state = nextState;
            renderState(state);
        }

        aboutCycleBtn.addEventListener('click', advance);
        aboutCycleBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
        });
    }

    /* ── Tap / Click Pulse ────────────────────────────────── */

    function createPulse(x, y) {
        const pulse         = document.createElement('div');
        pulse.className     = 'tap-pulse';
        pulse.style.left    = x + 'px';
        pulse.style.top     = y + 'px';
        document.body.appendChild(pulse);
        setTimeout(() => pulse.remove(), 650);
    }

    window.addEventListener('click', e => createPulse(e.clientX, e.clientY));
    window.addEventListener('touchstart', e => {
        const t = e.touches[0];
        createPulse(t.clientX, t.clientY);
    }, { passive: true });

})();

const featuredTabs = {
    "Academic Games": [
        {
            title: "Knowverse",
            image: "projects/games/knowverse/Knowverse_Thumbnail.png",
            link: "knowverse.html"
        },
        {
            title: "ElfaBad",
            image: "projects/games/elfabad/ElfaBad_Thumbnail.png",
            link: "elfabad.html"
        },
        {
            title: "Libra",
            image: "projects/games/libra/Libra_Thumbnail.png",
            link: "libra.html"
        },
        {
            title: "Ace",
            image: "projects/games/ace/Ace_Thumbnail.png",
            link: "ace.html"
        },
        {
            title: "Bon-Tress",
            image: "projects/games/bontress/Bon-Tress_Thumbnail.png",
            link: "bontress.html"
        }
    ],

    "Personal Games": [
        {
            title: "ServeEM",
            image: "projects/games/serveem/ServeEM_Thumbnail.png",
            link: "serveem.html"
        }
    ],

    "Game Analysis": [
        {
            title: "Ib Analysis",
            image: "projects/gameanalysis/ib/ibanalysisthumbnail.png",
            link: "projects/gameanalysis/ib/Game_Analysis-Ib.pdf"
        },
        {
            title: "Undertale Analysis",
            image: "projects/gameanalysis/undertale/undertaleanalysisthumbnail.png",
            link: "projects/gameanalysis/undertale/Game_Analysis-Undertale.pdf"
        }
    ],

    "Freelance Works": [
        // Add freelance projects here later
    ]
};

/* ── Featured Projects Tab Switching ─────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
    const folderTabs = document.querySelectorAll('.project-folder-tab');
    const projectGrid = document.querySelector('.project-grid');
    const gridWrap = document.querySelector('.project-grid-wrap');
    if (!folderTabs.length || !projectGrid || !gridWrap) return;

    /* ── Measurement helpers ──────────────────────────────── */
    // Measure from .project-folder-body: it's the one container in
    // this whole structure that NEVER has inline styles set on it by
    // our JS, so it can't drift or feed back into itself across
    // re-renders. Cache the result and only refresh it on resize —
    // never recompute mid tab-switch.
    const folderBody = document.querySelector('.project-folder-body');
    let cachedViewportWidth = null;

    function measureViewportWidth() {
        if (!folderBody) return gridWrap.clientWidth;
        const cs = getComputedStyle(folderBody);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const padR = parseFloat(cs.paddingRight) || 0;
        return folderBody.clientWidth - padL - padR;
    }

    function getViewportWidth() {
        if (cachedViewportWidth === null) {
            cachedViewportWidth = measureViewportWidth();
        }
        return cachedViewportWidth;
    }

    function getGap() {
        const val = parseFloat(getComputedStyle(projectGrid).columnGap);
        return Number.isNaN(val) ? 24 : val;
    }

    /* ── Card sizing ───────────────────────────────────────── */
    function applyCardSizing() {
        const cards = projectGrid.querySelectorAll('.project-card');
        if (!cards.length) return;

        const viewportWidth = getViewportWidth();
        const gap = getGap();

        cards.forEach(card => {
            const isPortrait = !!card.querySelector('.project-card-thumb-portrait');
            const divisor = isPortrait ? 3.6 : 1.8;
            const width = (viewportWidth - gap * 2) / divisor;
            card.style.flex = `0 0 ${width}px`;
            card.style.width = width + 'px';
        });
    }

    /* ── Dynamic centering padding ─────────────────────────── */
    function applyCenteringPadding() {
        const cards = projectGrid.querySelectorAll('.project-card');
        if (!cards.length) return;

        const viewportWidth = getViewportWidth();
        const gap = getGap();

        const totalWidth = Array.from(cards).reduce((sum, c) => sum + c.offsetWidth, 0)
            + gap * (cards.length - 1);

        let padLeft, padRight;

        if (totalWidth <= viewportWidth) {
            const pad = Math.max(0, (viewportWidth - totalWidth) / 2);
            padLeft = padRight = pad;
        } else {
            const firstCardWidth = cards[0].offsetWidth;
            const lastCardWidth = cards[cards.length - 1].offsetWidth;
            padLeft = Math.max(0, (viewportWidth - firstCardWidth) / 2);
            padRight = Math.max(0, (viewportWidth - lastCardWidth) / 2);
        }

        projectGrid.style.paddingLeft = padLeft + 'px';
        projectGrid.style.paddingRight = padRight + 'px';
        projectGrid.style.scrollPaddingInline = `${padLeft}px ${padRight}px`;
    }

    window.addEventListener('resize', () => {
        cachedViewportWidth = measureViewportWidth();
        applyCardSizing();
        applyCenteringPadding();
        const emptyEl = projectGrid.querySelector('.project-folder-empty');
        if (emptyEl) emptyEl.style.width = getViewportWidth() + 'px';
    });

    /* ── Centering targets ─────────────────────────────────── */
    function getCenterTarget() {
        const cards = projectGrid.querySelectorAll('.project-card');
        if (!cards.length) return null;

        const wrapRect = projectGrid.getBoundingClientRect();
        const wrapCenter = wrapRect.left + wrapRect.width / 2;

        let closest = null;
        let closestDist = Infinity;

        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const dist = Math.abs(cardCenter - wrapCenter);
            if (dist < closestDist) {
                closestDist = dist;
                closest = card;
            }
        });

        if (!closest) return null;

        return projectGrid.scrollLeft +
            (closest.getBoundingClientRect().left + closest.offsetWidth / 2) -
            wrapCenter;
    }

    function getCardTarget(index) {
        const cards = projectGrid.querySelectorAll('.project-card');
        if (!cards.length || !cards[index]) return null;

        const wrapRect = projectGrid.getBoundingClientRect();
        const wrapCenter = wrapRect.left + wrapRect.width / 2;
        const card = cards[index];

        return projectGrid.scrollLeft +
            (card.getBoundingClientRect().left + card.offsetWidth / 2) -
            wrapCenter;
    }

    /* ── Drag-to-scroll + snap-to-center (all input types) ──── */
    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let momentumFrame = null;
    let pendingDx = null;
    let dragFrame = null;
    let isSnapping = false;
    let settleTimer = null;

    function easeSnapTo(target) {
        isSnapping = true;
        const startPos = projectGrid.scrollLeft;
        const distance = target - startPos;
        const duration = 500;
        const startTime = performance.now();

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            projectGrid.scrollLeft = startPos + distance * easeOutCubic(t);
            if (t < 1) {
                momentumFrame = requestAnimationFrame(step);
            } else {
                isSnapping = false;
            }
        }

        cancelAnimationFrame(momentumFrame);
        momentumFrame = requestAnimationFrame(step);
    }

    function scheduleSettleSnap() {
        if (isDown || isSnapping) return;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            if (projectGrid.classList.contains('grid-empty')) return;
            const target = getCenterTarget();
            if (target !== null && Math.abs(target - projectGrid.scrollLeft) > 0.5) {
                easeSnapTo(target);
            }
        }, 120);
    }

    projectGrid.addEventListener('mousedown', e => {
        if (projectGrid.classList.contains('grid-empty')) return;
        isDown = true;
        hasDragged = false;
        projectGrid.classList.add('dragging');
        projectGrid.style.scrollBehavior = 'auto';
        startX = e.pageX;
        startScrollLeft = projectGrid.scrollLeft;
        cancelAnimationFrame(momentumFrame);
        e.preventDefault();
    });

    projectGrid.addEventListener('dragstart', e => e.preventDefault());

    window.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        if (Math.abs(dx) > 5) hasDragged = true;

        pendingDx = dx;
        if (dragFrame === null) {
            dragFrame = requestAnimationFrame(() => {
                if (pendingDx !== null) {
                    projectGrid.scrollLeft = startScrollLeft - pendingDx;
                }
                dragFrame = null;
            });
        }
    });

    window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        projectGrid.classList.remove('dragging');
        const target = getCenterTarget();
        if (target !== null) easeSnapTo(target);
    });

    projectGrid.addEventListener('touchstart', () => {
        cancelAnimationFrame(momentumFrame);
    }, { passive: true });

    projectGrid.addEventListener('click', e => {
        if (hasDragged) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    /* ── Tab content data ──────────────────────────────────── */
    function renderProjectGrid(category) {
        const items = featuredTabs[category] || [];

        if (!items.length) {
            projectGrid.classList.add('grid-empty');
            projectGrid.innerHTML = '<div class="project-folder-empty">More projects coming soon.</div>';
            projectGrid.style.paddingLeft = '0px';
            projectGrid.style.paddingRight = '0px';
            projectGrid.style.scrollPaddingInline = '0px';
            projectGrid.scrollLeft = 0;
            updateScrollShadows();
            return;
        }

        projectGrid.classList.remove('grid-empty');

        const isGameAnalysis = category.trim().toLowerCase() === 'game analysis';

        projectGrid.innerHTML = items.map(item => {
            const isPdf = item.link.toLowerCase().endsWith('.pdf');
            const thumbClass = isGameAnalysis ? 'project-card-thumb project-card-thumb-portrait' : 'project-card-thumb';
            return `
                <a href="${item.link}" class="project-card"${isPdf ? ' target="_blank"' : ''}>
                    <div class="${thumbClass}">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="project-card-title">${item.title}</div>
                </a>
            `;
        }).join('');

        projectGrid.scrollLeft = 0;
        applyCardSizing();
        applyCenteringPadding();
        updateScrollShadows();

        // Force card 0 to be dead-center immediately (no animation).
        requestAnimationFrame(() => {
            const target = getCardTarget(0);
            if (target !== null) {
                cancelAnimationFrame(momentumFrame);
                projectGrid.scrollLeft = target;
                updateScrollShadows();
            }
        });
    }

    function updateScrollShadows() {
        if (projectGrid.classList.contains('grid-empty')) {
            gridWrap.classList.remove('has-overflow', 'at-start', 'at-end');
            return;
        }
        const hasOverflow = projectGrid.scrollWidth > projectGrid.clientWidth + 2;
        gridWrap.classList.toggle('has-overflow', hasOverflow);
        gridWrap.classList.toggle('at-start', projectGrid.scrollLeft <= 2);
        gridWrap.classList.toggle('at-end', projectGrid.scrollLeft + projectGrid.clientWidth >= projectGrid.scrollWidth - 2);
    }

    projectGrid.addEventListener('scroll', () => {
        updateScrollShadows();
        scheduleSettleSnap();
    }, { passive: true });
    window.addEventListener('resize', updateScrollShadows);

    const folderTabsWrap = document.querySelector('.project-folder-tabs');

    function updateTabScrollState() {
        if (!folderTabsWrap) return;
        const hasOverflow = folderTabsWrap.scrollWidth > folderTabsWrap.clientWidth + 2;
        folderTabsWrap.classList.toggle('tabs-has-overflow', hasOverflow);
        folderTabsWrap.classList.toggle('tabs-at-start', folderTabsWrap.scrollLeft <= 2);
        folderTabsWrap.classList.toggle('tabs-at-end', folderTabsWrap.scrollLeft + folderTabsWrap.clientWidth >= folderTabsWrap.scrollWidth - 2);
    }

    if (folderTabsWrap) {
        folderTabsWrap.addEventListener('scroll', updateTabScrollState, { passive: true });
        window.addEventListener('resize', updateTabScrollState);
        updateTabScrollState();
    }

    folderTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            folderTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderProjectGrid(tab.textContent.trim());
        });
    });

    applyCardSizing();
    applyCenteringPadding();
    updateScrollShadows();

    window.addEventListener('load', () => {
        requestAnimationFrame(() => {
            projectGrid.scrollLeft = 0;
            applyCardSizing();
            applyCenteringPadding();
            updateScrollShadows();

            const target = getCardTarget(0);
            if (target !== null) {
                projectGrid.scrollLeft = target;
                updateScrollShadows();
            }
        });
    });
});