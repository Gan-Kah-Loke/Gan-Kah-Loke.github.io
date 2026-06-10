document.addEventListener('DOMContentLoaded', function() {

    // FAQ Dropdowns
    document.querySelectorAll('.faq-trigger').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const group  = btn.closest('.faq-group');
            const isOpen = group.classList.contains('open');
            document.querySelectorAll('.faq-group').forEach(function(g) {
                g.classList.remove('open');
                g.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                group.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Profile lightbox
    const profileImg = document.getElementById('profileImg');
    const lightbox   = document.getElementById('lightbox');

    profileImg.addEventListener('click', function() {
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    lightbox.addEventListener('click', function() {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Side nav scroll highlight
    const sideNavBtns = document.querySelectorAll('.side-nav-btn');

    const sections = [
        { el: document.querySelector('.about-profile-hero'), href: '#'           },
        { el: document.getElementById('experience'),         href: '#experience' },
        { el: document.getElementById('faq'),                href: '#faq'        },
    ];

    function updateSideNav() {
        const scrollY = window.scrollY + window.innerHeight * 0.4;

        let current = sections[0];
        sections.forEach(s => {
            if (s.el) {
                const top = s.el.getBoundingClientRect().top + window.scrollY;
                if (top <= scrollY) current = s;
            }
        });

        sideNavBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('href') === current.href);
        });
    }

    window.addEventListener('scroll', updateSideNav, { passive: true });
    updateSideNav();

});