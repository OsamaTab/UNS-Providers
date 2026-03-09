module.exports = {
    id: 'readfromnet',
    name: 'ReadFrom.Net',
    version: '1.5.0',
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
        // 1. Title Selection (Cleaned up formatting)
        // Removes the weird spacing and hidden spans from the title
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
            // Delete any hidden tracking spans or images inside the text box
            mainContainer.querySelectorAll('script, style, iframe, .masha_index, a.highslide').forEach(el => el.remove());
            
            // The browser's innerText automatically converts <br> tags into clean newlines.
            // We split by newline, clean up spaces, and filter out short lines.
            paragraphs = mainContainer.innerText.split('\\n')
                .map(p => p.trim())
                .filter(text => text.length > 5 && !text.includes('CancelReport') && !text.includes('Support this site'));
        } else {
            // Fallback just in case some books don't use #textToRead
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

        // --- 3. BULLETPROOF NEXT URL FINDER ---
        let nextUrl = null;

        // The HTML provides multiple .page_next a elements. We loop through them 
        // to grab the first one that has an actual, valid http link.
        const exactNextBtns = Array.from(document.querySelectorAll('.page_next a'));
        for (let btn of exactNextBtns) {
            if (btn.href && btn.href.startsWith('http') && !btn.href.includes('javascript:')) {
                nextUrl = btn.href;
                break; // Found it!
            }
        }

        // Fallback for weird layouts
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