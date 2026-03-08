module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.2.7',
  icon: 'https://annas-archive.gl/favicon.ico',
  categories: [
    { id: 'recent', name: 'Recent' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'nonfiction', name: 'Non-Fiction' },
    { id: 'comics', name: 'Comics' }
  ],
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

    getNovelDetailsScript: () => `
        (() => {
            // --- STEP 1: Final Download Link Extraction ---
            let downloadLink = window.location.href; 

            // Look for the span that specifically contains the full momot.rs URL
            // This is found on the page AFTER clicking the "no waitlist" server.
            const finalUrlSpan = document.querySelector('span.break-all');
            
            if (finalUrlSpan && finalUrlSpan.innerText.trim().startsWith('http')) {
                downloadLink = finalUrlSpan.innerText.trim();
            } else {
                // If we aren't on the final page yet, find the first "No Waitlist" server link
                const slowLinks = Array.from(document.querySelectorAll('a[href*="/slow_download/"]'));
                const noWaitlistLink = slowLinks.find(link => 
                    link.parentElement.textContent.toLowerCase().includes('no waitlist')
                );
                if (noWaitlistLink) {
                    downloadLink = noWaitlistLink.href;
                }
            }

            // --- STEP 2: Metadata Extraction ---
            const titleEl = document.querySelector('.font-semibold.text-2xl');
            const title = titleEl ? titleEl.innerText.trim().replace('🔍', '').trim() : '';
            
            const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
            let author = 'Unknown';
            if (authorEl) {
                const authorLink = authorEl.closest('a');
                if (authorLink) author = authorLink.innerText.trim();
            }
            
            const publisherEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--company]');
            let publisher = '';
            if (publisherEl) {
                const publisherLink = publisherEl.closest('a');
                if (publisherLink) {
                    const fullText = publisherLink.innerText.trim();
                    publisher = fullText.split(',')[0].trim();
                }
            }
            
            const descEl = document.querySelector('.js-md5-top-box-description');
            let description = '';
            if (descEl) {
                const lines = Array.from(descEl.querySelectorAll('div')).map(div => div.innerText.trim());
                description = lines.filter(line => line.length > 0).join('\\n');
            }
            
            const metadataEl = document.querySelector('.text-gray-800.dark\\\\:text-slate-400');
            const metadata = metadataEl ? metadataEl.innerText.trim() : '';
            
            let cover = null;
            const coverContainer = document.querySelector('div[id^="cover_aarecord_id__md5:"]');
            if (coverContainer) {
                const coverImg = coverContainer.querySelector('img');
                if (coverImg) {
                    cover = coverImg.getAttribute('data-src') || coverImg.src;
                    if (cover && cover.startsWith('/')) cover = 'https://annas-archive.gl' + cover;
                }
            }

            return {
                title: title,
                description: description || 'No description available.',
                author: author,
                lastChapter: metadata,
                firstChapterUrl: downloadLink, // Now extracts the momot.rs link correctly
                allChapters: [], 
                cover: cover,
                publisher: publisher
            };
        })();`,

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
};