module.exports = {
    id: 'royalroad',
    name: 'Royal Road',
    version: '1.1.0',
    icon: 'https://www.royalroad.com/dist/img/logo/rr-logo-gold-white-small-min.png',
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Active Popular' },
        { id: 'trending', name: 'Trending' },
        { id: 'best', name: 'Best Rated' },
        { id: 'latest', name: 'Latest Updates' }
    ],

    // 2. Map category URLs with pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://www.royalroad.com/fictions';
        const pageParam = page > 1 ? `?page=${page}` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/active-popular${pageParam}`;
            case 'trending': return `${baseUrl}/trending${pageParam}`;
            case 'best': return `${baseUrl}/best-rated${pageParam}`;
            case 'latest': return `${baseUrl}/latest-updates${pageParam}`;
            default: return `${baseUrl}/active-popular${pageParam}`;
        }
    },

    // 3. Search URL with pagination
    getSearchUrl: (query, page = 1) => {
        return `https://www.royalroad.com/fictions/search?title=${encodeURIComponent(query)}${page > 1 ? '&page=' + page : ''}`;
    },

    // 4. Details Extraction (Custom tailored for Royal Road's layout)
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.description');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('h4.font-white a, .author a, span[property="name"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters (Royal Road uses a data table)
        const chapterRows = document.querySelectorAll('table#chapters tbody tr[data-url]');
        const allChapters = Array.from(chapterRows).map(tr => {
            const titleEl = tr.querySelector('td a');
            const title = titleEl ? titleEl.innerText.trim() : "Unknown Chapter";
            // The URL is stored in the data-url attribute of the row
            const urlPath = tr.getAttribute('data-url');
            const url = urlPath ? window.location.origin + urlPath : window.location.href;
            
            return { title, url };
        });

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Start Reading" button or fallback to the first chapter in the list
        const firstChEl = Array.from(document.querySelectorAll('a.btn-primary')).find(a => a.innerText.toLowerCase().includes('start reading') || a.innerText.toLowerCase().includes('read first'));
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Truncate to prevent IPC memory crash
        };
    })();`,

    // 5. Renamed to getListScript (Uses your extraction logic)
    getListScript: () => `
    (() => {
        const results = [];
        document.querySelectorAll('.fiction-title a').forEach(aEl => {
            const title = aEl.innerText.trim();
            const url = aEl.href;
            const container = aEl.closest('.fiction-list-item');
            
            if (!container) return;

            const imgEl = container.querySelector('img');
            let cover = null;
            if (imgEl) {
                cover = imgEl.getAttribute('src');
                if (cover && cover.startsWith('/')) {
                    cover = window.location.origin + cover;
                }
            }

            // Optional: Grab chapter count or stats if available
            const statsEls = container.querySelectorAll('.stats .col-sm-6 span, .margin-top-10 span');
            let chapters = "Original";
            statsEls.forEach(span => {
                if (span.innerText.toLowerCase().includes('pages') || span.innerText.toLowerCase().includes('chapters')) {
                    chapters = span.innerText.trim();
                }
            });

            if (title && url && !results.find(r => r.url === url)) {
                results.push({ title, url, chapters, cover, source: 'Royal Road' });
            }
        });
        return results;
    })();`
};