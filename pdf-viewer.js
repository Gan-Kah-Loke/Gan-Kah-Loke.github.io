pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfDownloadLink = document.getElementById('pdfDownloadLink');
const pdfLightbox = document.getElementById('pdfLightbox');
const pdfBackdrop = document.getElementById('pdfBackdrop');
const pdfClose    = document.getElementById('pdfLightboxClose');
const pdfCanvas   = document.getElementById('pdfCanvas');
const pdfLoading  = document.getElementById('pdfLoading');
const pdfCounter  = document.getElementById('pdfCounter');
const pdfTitle    = document.getElementById('pdfLightboxTitle');
const pdfPrev     = document.getElementById('pdfPrev');
const pdfNext     = document.getElementById('pdfNext');

let currentPage = 1;
let totalPages  = 0;
let pageCache   = [];

function showPage(num) {
    const cached = pageCache[num - 1];
    if (!cached) return;

    pdfCanvas.width  = cached.width;
    pdfCanvas.height = cached.height;
    pdfCanvas.getContext('2d').drawImage(cached, 0, 0);

    pdfLoading.style.display = 'none';
    pdfCanvas.style.display  = 'block';
    pdfCounter.textContent   = `${num} / ${totalPages}`;
    pdfPrev.disabled = num <= 1;
    pdfNext.disabled = num >= totalPages;
}

function renderAllPages(doc) {
    const scale    = window.devicePixelRatio >= 2 ? 2.4 : 2.0;
    const promises = [];

    for (let i = 1; i <= doc.numPages; i++) {
        const p = doc.getPage(i).then(page => {
            const viewport = page.getViewport({ scale });
            const offscreen = document.createElement('canvas');
            offscreen.width  = viewport.width;
            offscreen.height = viewport.height;
            return page.render({
                canvasContext: offscreen.getContext('2d'),
                viewport
            }).promise.then(() => {
                pageCache[i - 1] = offscreen;
                if (i === 1) showPage(1);
            });
        });
        promises.push(p);
    }

    Promise.all(promises).then(() => {
        pdfCounter.textContent = `${currentPage} / ${totalPages}`;
    }).catch(err => {
        console.error('PDF render error:', err);
        pdfLoading.textContent = 'Failed to render PDF.';
    });
}

function openPdfLightbox(url, title) {
    pdfDownloadLink.href = url;
    pdfTitle.textContent     = title || '';
    pdfLoading.style.display = 'block';
    pdfLoading.textContent   = 'Loading...';
    pdfCanvas.style.display  = 'none';
    pdfCounter.textContent   = '';
    pdfPrev.disabled         = true;
    pdfNext.disabled         = true;
    currentPage              = 1;
    pageCache                = [];

    pdfLightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    pdfjsLib.getDocument({
        url,
        cMapUrl:    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
    }).promise.then(doc => {
        totalPages = doc.numPages;
        renderAllPages(doc);
    }).catch(err => {
        console.error('PDF load error:', err);
        pdfLoading.textContent = 'Could not load PDF.';
    });
}

function closePdfLightbox() {
    pdfLightbox.classList.remove('open');
    document.body.style.overflow = '';
    currentPage = 1;
    totalPages  = 0;
    pageCache   = [];
}

pdfPrev.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage--;
    showPage(currentPage);
});

pdfNext.addEventListener('click', () => {
    if (currentPage >= totalPages) return;
    currentPage++;
    showPage(currentPage);
});

pdfClose.addEventListener('click', closePdfLightbox);
pdfBackdrop.addEventListener('click', closePdfLightbox);

document.addEventListener('keydown', e => {
    if (!pdfLightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft'  && currentPage > 1)          { currentPage--; showPage(currentPage); }
    if (e.key === 'ArrowRight' && currentPage < totalPages) { currentPage++; showPage(currentPage); }
    if (e.key === 'Escape') closePdfLightbox();
});

window.openPdfLightbox = openPdfLightbox;