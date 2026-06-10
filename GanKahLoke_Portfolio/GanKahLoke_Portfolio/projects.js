const navbar  = document.querySelector('.navbar');
const burger  = document.getElementById('navBurger');
const content = document.querySelector('.page-content');

function toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const sortedProjects = [...PROJECTS].sort((a, b) => b.dateSort.localeCompare(a.dateSort));

function buildCategory(categoryLabel, projects, tall = false) {
    if (projects.length === 0) return;
    const section = document.createElement('div');
    section.className = 'gp-category';
    const heading = document.createElement('div');
    heading.className = 'gp-category-label';
    heading.textContent = categoryLabel;
    section.appendChild(heading);
    const grid = document.createElement('div');
    grid.className = tall ? 'gp-grid gp-grid--tall' : 'gp-grid';
    projects.forEach(p => {
        const primaryEntry = Object.entries(p.links || {})[0];
        const primaryHref  = primaryEntry ? primaryEntry[1] : '#';
        const isPdf        = primaryHref.endsWith('.pdf');
        const wrapper = document.createElement('div');
        const card = document.createElement('div');
        card.className = tall ? 'gp-card gp-card--tall' : 'gp-card';

        const statusPill = p.status
            ? `<span class="gp-pill gp-pill--${p.status}">${p.status === 'mvp' ? 'Vertical Slice' : p.status === 'wip' ? 'WIP' : p.status === 'maintenance' ? 'Maintenance' : 'Coming Soon'}</span>`
            : '';
        const playPill = p.playable
            ? `<span class="gp-pill gp-pill--play">▶ Playable Demo</span>`
            : '';

        card.innerHTML = `
            ${p.image
                ? `<div class="gp-thumb-wrapper"><img src="${p.image}" alt="${p.title}" class="gp-thumb-img" loading="lazy" /></div>`
                : `<div class="gp-thumb-placeholder">${p.title[0]}</div>`
            }
            <div class="gp-card-foot">
                <div class="gp-card-title">${p.title}</div>
                <div class="gp-card-pills">${playPill}${statusPill}</div>
            </div>
            ${p.roles || p.desc ? `
            <div class="gp-card-body">
                ${p.roles ? `<div class="gp-card-roles">${p.roles.map(r => `<span class="gp-role-tag">${r}</span>`).join('')}</div>` : ''}
                ${p.desc ? `<p class="gp-card-desc">${p.desc}</p>` : ''}
            </div>` : ''}
        `;

        card.addEventListener('click', () => {
            if (isPdf) window.open(primaryHref, '_blank');
            else window.location.href = primaryHref;
        });
        wrapper.appendChild(card);
        grid.appendChild(wrapper);
    });
    section.appendChild(grid);
    document.querySelector('.gp-section').appendChild(section);
    genreSection.style.display = 'none'; // temp hide the section
}

const gameProjects = [...PROJECTS].filter(p => p.dimension === 'game' || p.dimension === 'personal');
const genreMap = {};
gameProjects.forEach(p => {
    (p.genres || []).forEach(g => {
        if (!genreMap[g]) genreMap[g] = [];
        genreMap[g].push(p.title);
    });
});

const genreSection = document.createElement('div');
genreSection.className = 'gp-genre-section';
genreSection.innerHTML = `
    <div class="gp-genre-header">
        <span class="gp-genre-heading">Genre Experience</span>
        <span class="gp-genre-line"></span>
    </div>
    <div class="gp-genre-sub">Genres covered across all game projects developed</div>
    <div class="gp-genre-chips" id="gpGenreChips"></div>
    <div class="gp-genre-stat"></div>
`;
document.querySelector('.gp-section').appendChild(genreSection);

const sortedGenres = Object.entries(genreMap).sort((a, b) => b[1].length - a[1].length);
const chipsEl = document.getElementById('gpGenreChips');
sortedGenres.forEach(([genre, titles]) => {
    const chip = document.createElement('div');
    chip.className = 'gp-genre-chip';
    chip.innerHTML = `
        <div class="gp-genre-chip-inner">
            <span class="gp-genre-name">${genre}</span>
            <span class="gp-genre-count">${titles.length}</span>
        </div>
        <div class="gp-genre-dropdown">
            <div class="gp-genre-dropdown-title">Projects</div>
            ${titles.map(t => `<div class="gp-genre-dropdown-item">${t}</div>`).join('')}
        </div>
    `;
    chipsEl.appendChild(chip);
});

const totalGenres = sortedGenres.length;
const totalProjects = [...new Set(sortedGenres.flatMap(([, t]) => t))].length;
genreSection.querySelector('.gp-genre-stat').innerHTML =
    `<span class="gp-genre-stat-accent">${totalGenres}</span> genres across <span class="gp-genre-stat-accent">${totalProjects}</span> projects`;

const projectsPersonal    = sortedProjects.filter(p => p.dimension === 'personal');
const projectsGame        = sortedProjects.filter(p => p.dimension === 'game');
const projectsAnalysis    = sortedProjects.filter(p => p.dimension === 'analysis');
const projectsLevelDesign = sortedProjects.filter(p => p.dimension === 'leveldesign');

buildCategory('Personal Projects', projectsPersonal);
buildCategory('Academic Game Projects', projectsGame);
buildCategory('Game Analysis', projectsAnalysis, true);
buildCategory('Level Design', projectsLevelDesign, true);

if (burger && navbar) {
    burger.addEventListener('click', () => navbar.classList.toggle('active'));
    document.querySelectorAll('.nav-links a').forEach(link =>
        link.addEventListener('click', () => navbar.classList.remove('active'))
    );
}

document.documentElement.classList.add('fonts-loading');
document.fonts.ready.then(() => {
    document.documentElement.classList.replace('fonts-loading', 'fonts-loaded');
});

if (content) {
    content.style.opacity = '0';
    window.addEventListener('load', () =>
        requestAnimationFrame(() => { content.style.opacity = '1'; })
    );
    document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript') ||
            a.target === '_blank' || a.hasAttribute('download')) return;
        a.addEventListener('click', e => {
            const url = new URL(a.href, window.location.href);
            const samePage = url.pathname === window.location.pathname && url.hash === window.location.hash;
            if (samePage) return;
            e.preventDefault();
            navbar?.classList.add('nav-exit');
            content.style.opacity = '0';
            setTimeout(() => { window.location.href = a.href; }, 450);
        });
    });
}