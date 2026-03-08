module.exports = {
    id: 'pawread',
    name: 'PawRead',
    version: '1.1.0',
    icon: 'https://pawread.com/favicon.ico', // Standard favicon
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    // 2. Map category URLs with pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://pawread.com/list';
        const pageParam = page > 1 ? `?page=${page}` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/most-popular/${pageParam}`;
            case 'latest': return `${baseUrl}/latest-release/${pageParam}`;
            case 'completed': return `${baseUrl}/completed/${pageParam}`;
            default: return `${baseUrl}/most-popular/${pageParam}`;
        }
    },
    
    // 3. Search URL with pagination (Keeping your encoded keyword logic)
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        return `https://pawread.com/search/?keyword=${encodedQuery}${page > 1 ? '&page=' + page : ''}`;
    },

    // 4. Details Extraction
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.description, .summary, .comic_detail_txt, #desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('.author, .comic_detail_info a[href*="author"], a[href*="author"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters
        const chapterLinks = document.querySelectorAll('.chapter-list a, #chapterlist a, ul.chapters li a, .list-chapter li a');
        let allChapters = Array.from(chapterLinks).map(a => ({
            title: a.title || a.innerText.trim(),
            url: a.href
        }));

        // Safety Check: Some PawRead themes list newest chapters first.
        // We do a quick check to see if we need to reverse the array so Chapter 1 is at the top.
        if (allChapters.length > 1) {
            const firstTitle = allChapters[0].title.toLowerCase();
            const lastTitle = allChapters[allChapters.length - 1].title.toLowerCase();
            const firstMatch = firstTitle.match(/\\d+/);
            const lastMatch = lastTitle.match(/\\d+/);
            
            if (firstMatch && lastMatch) {
                if (parseInt(firstMatch[0]) > parseInt(lastMatch[0])) {
                    allChapters.reverse();
                }
            }
        }

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Read First" button or fallback to the first chapter in the list
        const firstChEl = document.querySelector('.btn-read, .read-btn, a[href*="chapter-1"]');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Truncate to prevent IPC memory crash
        };
    })();`,
    
    // 5. Renamed to getListScript (Uses your advanced layout traversal logic)
    getListScript: () => `
    (() => {
        const results = [];
        
        // Scope the search to the main container so we don't accidentally scrape the sidebar
        const mainContent = document.querySelector('.main-content, .left-column, .search-container, .list-container, .col-md-8, #main') || document;
        const titleLinks = mainContent.querySelectorAll('.book-title a, .novel-title a, h3 a');
        
        titleLinks.forEach(aEl => {
            try {
                // CRITICAL FIX: Ignore sidebar, widget, and recommendation items!
                if (aEl.closest('.sidebar, .widget, .recommend, .popular, .right-column')) return;

                const title = aEl.innerText.trim();
                let url = aEl.getAttribute('href');
                
                if (!title || !url || url.startsWith('javascript:')) return;
                
                if (url.startsWith('/')) {
                    url = 'https://pawread.com' + url;
                } else if (!url.startsWith('http')) {
                    url = aEl.href;
                }
                
                let cover = null;
                let chapters = "Free";
                
                let currentElement = aEl.parentElement;
                let imgEl = null;
                let chapEl = null;
                let maxClimbs = 5; 
                
                while (currentElement && maxClimbs > 0) {
                    if (!imgEl) imgEl = currentElement.querySelector('img');
                    
                    if (!chapEl) {
                        const links = currentElement.querySelectorAll('a');
                        for (let link of links) {
                            const linkText = link.innerText.trim().toLowerCase();
                            if ((linkText.includes('chapter') || linkText.includes('ch.')) && linkText !== title.toLowerCase()) {
                                chapEl = link;
                                break;
                            }
                        }
                    }
                    if (imgEl && chapEl) break;
                    currentElement = currentElement.parentElement;
                    maxClimbs--;
                }
                
                if (imgEl) {
                    cover = imgEl.getAttribute('data-src') || 
                            imgEl.getAttribute('data-original') || 
                            imgEl.getAttribute('src');
                    if (cover && cover.startsWith('/')) cover = 'https://pawread.com' + cover;
                }
                
                if (chapEl && chapEl.innerText.trim()) {
                    chapters = chapEl.innerText.trim();
                } else {
                    const parentText = aEl.parentElement.parentElement.innerText;
                    const chapMatch = parentText.match(/(Chapter\\s*\\d+|Ch\\.\\s*\\d+)/i);
                    if (chapMatch) chapters = chapMatch[1];
                }
                
                if (!results.find(r => r.url === url)) {
                    results.push({ title, url, chapters, cover, source: 'PawRead' });
                }
                
            } catch (error) {
                console.warn('Scraping error on PawRead:', error);
            }
        });
        
        return results;
    })();`
};