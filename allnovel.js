module.exports = {
    id: 'allnovel',
    name: 'AllNovel',
    getPopularUrl: () => `https://allnovel.org/most-viewed`,

    getSearchUrl: (query) => `https://allnovel.org/search?keyword=${encodeURIComponent(query).replace(/%20/g, '+')}`,

    getNovelDetailsScript: () => `
        (() => {
            // 1. Description (Check multiple selectors)
            const descEl = document.querySelector('.desc-text, .summary, .description, #description');
            const description = descEl ? descEl.innerText.trim() : "No description available.";

            // 2. Author
            const authorEl = document.querySelector('.author, .info-item a, a[href*="author"]');
            const author = authorEl ? authorEl.innerText.trim() : "Unknown";

            // 3. Chapters (Optimized for 2000+ chapters)
            const chapterLinks = document.querySelectorAll('ul.list-chapter li a, .chapter-list a, #list-chapter a');
            const allChapters = Array.from(chapterLinks).map(a => ({
                title: a.innerText.trim(),
                url: a.href
            }));

            // 4. Meta Info
            const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
            const firstChEl = document.querySelector('a.btn-read-now, a[href*="chapter-1"], .read-first');
            const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

            return {
                description,
                author,
                lastChapter: lastChText, 
                firstChapterUrl,
                allChapters: allChapters.slice(0, 500) // Safety: Only send the first 500 chapters to prevent IPC crash
            };
        })();`,

    getSearchScript: () => `
    (() => {
        const results = [];
        
        // Updated container class to .list-truyen
        const novelRows = document.querySelectorAll('.list-truyen > .row');
        
        novelRows.forEach(row => {
            // Get title and URL
            const titleLink = row.querySelector('.truyen-title a');
            if (!titleLink) return;
            
            const title = titleLink.innerText.trim();
            
            let url = titleLink.getAttribute('href');
            if (url && url.startsWith('/')) {
                url = 'https://allnovel.org' + url;
            } else if (url && !url.startsWith('http')) {
                url = titleLink.href; 
            }
            
            // Get cover image from the new structure
            const imgEl = row.querySelector('.col-xs-3 img');
            let cover = null;
            if (imgEl) {
                cover = imgEl.getAttribute('src');
                if (cover && cover.startsWith('/')) {
                    cover = 'https://allnovel.org' + cover;
                }
            }
            
            // Get latest chapter
            let chapters = "View Info";
            const chapterLink = row.querySelector('.col-xs-2.text-info .chapter-text');
            if (chapterLink) {
                chapters = chapterLink.innerText.trim();
            }
            
            if (title && url) {
                results.push({ title, url, chapters, cover, source: 'AllNovel' });
            }
        });
        
        return results;
    })();`
};