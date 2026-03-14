module.exports = {
    id: 'readsonlinefree',
    name: 'Reads Online Free',
    version: '1.0.3', 
    icon: 'https://readsonlinefree.com/theme/01/assets/img/book42.png',

    categories: [
        { id: 'popular', name: 'Home / Popular' },
        { id: 'latest', name: 'Latest Books' }
    ],

    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://readsonlinefree.com';
        const pagePath = page > 1 ? `page/${page}/` : '';
        switch (categoryId) {
            case 'popular': return `${baseUrl}/hot/${pagePath}`;
            case 'latest': return `${baseUrl}/latest/${pagePath}`;
            default: return `${baseUrl}/${pagePath}`;
        }
    },

    // Updated exactly to match the URL structure you provided
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query);
        const pagePath = page > 1 ? `/p/${page}` : '';
        return `https://readsonlinefree.com/search/q/${encodedQuery}${pagePath}`;
    },

    // UPDATED: Now looks for the background-image styles and div.h2 titles
    getListScript: () => `
    (() => {
        const results = [];
        const BASE_URL = 'https://readsonlinefree.com';

        // Look for the specific list structure from your HTML
        const items = document.querySelectorAll('ul.books li a, .p-list-5 li a');

        items.forEach(link => {
            try {
                // 1. Get Title from the <div class="h2">
                const titleEl = link.querySelector('.h2');
                if (!titleEl) return;
                const title = titleEl.innerText.trim() || titleEl.getAttribute('title');

                // 2. Get URL
                let url = link.href;
                if (!url || url.includes('javascript:')) return;

                // 3. Get Cover from the background-image style attribute
                let cover = null;
                const imgDiv = link.querySelector('.i1');
                if (imgDiv) {
                    const style = imgDiv.getAttribute('style') || '';
                    const match = style.match(/url\\(['"]?(.*?)['"]?\\)/);
                    if (match && match[1]) {
                        cover = match[1];
                        if (cover.startsWith('//')) cover = 'https:' + cover;
                        else if (cover.startsWith('/')) cover = BASE_URL + cover;
                    }
                }

                results.push({ 
                    title, 
                    url, 
                    chapters: 'Ebook', 
                    cover, 
                    source: 'Reads Online Free' 
                });
            } catch (error) {
                console.warn('Error parsing item', error);
            }
        });

        return results;
    })();`,

    // UPDATED: Simplified to handle the fact that the "Details" page IS the first reading page
    getNovelDetailsScript: () => `
    (() => {
        const titleEl = document.querySelector('h2.title');
        let title = titleEl ? titleEl.innerText.replace(/, Page \\d+/i, '').trim() : document.title;
        
        const authorEl = document.querySelector('b a[href^="/"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Since the user is already on the reading page, the first chapter is the current URL
        return {
            description: "No description available on reading view.",
            author: author,
            lastChapter: "Latest Page",
            firstChapterUrl: window.location.href,
            allChapters: [{ title: "Read Book", url: window.location.href }]
        };
    })();`,

    // UPDATED: Now parses the textToRead container, <br> tags, and grabs the page_next link safely
    getChapterScript: () => `
    (() => {
        // 1. Title Extraction
        const titleEl = document.querySelector('h2.title');
        const title = titleEl ? titleEl.innerText.trim() : 'Untitled Page';

        // 2. Safely grab the NEXT URL before we delete any DOM elements
        let nextUrl = null;
        const nextBtn = document.querySelector('.page_next a');
        if (nextBtn && nextBtn.href && nextBtn.href.startsWith('http')) {
            nextUrl = nextBtn.href;
        }

        // 3. Content Extraction
        let paragraphs = [];
        const container = document.querySelector('#textToRead');

        if (container) {
            // Remove the cover image and highslide links inside the text
            container.querySelectorAll('script, style, a.highslide, img').forEach(el => el.remove());

            // Grab HTML to preserve line breaks, convert <br> to actual newlines, and clear &nbsp;
            let rawHtml = container.innerHTML;
            rawHtml = rawHtml.replace(/<br\\s*\\/?>/gi, '\\n');
            rawHtml = rawHtml.replace(/&nbsp;/g, ' ');

            // Strip remaining HTML tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawHtml;
            const cleanText = tempDiv.textContent || tempDiv.innerText || "";

            // Split and filter
            paragraphs = cleanText.split('\\n')
                .map(p => p.trim())
                .filter(text => {
                    if (text.length < 2) return false;
                    // Filter out the DRM warning they put at the top of books
                    if (text.includes('enjoy reading it on your personal devices')) return false;
                    if (text.includes('Copyright infringement is against the law')) return false;
                    return true;
                });
        }

        return {
            title: title,
            paragraphs: paragraphs,
            nextUrl: nextUrl
        };
    })();`
};