  const FOLDER   = { 'pixel-art': 'art/pixelart/', 'traditional': 'art/traditional/' };
        const isFileMode = window.location.protocol === 'file:';

        let currentFilter = 'pixel-art';
        let currentIndex  = 0;
        let filteredList  = [];
        let carouselBuilt = false;

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.value;
        buildGrid();
        });
        });

        function getColCount() {
        const w = window.innerWidth;
        if (w <= 400) return 1;
        if (w <= 600) return 2;
        if (w <= 900) return 3;
        return 4;
        }

        function buildGrid() {
        let list = ARTWORKS.filter(a => a.category === currentFilter)
        .sort((a, b) => b.dateSort.localeCompare(a.dateSort));

        filteredList = list;
        carouselBuilt = false;

        ['col-0','col-1','col-2','col-3'].forEach(id => {
        document.getElementById(id).innerHTML = '';
        });

        if (filteredList.length === 0) return;

        const colCount   = getColCount();
        const colIds     = ['col-0','col-1','col-2','col-3'].slice(0, colCount);
        const colHeights = Array(colCount).fill(0);
        const cols       = colIds.map(id => document.getElementById(id));

        filteredList.forEach((art, i) => {
        const src  = FOLDER[art.category] + art.file;
        const card = document.createElement('div');
        card.className = 'masonry-card' + (art.category === 'pixel-art' ? ' pixel-art-card' : '');

        const img = document.createElement('img');
        img.src     = src;
        img.alt     = art.title;
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'masonry-overlay';
        overlay.innerHTML = `<span class="masonry-title">${art.title}</span>`;

        card.appendChild(img);
        card.appendChild(overlay);

        const minH   = Math.min(...colHeights);
        const colIdx = colHeights.indexOf(minH);

        card.addEventListener('click', () => openCarousel(i));
        cols[colIdx].appendChild(card);

        img.addEventListener('load', () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        card.classList.remove('ratio-tall', 'ratio-wide');
        card.classList.add(img.naturalWidth > img.naturalHeight ? 'ratio-wide' : 'ratio-tall');
        colHeights[colIdx] += img.offsetWidth * ratio;
        });
        colHeights[colIdx] += 200;
        });
        }

        // ── Carousel ──────────────────────────────────────────
        const carousel       = document.getElementById('lightbox');
        const carouselTrack  = document.getElementById('carouselTrack');
        const carouselThumbs = document.getElementById('carouselThumbs');
        const carouselDots   = document.getElementById('carouselDots');
        const lightboxTitle  = document.getElementById('lightboxTitle');
        const lightboxDate   = document.getElementById('lightboxDate');
        const lightboxPrev   = document.getElementById('lightboxPrev');
        const lightboxNext   = document.getElementById('lightboxNext');
        const backdrop       = document.getElementById('lightboxBackdrop');
        const trackWrap      = document.getElementById('carouselTrackWrap');
        const zoomLevelEl    = document.getElementById('carouselZoomLevel');

        const ZOOM_STEPS = [1, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
        let zScale = 1, zOx = 0, zOy = 0, isZoomed = false;

        function getActiveImg() {
        return carouselTrack.children[currentIndex]?.querySelector('img') || null;
        }

        function clampOffset(s, x, y) {
        const img = getActiveImg();
        if (!img) return { x: 0, y: 0 };
        const wr  = trackWrap.getBoundingClientRect();
        const maxX = Math.max(0, (img.naturalWidth  * s - wr.width)  / 2);
        const maxY = Math.max(0, (img.naturalHeight * s - wr.height) / 2);
        return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
        }

        function applyZoom(animated) {
        const img = getActiveImg();
        if (!img) return;
        img.style.transition      = animated ? 'transform 0.25s ease' : 'none';
        img.style.transformOrigin = '50% 50%';
        img.style.transform       = `translate(${zOx}px,${zOy}px) scale(${zScale})`;
        isZoomed = zScale > 1;
        trackWrap.classList.toggle('zoomed', isZoomed);
        zoomLevelEl.textContent = `${zScale.toFixed(1)}×`;
        }

        function resetZoom(animated) { zScale=1; zOx=0; zOy=0; applyZoom(animated??true); }

        function enterZoom(cx, cy, target) {
        const wr   = trackWrap.getBoundingClientRect();
        const pivX = (cx !== undefined) ? cx - wr.left - wr.width  / 2 : 0;
        const pivY = (cy !== undefined) ? cy - wr.top  - wr.height / 2 : 0;
        const ratio = target / zScale;
        zOx = pivX - (pivX - zOx) * ratio;
        zOy = pivY - (pivY - zOy) * ratio;
        zScale = target;
        const c = clampOffset(zScale, zOx, zOy);
        zOx = c.x; zOy = c.y;
        applyZoom(true);
        }

        function clickZoom(cx, cy) {
            if (isZoomed) { resetZoom(true); return; }
            enterZoom(cx, cy, ZOOM_STEPS[1]);
        }

        trackWrap.addEventListener('wheel', e => {
        if (!carousel.classList.contains('open')) return;
        e.preventDefault();
        const dir  = e.deltaY < 0 ? 1 : -1;
        const idx  = ZOOM_STEPS.indexOf(zScale);
        const next = dir > 0 ? (idx < ZOOM_STEPS.length-1 ? ZOOM_STEPS[idx+1] : zScale)
        : (idx > 0 ? ZOOM_STEPS[idx-1] : zScale);
        if (next === zScale) return;
        next === 1 ? resetZoom(true) : enterZoom(e.clientX, e.clientY, next);
        }, { passive: false });

        // Mouse drag / swipe
        (function(){
        let down=false, startX, startY, startOx, startOy, didDrag=false;
        trackWrap.addEventListener('mousedown', e => {
        if (e.button!==0) return;
        down=true; didDrag=false;
        startX=e.clientX; startY=e.clientY; startOx=zOx; startOy=zOy;
        e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
        if (!down) return;
        const dx=e.clientX-startX, dy=e.clientY-startY;
        if (Math.sqrt(dx*dx+dy*dy)>5) didDrag=true;
        if (isZoomed) {
        trackWrap.classList.add('dragging');
        zOx=startOx+dx; zOy=startOy+dy;
        const c=clampOffset(zScale,zOx,zOy); zOx=c.x; zOy=c.y;
        applyZoom(false);
        } else {
        trackWrap.classList.add('swiping');
        carouselTrack.style.transition='none';
        carouselTrack.style.transform=`translateX(calc(-${currentIndex*100}% + ${dx}px))`;
        }
        });
        document.addEventListener('mouseup', e => {
        if (!down) return;
        down=false;
        trackWrap.classList.remove('dragging','swiping');
        const dx=e.clientX-startX;
        if (!didDrag) { clickZoom(e.clientX,e.clientY); return; }
        if (!isZoomed && Math.abs(dx)>trackWrap.offsetWidth*0.2) goTo(currentIndex+(dx<0?1:-1));
        else { carouselTrack.style.transition='transform 0.32s cubic-bezier(0.4,0,0.2,1)'; carouselTrack.style.transform=`translateX(-${currentIndex*100}%)`; }
        });
        })();

        trackWrap.addEventListener('dblclick', e => { isZoomed ? resetZoom(true) : enterZoom(e.clientX,e.clientY,2.0); });

        // Thumb drag
        (function(){
        let down=false, startX, scrollStart, didDrag=false;
        carouselThumbs.addEventListener('mousedown', e => { down=true; didDrag=false; startX=e.clientX; scrollStart=carouselThumbs.scrollLeft; carouselThumbs.classList.add('dragging'); e.preventDefault(); });
        document.addEventListener('mousemove', e => { if (!down) return; const dx=e.clientX-startX; if(Math.abs(dx)>4) didDrag=true; carouselThumbs.scrollLeft=scrollStart-dx; });
        document.addEventListener('mouseup', () => { if(!down) return; down=false; carouselThumbs.classList.remove('dragging'); });
        carouselThumbs.addEventListener('click', e => { if(didDrag){didDrag=false;e.stopPropagation();} }, true);
        })();

        function buildCarousel() {
        carouselTrack.innerHTML = '';
        filteredList.forEach(art => {
        const src   = FOLDER[art.category] + art.file;
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        const img = document.createElement('img');
        img.alt = art.title; img.dataset.src = src;
        slide.appendChild(img);
        carouselTrack.appendChild(slide);
        });
        carouselThumbs.innerHTML = '';
        filteredList.forEach((art, i) => {
        const src   = FOLDER[art.category] + art.file;
        const thumb = document.createElement('div');
        thumb.className = 'carousel-thumb';
        const img = document.createElement('img');
        img.src=src; img.alt=art.title;
        thumb.appendChild(img);
        thumb.addEventListener('click', () => goTo(i));
        carouselThumbs.appendChild(thumb);
        });
        carouselDots.innerHTML = '';
        if (filteredList.length <= 30) {
        filteredList.forEach((_,i) => {
        const dot=document.createElement('div');
        dot.className='carousel-dot';
        dot.addEventListener('click',()=>goTo(i));
        carouselDots.appendChild(dot);
        });
        }
        carouselBuilt = true;
        }

        function goTo(index, animate=true) {
        const oldImg = getActiveImg();
        if (oldImg) { oldImg.style.transition='none'; oldImg.style.transform=''; }
        const total = filteredList.length;
        currentIndex = ((index % total) + total) % total;
        resetZoom(false);
        carouselTrack.style.transition = animate ? 'transform 0.38s cubic-bezier(0.4,0,0.2,1)' : 'none';
        carouselTrack.style.transform  = `translateX(-${currentIndex*100}%)`;
        if (!animate) requestAnimationFrame(() => { carouselTrack.style.transition=''; });
        [-1,0,1,2].forEach(offset => {
        const idx = ((currentIndex+offset)%total+total)%total;
        const slide = carouselTrack.children[idx];
        if (slide) { const img=slide.querySelector('img'); if(img&&img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;} }
        });
        const art = filteredList[currentIndex];
        lightboxTitle.textContent = art.title;
        lightboxDate.textContent  = art.date;
        carouselDots.querySelectorAll('.carousel-dot').forEach((d,i)=>d.classList.toggle('active',i===currentIndex));
        carouselThumbs.querySelectorAll('.carousel-thumb').forEach((t,i)=>t.classList.toggle('active',i===currentIndex));
        const activeThumb = carouselThumbs.children[currentIndex];
        if (activeThumb) activeThumb.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
        }

        function openCarousel(index) {
        if (!carouselBuilt) buildCarousel();
        carousel.classList.add('open');
        document.body.style.overflow = 'hidden';
        goTo(index, false);
        }

        function closeCarousel() {
        resetZoom(false);
        carousel.classList.remove('open');
        document.body.style.overflow = '';
        }

        lightboxPrev.addEventListener('click', e => { e.stopPropagation(); if(isZoomed) resetZoom(true); else goTo(currentIndex-1); });
        lightboxNext.addEventListener('click', e => { e.stopPropagation(); if(isZoomed) resetZoom(true); else goTo(currentIndex+1); });
        backdrop.addEventListener('click', closeCarousel);
        document.getElementById('carouselClose').addEventListener('click', closeCarousel);
        document.addEventListener('keydown', e => {
        if (!carousel.classList.contains('open')) return;
        if (e.key==='ArrowLeft')  { if(isZoomed) resetZoom(true); else goTo(currentIndex-1); }
        if (e.key==='ArrowRight') { if(isZoomed) resetZoom(true); else goTo(currentIndex+1); }
        if (e.key==='Escape')     { if(isZoomed) resetZoom(true); else closeCarousel(); }
        });

        // Touch
        (function(){
        let startX=null,startY=null,isHoriz=null,moved=0;
        trackWrap.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY;isHoriz=null;moved=0;},{passive:true});
        trackWrap.addEventListener('touchmove',e=>{
        if(startX===null||isZoomed) return;
        const dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;
        if(isHoriz===null){if(Math.abs(dx)<5&&Math.abs(dy)<5) return;isHoriz=Math.abs(dx)>Math.abs(dy);}
        if(!isHoriz) return;
        e.preventDefault(); moved=dx;
        carouselTrack.style.transition='none';
        carouselTrack.style.transform=`translateX(calc(-${currentIndex*100}% + ${dx}px))`;
        },{passive:false});
        trackWrap.addEventListener('touchend',()=>{
        if(isHoriz&&Math.abs(moved)>50) goTo(currentIndex+(moved<0?1:-1));
        else if(isHoriz){carouselTrack.style.transition='transform 0.32s cubic-bezier(0.4,0,0.2,1)';carouselTrack.style.transform=`translateX(-${currentIndex*100}%)`;}
        startX=null;startY=null;isHoriz=null;moved=0;
        },{passive:true});
        })();

        // Page transition
        (function(){
        const content=document.querySelector('.page-content');
        const navbar=document.querySelector('.navbar');
        if(!content) return;
        content.style.opacity='0'; content.style.transition='opacity 0.45s ease';
        window.addEventListener('load',()=>{ requestAnimationFrame(()=>{ navbar?.classList.remove('nav-exit'); content.style.opacity='1'; }); });
        document.querySelectorAll('a[href]').forEach(a=>{
        const href=a.getAttribute('href');
        if(!href||href.startsWith('#')||href.startsWith('javascript')||a.target==='_blank'||a.hasAttribute('download')) return;
        a.addEventListener('click',e=>{
        if(isFileMode) return;
        const url=new URL(a.href,window.location.href);
        const samePage=url.pathname===window.location.pathname&&url.hash===window.location.hash;
        if(samePage) return;
        e.preventDefault(); navbar?.classList.add('nav-exit'); content.style.opacity='0';
        setTimeout(()=>{window.location.href=a.href;},450);
        });
        });
        })();

        document.documentElement.classList.add('fonts-loading');
        document.fonts.ready.then(()=>{ document.documentElement.classList.remove('fonts-loading'); document.documentElement.classList.add('fonts-loaded'); });

        let resizeTimer;
        window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildGrid, 150);
        });

        buildGrid();