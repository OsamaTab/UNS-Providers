module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.5',
    icon: 'https://annas-archive.gl/favicon.ico',

    // Categories (adapted for Anna's Archive)
    categories: [
        { id: 'recent', name: 'Recent' },
        { id: 'fiction', name: 'Fiction' },
        { id: 'nonfiction', name: 'Non-Fiction' },
        { id: 'comics', name: 'Comics' }
    ],

    // Category URL builder (adapted for Anna's Archive)
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://annas-archive.gl';
        const categoryParams = {
            'recent': '&sort=newest',
            'fiction': '&fiction=1',
            'nonfiction': '&fiction=0',
            'comics': '&comics=1'
        };
        const sortParam = categoryParams[categoryId] || '';
        return `${baseUrl}/search?index=&page=${page}${sortParam}&q=`;
    },

    // Search URL
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query);
        return `https://annas-archive.gl/search?index=&page=${page}&sort=&display=&q=${encodedQuery}`;
    },

    // Novel details script (adapted from FreeWebNovel)
    getNovelDetailsScript: () => `
    (() => {
        // Get description - look for the book description text
        const descEl = document.querySelector('.js-vim-focus p, .prose p, .text-gray-700');
        const description = descEl ? descEl.innerText.trim() : "No description available.";
        
        // Get author/creator
        const authorEl = document.querySelector('a[href*="/creator/"], .text-gray-600 a[href*="/search?q="]');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown";
        
        // Get all file formats/versions as "chapters"
        const fileLinks = document.querySelectorAll('a[href*="/md5/"], a[href*="/nexusstc/"]');
        const allFormats = Array.from(fileLinks).map(a => ({
            title: a.querySelector('h3')?.innerText?.trim() || a.innerText.trim().substring(0, 50),
            url: a.href
        }));
        
        // Get first available format URL
        const firstFileEl = document.querySelector('a[href*="/md5/"]');
        const firstFileUrl = firstFileEl ? firstFileEl.href : window.location.href;

        // Get metadata (size, language, year)
        const metaEl = document.querySelector('.text-gray-500, .text-xs');
        const lastChapter = metaEl ? metaEl.innerText.trim() : "N/A";

        return {
            description,
            author,
            lastChapter, // Using this for metadata
            firstChapterUrl: firstFileUrl, // Renamed but using for first file
            allChapters: allFormats.slice(0, 100) // Limit to 100 formats
        };
    })();`,

    // Chapter script (adapted for file details page)
    getChapterScript: () => `
    (() => {
        // Get file title
        const title = document.querySelector('h1, h2, .text-3xl')?.innerText?.trim() || "File Details";
        
        // Get file information as paragraphs
        const infoContainer = document.querySelector('.prose, .bg-gray-50, .rounded-lg');
        let paragraphs = [];
        
        if (infoContainer) {
            // Get all text content split into paragraphs
            paragraphs = Array.from(infoContainer.querySelectorAll('p, div:not(:has(*))'))
                .map(el => el.textContent.trim())
                .filter(text => text.length > 10);
        }

        // If no paragraphs found, get metadata
        if (paragraphs.length === 0) {
            const metaItems = document.querySelectorAll('.grid .col-span-1, .flex.justify-between');
            paragraphs = Array.from(metaItems)
                .map(el => el.textContent.trim())
                .filter(text => text.length > 0);
        }

        // Find download link as "next" button
        const downloadBtn = Array.from(document.querySelectorAll('a')).find(a => {
            const text = (a.innerText || '').toLowerCase();
            return text.includes('slow') || 
                   text.includes('external') || 
                   text.includes('download') ||
                   a.href.includes('libgen') ||
                   a.href.includes('ipfs');
        });

        return {
            title: title,
            paragraphs: paragraphs.length > 0 ? paragraphs : ["No details available."],
            nextUrl: downloadBtn ? downloadBtn.href : null
        };
    })();`,

    // List script (updated with better cover handling)
    getListScript: () => `
    (() => {
        const results = [];
        
        const parseItem = (item) => {
            const linkEl = item.querySelector('h3 a') || item.querySelector('a');
            if (!linkEl) return;

            const title = linkEl.innerText.trim();
            const url = linkEl.href;
            
            const metaContainer = item.querySelector('.text-gray-500, .text-xs, .text-sm');
            const metaText = metaContainer ? metaContainer.innerText : '';
            
            // IMPROVED COVER HANDLING
            let cover = null;
            
            // Try multiple ways to get the cover
            const imgEl = item.querySelector('img');
            if (imgEl) {
                // Try data-src first (lazy loading)
                cover = imgEl.getAttribute('data-src') || 
                        imgEl.getAttribute('data-lazy-src') || 
                        imgEl.src;
                
                // Clean up the URL
                if (cover) {
                    // Handle relative URLs
                    if (cover.startsWith('//')) {
                        cover = 'https:' + cover;
                    } else if (cover.startsWith('/')) {
                        cover = 'https://annas-archive.gl' + cover;
                    }
                    
                    // Remove size limitations if present
                    cover = cover.replace(/&w=\d+/, '').replace(/&h=\d+/, '');
                    
                    // Anna's Archive sometimes uses placeholder images
                    if (cover.includes('placeholder') || cover.includes('1x1')) {
                        // Try to get a better cover from other attributes
                        const parentDiv = imgEl.closest('div');
                        if (parentDiv) {
                            const style = parentDiv.getAttribute('style');
                            if (style && style.includes('background-image')) {
                                const match = style.match(/url\\(['"]?([^'"]+)['"]?\\)/);
                                if (match) cover = match[1];
                            }
                        }
                    }
                }
            }
            
            // If no cover found, try looking for cover in background images
            if (!cover || cover.includes('placeholder')) {
                const coverDiv = item.querySelector('[style*="background-image"]');
                if (coverDiv) {
                    const style = coverDiv.getAttribute('style');
                    const match = style.match(/url\\(['"]?([^'"]+)['"]?\\)/);
                    if (match) {
                        cover = match[1];
                        if (cover.startsWith('/')) {
                            cover = 'https://annas-archive.gl' + cover;
                        }
                    }
                }
            }

            results.push({
                title: title,
                url: url.startsWith('http') ? url : 'https://annas-archive.gl' + url,
                chapters: metaText.trim(),
                cover: cover,
                sourceId: 'annas'
            });
        };

        // Multiple selector strategies
        document.querySelectorAll('[class*="h-[125px]"], .js-vim-focus, .flex.items-start, article, [data-testid="result-item"]').forEach(parseItem);
        
        document.querySelectorAll('a[href*="/md5/"], a[href*="/nexusstc/"], a[href*="/details/"]').forEach(link => {
            const container = link.closest('div[class*="flex"], div[class*="relative"], article, li');
            if (container && !results.some(r => r.url === link.href)) {
                parseItem(container);
            }
        });

        return results;
    })();`,

    // Download link script (updated)
    getDownloadLinkScript: () => `
    (() => {
        // Look for download links
        const links = Array.from(document.querySelectorAll('a[href*="libgen"], a[href*="ipfs"], a[href*="download"], a[href*="archive.org"]'));
        
        const downloadButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
            el.innerText.toLowerCase().includes('slow') ||
            el.innerText.toLowerCase().includes('external') ||
            el.innerText.toLowerCase().includes('download') ||
            el.innerText.toLowerCase().includes('mirror')
        );
        
        const allLinks = [...links, ...downloadButtons.map(b => b.href ? b : b.querySelector('a')).filter(Boolean)];
        
        return allLinks.length > 0 ? allLinks[0].href : null;
    })()`
};