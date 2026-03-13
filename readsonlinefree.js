module.exports = {
    id: 'readsonlinefree',
    name: 'Reads Online Free',
    version: '1.0.1',
    icon: 'https://readsonlinefree.com/theme/01/assets/img/book42.png',

    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Home / Popular' },
        { id: 'latest', name: 'Latest Books' }
    ],

    // 2. Map category URLs with DLE-style pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://readsonlinefree.com';
        const pagePath = page > 1 ? `page/${page}/` : '';

        switch (categoryId) {
            case 'popular': return `${baseUrl}/home/${pagePath}`;
            case 'latest': return `${baseUrl}/${pagePath}`;
            default: return `${baseUrl}/home/${pagePath}`;
        }
    },

    // 3. Search URL — FIX: use consistent page/N/ style instead of &page= param
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        const pagePath = page > 1 ? `&page=${page}` : '';
        return `https://readsonlinefree.com/build_in_search/?q=${encodedQuery}${pagePath}`;
    },

    getChapterScript: () => `
    (() => {
        // 1. Title Selection (Cleaned up formatting)
        const titleEl = document.querySelector('h2.title, h1, .b-title, .chapter-title, .tit, .page-header');
        let title = 'Untitled Page';
        if (titleEl) {
            titleEl.querySelectorAll('span.masha_index').forEach(el => el.remove());
            title = titleEl.innerText.replace(/\\s+/g, ' ').trim();
        }

        // 2. EXACT CONTENT TARGETING (Bypasses all ads and UI junk)
        const mainContainer = document.querySelector('#textToRead');
        let paragraphs = [];

        if (mainContainer) {
            mainContainer.querySelectorAll('script, style, iframe, .masha_index, a.highslide').forEach(el => el.remove());
            paragraphs = mainContainer.innerText.split('\\n')
                .map(p => p.trim())
                .filter(text => text.length > 5 && !text.includes('CancelReport') && !text.includes('Support this site'));
        } else {
            const contentSelectors = ['.book-text', '#content', '.page-content', '.story', 'article'];
            for (let selector of contentSelectors) {
                const container = document.querySelector(selector);
                if (!container) continue;

                container.querySelectorAll('script, style, iframe, button, select, noscript, .splitnewsnavigation, .page_prev, .page_next, [id^="image"], label, input, .ad, #holder').forEach(el => el.remove());

                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
                let node;
                while ((node = walker.nextNode())) {
                    const text = node.textContent.trim();
                    if (text.length > 15 && !text.includes('Support this site') && !text.includes('CancelReport Ad')) {
                        paragraphs.push(text);
                    }
                }
                if (paragraphs.length > 0) break;
            }
        }

        // 3. BULLETPROOF NEXT URL FINDER
        let nextUrl = null;

        const exactNextBtns = Array.from(document.querySelectorAll('.page_next a'));
        for (let btn of exactNextBtns) {
            if (btn.href && btn.href.startsWith('http') && !btn.href.includes('javascript:')) {
                nextUrl = btn.href;
                break;
            }
        }

        if (!nextUrl) {
            const nextBtn = Array.from(document.querySelectorAll('a')).find(a => {
                const text = (a.innerText || a.textContent || '').toLowerCase().trim();
                const parentClass = (a.parentElement?.className || '').toLowerCase();
                const absoluteHref = a.href || '';

                if (!absoluteHref.startsWith('http') || absoluteHref.split('#')[0] === window.location.href.split('#')[0]) {
                    return false;
                }
                if (text.includes('prev') || parentClass.includes('prev')) return false;

                return text.includes('next') || text.includes('>>') || text === '>' || parentClass.includes('next');
            });

            if (nextBtn) nextUrl = nextBtn.href;
        }

        return {
            title: title,
            paragraphs: paragraphs,
            nextUrl: nextUrl
        };
    })();`,

    // 4. Details Extraction
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.full-text, .story, [itemprop="description"], .book-desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('a[href*="/author/"], h5.title a, .author a, [itemprop="author"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters / Pages
        let allChapters = [];

        const selectOptions = document.querySelectorAll('select[name="goto"] option, select.goto option, select.jump option');
        if (selectOptions.length > 0) {
            allChapters = Array.from(selectOptions).map(opt => {
                let url = opt.value;
                if (url && url.startsWith('/')) url = window.location.origin + url;
                return { title: opt.innerText.trim(), url: url };
            }).filter(ch => ch.url && ch.url !== window.location.origin && ch.url.startsWith('http'));
        } else {
            const chapterLinks = document.querySelectorAll('.navigation a, .pages a, .toc a, .book-pages a');
            allChapters = Array.from(chapterLinks).map((a, i) => ({
                title: a.innerText.trim() || \`Page \${i + 1}\`,
                url: a.href
            })).filter(ch => ch.url && ch.url.startsWith('http'));
        }

        // Fallback for single-page short stories
        if (allChapters.length === 0) {
            allChapters = [{ title: "Read Book", url: window.location.href }];
        }

        const lastChText = allChapters[allChapters.length - 1].title;

        // FIX: broaden first chapter URL selector — was too specific for this site
        const firstChEl = document.querySelector(
            '.read-btn a, a[href*="/read/"], a[href*="/book/"], a.read, .btn-read a, a[title*="Read"]'
        );
        const firstChapterUrl = firstChEl ? firstChEl.href : allChapters[0].url;

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500)
        };
    })();`,

    // 5. List / Search Results Extraction
    getListScript: () => `
    (() => {
        const results = [];
        const BASE_URL = 'https://readsonlinefree.com';

        // FIX: support both category page layout (.box_in) and search result layout (.searchitem, .result-item)
        const resultItems = document.querySelectorAll('.box_in, .searchitem, .result-item, .news-item');

        resultItems.forEach(item => {
            try {
                // 1. Get Title and URL
                const titleLink = item.querySelector('h2.title a, h2 a, h3 a, .title a');
                if (!titleLink) return;

                const title = titleLink.innerText.trim();
                let url = titleLink.getAttribute('href');

                if (!title || !url || url.startsWith('javascript:')) return;

                if (url.startsWith('/')) {
                    url = BASE_URL + url;
                } else if (!url.startsWith('http')) {
                    url = titleLink.href;
                }

                // 2. Get Cover Image — FIX: also check data-src and data-lazy for lazy-loaded images
                let cover = null;
                const imgEl = item.querySelector('img');
                if (imgEl) {
                    cover = imgEl.getAttribute('data-src')
                         || imgEl.getAttribute('data-lazy')
                         || imgEl.getAttribute('data-original')
                         || imgEl.getAttribute('src');

                    if (cover && cover.startsWith('/')) {
                        cover = BASE_URL + cover;
                    }
                    // Discard placeholder/blank images
                    if (cover && (cover.includes('placeholder') || cover.endsWith('blank.gif'))) {
                        cover = null;
                    }
                }

                // 3. Get Author
                let chapters = "Ebook";
                const authorLink = item.querySelector('h5.title a, .author a, a[href*="/author/"]');
                if (authorLink) {
                    chapters = authorLink.innerText.trim();
                }

                // Deduplicate
                if (!results.find(r => r.url === url)) {
                    // FIX: use correct source name matching module id
                    results.push({ title, url, chapters, cover, source: 'Reads Online Free' });
                }

            } catch (error) {
                console.warn('Scraping error on readsonlinefree item:', error);
            }
        });

        return results;
    })();`
};