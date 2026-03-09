module.exports = {
    id: 'readfromnet',
    name: 'ReadFrom.Net',
    version: '1.4.0',
    icon: 'https://static.readfrom.net//templates/readfromnet/images/logo41.png',
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Home / Popular' },
        { id: 'latest', name: 'Latest Books' }
    ],

    // 2. Map category URLs with DLE-style pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://readfrom.net';
        const pagePath = page > 1 ? `page/${page}/` : '';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}/home/${pagePath}`;
            case 'latest': return `${baseUrl}/${pagePath}`;
            default: return `${baseUrl}/home/${pagePath}`;
        }
    },
    
    // 3. Search URL with basic pagination fallback
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        return `https://readfrom.net/build_in_search/?q=${encodedQuery}${page > 1 ? '&page=' + page : ''}`;
    },

    getChapterScript: () => `
    (() => {
        // 1. Title Selection
        const titleEl = document.querySelector('h1, h2, .b-title, .chapter-title, .tit, .page-header');
        const title = titleEl ? titleEl.innerText.trim() : 'Untitled Page';
        
        // 2. DOM SANITIZATION (Delete the junk before reading)
        const junkSelectors = [
            'script', 'style', 'iframe', 'button', 'select', 'noscript', 
            '.splitnewsnavigation', '.page_prev', '.page_next', 
            '[id^="image"]', 'label', 'input', '.ad', '#holder'
        ];
        document.querySelectorAll(junkSelectors.join(', ')).forEach(el => el.remove());

        // 3. Content Selection
        const contentSelectors = ['.book-text', '#content', '.page-content', '.story', 'article'];
        let paragraphs = [];
        
        for (let selector of contentSelectors) {
            const container = document.querySelector(selector);
            if (!container) continue;

            // Try standard <p> tags first
            const pTags = Array.from(container.querySelectorAll('p'))
                .map(p => p.innerText.trim())
                .filter(text => text.length > 0 && !text.includes('CancelReport Ad'));
            
            if (pTags.length > 0) {
                paragraphs = pTags;
                break;
            }

            // Fallback: Read raw text nodes (for sites that just use <br> tags)
            // TreeWalker perfectly extracts text without grabbing HTML wrappers
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
                const text = node.textContent.trim();
                // Filter out tiny UI strings, ad remnants, and empty lines
                if (text.length > 15 && !text.includes('Support this site') && !text.includes('CancelReport Ad')) {
                    paragraphs.push(text);
                }
            }
            if (paragraphs.length > 0) break;
        }

        // --- 4. EXACT NEXT URL FINDER ---
        let nextUrl = null;

        const exactNextBtn = document.querySelector('.page_next a');
        if (exactNextBtn && exactNextBtn.href) {
            nextUrl = exactNextBtn.href;
        }

        if (!nextUrl) {
            const nextBtn = Array.from(document.querySelectorAll('a')).find(a => {
                const text = (a.innerText || a.textContent || '').toLowerCase().trim();
                const parentClass = (a.parentElement?.className || '').toLowerCase();
                const parentTitle = (a.parentElement?.getAttribute('title') || '').toLowerCase();
                const absoluteHref = a.href || '';

                if (!absoluteHref.startsWith('http') || absoluteHref.split('#')[0] === window.location.href.split('#')[0]) {
                    return false;
                }

                if (text.includes('prev') || parentClass.includes('prev') || parentTitle.includes('prev')) {
                    return false;
                }

                return text.includes('next') || text.includes('>>') || text === '>' ||
                       parentClass.includes('next') || parentTitle.includes('next');
            });

            if (nextBtn) {
                nextUrl = nextBtn.href;
            }
        }

        return {
            title: title,
            paragraphs: paragraphs,
            nextUrl: nextUrl
        };
    })();`,

    // 4. Details Extraction (Tailored for Ebook/Page-based layouts)
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.full-text, .story, [itemprop="description"], .book-desc');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('a[href*="/author/"], h5.title a, .author a, [itemprop="author"]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters / Pages
        // ReadFrom.Net often uses a 'select' dropdown for pages, or a standard list
        let allChapters = [];
        
        const selectOptions = document.querySelectorAll('select[name="goto"] option, select.goto option, select.jump option');
        if (selectOptions.length > 0) {
            allChapters = Array.from(selectOptions).map(opt => {
                let url = opt.value;
                if (url && url.startsWith('/')) url = window.location.origin + url;
                return { title: opt.innerText.trim(), url: url };
            }).filter(ch => ch.url && ch.url !== window.location.origin);
        } else {
            const chapterLinks = document.querySelectorAll('.navigation a, .pages a, .toc a, .book-pages a');
            allChapters = Array.from(chapterLinks).map((a, i) => ({
                title: a.innerText.trim() || \`Page \${i + 1}\`,
                url: a.href
            }));
        }

        // Fallback for single-page short stories
        if (allChapters.length === 0) {
            allChapters = [{ title: "Read Book", url: window.location.href }];
        }

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        const firstChEl = document.querySelector('.read-btn, a[href*="/read/"]');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Truncate to prevent IPC memory crash
        };
    })();`,
    
    // 5. Renamed to getListScript (Uses your specific extraction logic)
    getListScript: () => `
    (() => {
        const results = [];
        
        // Target the actual container for each search result
        const resultItems = document.querySelectorAll('.box_in');
        
        resultItems.forEach(item => {
            try {
                // 1. Get Title and URL
                const titleLink = item.querySelector('h2.title a');
                if (!titleLink) return;
                
                const title = titleLink.innerText.trim();
                let url = titleLink.getAttribute('href');
                
                // Skip invalid entries
                if (!title || !url || url.startsWith('javascript:')) return;
                
                // Safely build absolute URLs
                if (url.startsWith('/')) {
                    url = 'https://readfrom.net' + url;
                } else if (!url.startsWith('http')) {
                    url = titleLink.href;
                }
                
                // 2. Get Cover Image
                let cover = null;
                // The image is directly inside the container, usually wrapped in an <a> tag
                const imgEl = item.querySelector('img');
                if (imgEl) {
                    cover = imgEl.getAttribute('src');
                    
                    // Ensure image URLs are absolute
                    if (cover && cover.startsWith('/')) {
                        cover = 'https://readfrom.net' + cover;
                    }
                }
                
                // 3. Get Author (Used in place of 'chapters' since this is an Ebook site)
                let chapters = "Ebook";
                const authorLink = item.querySelector('h5.title a');
                if (authorLink) {
                    chapters = authorLink.innerText.trim();
                }
                
                // Deduplicate results
                if (!results.find(r => r.url === url)) {
                    results.push({ title, url, chapters, cover, source: 'ReadFrom.Net' });
                }
                
            } catch (error) {
                console.warn('Scraping error on ReadFrom.Net item:', error);
            }
        });
        
        return results;
    })();`
};