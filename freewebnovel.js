module.exports = {
    id: 'freewebnovel',
    name: 'FreeWebNovel',
    version: '1.0.1', // Remember to update this to trigger the 'Update' button!
    icon: 'https://freewebnovel.com/static/freewebnovel/images/logo.png',
    getPopularUrl: () => `https://freewebnovel.com/most-popular-novel/`,
    getSearchUrl: (query) => `https://freewebnovel.com/search?searchkey=${encodeURIComponent(query)}`,

    getNovelDetailsScript: () => `
    (() => {
        // 1. Get the description (FreeWebNovel uses .txt)
        const descEl = document.querySelector('.m-desc, .txt, .inner');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // 2. Get the author
        const authorEl = document.querySelector('.au a, .author a, span[itemprop="author"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown";

        // 3. Get all chapters from the list
        // FreeWebNovel usually has chapters in a div with id 'itemContainer' or class 'm-newest2'
        const chapterLinks = document.querySelectorAll('#itemContainer li a, .m-newest2 li a, .chapter-list li a');
        const allChapters = Array.from(chapterLinks).map(a => ({
            title: a.title || a.innerText.trim(),
            url: a.href
        }));

        // 4. Meta info for the UI
        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Read First" button or first chapter link
        const firstChEl = document.querySelector('a.btn-read, a[href*="chapter-1"]');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText, 
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Truncate to prevent IPC memory crash
        };
    })();`,

    getSearchScript: () => `
    (() => {
        const results = [];
        const rows = document.querySelectorAll('.li-row, .item');
        
        rows.forEach(row => {
            const titleLink = row.querySelector('.tit a, h3 a');
            if (!titleLink) return;
            
            const title = titleLink.title || titleLink.innerText.trim();
            const url = titleLink.href;
            
            // Image extraction with lazy-load support
            const imgEl = row.querySelector('img');
            let cover = null;
            if (imgEl) {
                cover = imgEl.getAttribute('data-src') || imgEl.src;
                if (cover && cover.startsWith('/')) cover = 'https://freewebnovel.com' + cover;
            }
            
            const chapterEl = row.querySelector('.s1 a, .chapter');
            const chapters = chapterEl ? chapterEl.innerText.trim() : "View Info";
            
            if (title && url && !results.find(r => r.url === url)) {
                results.push({ title, url, chapters, cover, source: 'FreeWebNovel' });
            }
        });
        return results;
    })();`
};