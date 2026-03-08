module.exports = {
    id: 'libread',
    name: 'LibRead',
    version: '1.1.0',
    icon: 'https://libread.com/favicon.ico', // Standard favicon fallback
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    // 2. Map category URLs with pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://libread.com/sort';
        const pageParam = page > 1 ? `?page=${page}` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/top-view${pageParam}`;
            case 'latest': return `${baseUrl}/update${pageParam}`;
            case 'completed': return `${baseUrl}/top-view-full${pageParam}`;
            default: return `${baseUrl}/top-view${pageParam}`;
        }
    },
    
    // 3. Search URL with pagination (Keeping your exact + encoding logic)
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        return `https://libread.com/search?keyword=${encodedQuery}${page > 1 ? '&page=' + page : ''}`;
    },

    // 4. Details Extraction
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.desc-text, .description, #desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('.info a[href*="author"], .author a');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters
        const chapterLinks = document.querySelectorAll('ul.list-chapter li a, #list-chapter li a, .chapter-list a');
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
    
    // 5. Renamed to getListScript (Uses your exact robust extraction logic)
    getListScript: () => `
    (() => {
        const results = [];
        
        // Target multiple common title classes to be safe
        const titleLinks = document.querySelectorAll('.novel-title a, h3 a, .title a');
        
        titleLinks.forEach(aEl => {
            try {
                const title = aEl.innerText.trim();
                let url = aEl.getAttribute('href');
                
                // Skip empty titles or dead links
                if (!title || !url || url.startsWith('javascript:')) return;
                
                // Safely build absolute URL
                if (url.startsWith('/')) {
                    url = 'https://libread.com' + url;
                } else if (!url.startsWith('http')) {
                    url = aEl.href; 
                }
                
                // Find a container, using multiple common layout classes
                // Fallback to parent nodes if none of these classes exist
                const container = aEl.closest('.row, .item, .novel-item, li, article') 
                               || aEl.parentElement.parentElement.parentElement;
                
                let cover = null;
                if (container) {
                    const imgEl = container.querySelector('img');
                    if (imgEl) {
                        // Check lazy-loading attributes first
                        cover = imgEl.getAttribute('data-src') || 
                                imgEl.getAttribute('data-original') || 
                                imgEl.getAttribute('src');
                        
                        // Make image URL absolute if needed
                        if (cover && cover.startsWith('/')) {
                            cover = 'https://libread.com' + cover;
                        }
                    }
                }
                
                // Try to find the latest chapter text
                let chapters = "Chapters";
                if (container) {
                    const chapEl = container.querySelector('.chapter, .latest-chapter, .text-info, .chapter-title');
                    if (chapEl && chapEl.innerText.trim()) {
                        chapters = chapEl.innerText.trim();
                    }
                }
                
                // Avoid pushing duplicates
                if (!results.find(r => r.url === url)) {
                    results.push({ title, url, chapters, cover, source: 'LibRead' });
                }
            } catch (error) {
                // If one novel fails to parse, catch the error so the rest of the list still loads
                console.warn('Scraping error on LibRead item:', error);
            }
        });
        
        return results;
    })();`
};