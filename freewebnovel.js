module.exports = {
    id: 'freewebnovel',
    name: 'FreeWebNovel',
    version: '1.1.1',
    icon: 'https://freewebnovel.com/static/freewebnovel/images/logo.png',

    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latestNovel', name: 'Latest Novel' },
        { id: 'latestRelease', name: 'Latest Releases' },
        { id: 'completed', name: 'Completed' }
    ],

    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://freewebnovel.com';
        const pageSuffix = page > 1 ? `${page}.html` : '';
        switch (categoryId) {
            case 'popular': return `${baseUrl}/sort/most-popular/${pageSuffix}`;
            case 'latestNovel': return `${baseUrl}/sort/latest-novel/${pageSuffix}`;
            case 'latestRelease': return `${baseUrl}/sort/latest-release/${pageSuffix}`;
            case 'completed': return `${baseUrl}/sort/completed-novel/${pageSuffix}`;
            default: return `${baseUrl}/sort/most-popular/${pageSuffix}`;
        }
    },

    getSearchUrl: (query, page = 1) => {
        return `https://freewebnovel.com/search?searchkey=${encodeURIComponent(query)}${page > 1 ? '&page=' + page : ''}`;
    },

    // NEW: Specialized script for Chapter Content on FreeWebNovel
    getChapterScript: () => `
    (() => {
        // 1. Title Selection
        const title = document.querySelector('.tit, .chr-title, h1, h2')?.innerText?.trim();
        
        // 2. Content Selection (Targeting FreeWebNovel's specific container)
        const container = document.querySelector('#article-content, .txt, .inner-chapter');
        let paragraphs = [];
        
        if (container) {
            // FreeWebNovel often has text nodes separated by <br>. 
            // ChildNodes captures everything correctly.
            paragraphs = Array.from(container.childNodes)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 5); // Ignore empty lines and ads
        }

        // 3. Next Button Selection
        const nextBtn = Array.from(document.querySelectorAll('a')).find(a => {
            const text = (a.innerText || '').toLowerCase();
            const href = a.href || '';
            // Match "Next" but ensure it's a real link and not "Previous"
            return text.includes('next') && 
                   !text.includes('prev') && 
                   href.startsWith('http') && 
                   href !== window.location.href;
        });

        return {
            title: title || 'Untitled Chapter',
            paragraphs: paragraphs,
            nextUrl: nextBtn ? nextBtn.href : null
        };
    })()`,

    getNovelDetailsScript: () => `
    (() => {
        const descEl = document.querySelector('.m-desc, .txt, .inner');
        const description = descEl ? descEl.innerText.trim() : "No description available.";
        const authorEl = document.querySelector('.au a, .author a, span[itemprop="author"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown";
        const chapterLinks = document.querySelectorAll('#itemContainer li a, .m-newest2 li a, .chapter-list li a');
        const allChapters = Array.from(chapterLinks).map(a => ({
            title: a.title || a.innerText.trim(),
            url: a.href
        }));
        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        const firstChEl = document.querySelector('a.btn-read, a[href*="chapter-1"]');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText, 
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500)
        };
    })();`,

    getListScript: () => `
    (() => {
        const results = [];
        const rows = document.querySelectorAll('.li-row, .item');
        rows.forEach(row => {
            const titleLink = row.querySelector('.tit a, h3 a');
            if (!titleLink) return;
            const title = titleLink.title || titleLink.innerText.trim();
            const url = titleLink.href;
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