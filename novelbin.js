// providers/novelbin.js

module.exports = {
    id: 'novelbin',
    name: 'NovelBin',
    version: '1.1.0',
    icon: 'https://novelbin.com/apple-touch-icon.png', // High-res icon for NovelBin
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    // 2. Map category IDs to their specific URLs, supporting pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://novelbin.com/sort';
        const pageParam = page > 1 ? `?page=${page}` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/top-view${pageParam}`;
            case 'latest': return `${baseUrl}/update${pageParam}`;
            case 'completed': return `${baseUrl}/top-view-full${pageParam}`;
            default: return `${baseUrl}/top-view${pageParam}`;
        }
    },

    // 3. Search URL with pagination support
    getSearchUrl: (query, page = 1) => {
        return `https://novelbin.com/search?keyword=${encodeURIComponent(query)}${page > 1 ? '&page=' + page : ''}`;
    },

    // 4. Details Extraction
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.desc-text, .description, #desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('ul.info li a[href*="author"], .author a');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters
        const chapterLinks = document.querySelectorAll('ul.list-chapter li a, #list-chapter li a');
        const allChapters = Array.from(chapterLinks).map(a => ({
            title: a.title || a.innerText.trim(),
            url: a.href
        }));

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Read First" button or fallback to the first chapter in the list
        const firstChEl = document.querySelector('a#read-first, a[href*="chapter-1"]');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Truncate to prevent IPC memory crash
        };
    })();`,

    // 5. Renamed to getListScript (Uses your exact extraction logic)
    getListScript: () => `
    (() => {
        const results = [];
        const titleLinks = document.querySelectorAll('.novel-title a');
        
        titleLinks.forEach(aEl => {
            const title = aEl.innerText.trim();
            const url = aEl.href;
            const container = aEl.closest('.row') || aEl.closest('.novel-item') || aEl.parentElement.parentElement;
            
            // Chapter logic inside the loop for each container
            const chapterEl = container.querySelector('.chapter-text, .label-info, .chapter, span[title*="Chapter"]');
            let chapters = "View Info";

            if (chapterEl) {
                chapters = chapterEl.innerText.trim();
            } else {
                const allSpans = container.querySelectorAll('span');
                if (allSpans.length > 0) chapters = allSpans[allSpans.length - 1].innerText.trim();
            }

            const imgEl = container.querySelector('img');
            let cover = null;
            if (imgEl) {
                cover = imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                if (cover && cover.startsWith('//')) cover = 'https:' + cover;
                else if (cover && cover.startsWith('/')) cover = window.location.origin + cover;
            }
            
            if (title && url && !results.find(r => r.url === url)) {
                results.push({ title, url, chapters, cover, source: 'NovelBin' });
            }
        });
        return results;
    })();`
};