module.exports = {
    id: 'novelfull',
    name: 'NovelFull',
    version: '1.1.0',
    icon: 'https://novelfull.com/uploads/thumbs/banner-75b2b7a774-bf0efeba81-e12fa8e3e6dd74587f2bc6ada7256742.png', // Standard high-res icon
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    // 2. Map category IDs to URLs with pagination support
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://novelfull.com';
        const pageParam = page > 1 ? `?page=${page}` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/most-popular${pageParam}`;
            case 'latest': return `${baseUrl}/latest-release-novel${pageParam}`;
            case 'completed': return `${baseUrl}/completed-novel${pageParam}`;
            default: return `${baseUrl}/most-popular${pageParam}`;
        }
    },

    // 3. Search URL with pagination support
    getSearchUrl: (query, page = 1) => {
        return `https://novelfull.com/search?keyword=${encodeURIComponent(query)}${page > 1 ? '&page=' + page : ''}`;
    },

    // 4. Details Extraction
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.desc-text, .description, #desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('.info a[href*="author"], .info a');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters
        const chapterLinks = document.querySelectorAll('.list-chapter li a, ul#list-chapter li a');
        const allChapters = Array.from(chapterLinks).map(a => ({
            title: a.title || a.innerText.trim(),
            url: a.href
        }));

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Read First" button or fallback to the first chapter in the list
        const firstChEl = document.querySelector('a#read-first, .btn-read-now, a[href*="chapter-1"]');
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
        const items = document.querySelectorAll('.row');
        
        items.forEach(container => {
            const aEl = container.querySelector('.novel-title a, h3 a');
            if (!aEl) return;

            const title = aEl.innerText.trim();
            const url = aEl.href;
            
            const imgEl = container.querySelector('img');
            let cover = imgEl ? imgEl.src : null;
            
            // Safety check for relative image paths
            if (cover && cover.startsWith('/')) {
                cover = window.location.origin + cover;
            }

            const chapterEl = container.querySelector('.chapter-text');
            let chapters = chapterEl ? chapterEl.innerText.trim() : "View Info";

            if (title && url && !results.find(r => r.url === url)) {
                results.push({ title, url, chapters, cover, source: 'NovelFull' });
            }
        });
        return results;
    })();`
};