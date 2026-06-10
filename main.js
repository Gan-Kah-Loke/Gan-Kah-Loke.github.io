(function () {
    'use strict';

    const navbar     = document.querySelector('.navbar');
    const burger     = document.getElementById('navBurger');
    const hero       = document.querySelector('.hero');
    const heroEl     = document.querySelector('.hero');
    const content    = document.querySelector('.page-content');
    const pgFill     = document.getElementById('pgFill');
    const breakWord  = document.getElementById('breakWord');
    const contactForm = document.getElementById('contactForm');
    const isFileMode = window.location.protocol === 'file:';
    const fadeTarget = content || hero;

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

    /* ── Hero Fade on Scroll ──────────────────────────────── */

    if (hero) {
        function updateHeroFade() {
            const fadeEnd = window.innerHeight * 0.6;
            hero.style.opacity = 1 - Math.min(Math.max(window.scrollY / fadeEnd, 0), 1);
        }
        window.addEventListener('scroll', updateHeroFade, { passive: true });
        updateHeroFade();
    }

    /* ── Side Nav Active State ────────────────────────────── */

    const sideNavBtns = document.querySelectorAll('.side-nav-btn');
    const sections    = ['home', 'about', 'projects', 'contact'];

    if (sideNavBtns.length) {
        window.addEventListener('scroll', () => {
            let current = 'home';
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 120) current = id;
            });
            sideNavBtns.forEach(btn =>
                btn.classList.toggle('active', btn.getAttribute('href') === `#${current}`)
            );
        }, { passive: true });
    }

    /* ── Progress Bar ─────────────────────────────────────── */

    if (pgFill) {
        window.addEventListener('scroll', () => {
            const doc      = document.documentElement;
            const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
            pgFill.style.height = (scrolled * 100) + '%';
        }, { passive: true });
    }

    /* ── Hero Scanline (Morse: HELLO) ─────────────────────── */

    if (heroEl) {
        const sequence = [
            { type: 'dot'  }, { type: 'dot'  }, { type: 'dot'  }, { type: 'dot'  },
            { type: 'pause', time: 600 },
            { type: 'dot'  },
            { type: 'pause', time: 600 },
            { type: 'dot'  }, { type: 'dash' }, { type: 'dot'  }, { type: 'dot'  },
            { type: 'pause', time: 600 },
            { type: 'dot'  }, { type: 'dash' }, { type: 'dot'  }, { type: 'dot'  },
            { type: 'pause', time: 600 },
            { type: 'dash' }, { type: 'dash' }, { type: 'dash' }
        ];

        let i = 0;

        function spawnScan(duration) {
            const sweep = document.createElement('div');
            sweep.className     = 'hero-scanline-sweep';
            sweep.style.cssText = 'top:-2px;opacity:0;';
            heroEl.appendChild(sweep);

            const heroHeight = heroEl.offsetHeight;
            let start = null;

            requestAnimationFrame(function frame(ts) {
                if (!start) start = ts;
                const p         = (ts - start) / duration;
                sweep.style.top = (-2 + p * (heroHeight + 2)) + 'px';
                sweep.style.opacity = Math.min(
                    p < 0.2 ? p / 0.2 : p > 0.7 ? Math.max(0, (1 - p) / 0.3) : 1,
                    0.12
                );
                p < 1 ? requestAnimationFrame(frame) : sweep.remove();
            });
        }

        function runStep() {
            if (i >= sequence.length) {
                setTimeout(() => { i = 0; runStep(); }, 3000);
                return;
            }
            const step = sequence[i++];
            if (step.type === 'pause') { setTimeout(runStep, step.time); return; }
            spawnScan(step.type === 'dash' ? 3200 : 1400);
            setTimeout(runStep, step.type === 'dash' ? 500 : 220);
        }

        runStep();
    }

    /* ── Glitch Word ──────────────────────────────────────── */

    if (breakWord) {
        const DURATION = 120;
        let timer = null;

        function setWord(text, cls) {
            breakWord.textContent = text;
            breakWord.setAttribute('data-text', text);
            breakWord.classList.remove('glitching', 'hovered');
            if (cls) breakWord.classList.add(cls);
        }

        breakWord.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            breakWord.classList.add('glitching');
            timer = setTimeout(() => setWord('Breaker', 'hovered'), DURATION);
        });

        breakWord.addEventListener('mouseleave', () => {
            clearTimeout(timer);
            breakWord.classList.remove('hovered');
            breakWord.classList.add('glitching');
            timer = setTimeout(() => setWord('Breaking'), DURATION);
        });
    }

    /* ── Contact Form ─────────────────────────────────────── */

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn  = this.querySelector('.btn-submit');
            const text = document.getElementById('submitText');

            btn.disabled     = true;
            text.textContent = 'SENDING...';

            window.location.href =
                `mailto:kahlokegan@gmail.com` +
                `?subject=${encodeURIComponent(this.subject.value)}` +
                `&body=${encodeURIComponent(
                    this.message.value +
                    '\n\nFrom: ' + this.name.value +
                    ' (' + this.email.value + ')'
                )}`;

            setTimeout(() => {
                text.textContent     = 'MESSAGE SENT ✓';
                btn.style.background = '#27c93f';
                btn.style.color      = '#000';
            }, 800);
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