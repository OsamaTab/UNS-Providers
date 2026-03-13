module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.3.3',
  icon: 'https://annas-archive.gl/favicon.ico',
  mode: 'download',

  categories: [
    { id: 'recent', name: 'Recent' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'nonfiction', name: 'Non-Fiction' },
    { id: 'comics', name: 'Comics' }
  ],
  
  getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://annas-archive.gl';
        const categoryParams = {
            'recent': '&sort=newest', 'fiction': '&fiction=1',
            'nonfiction': '&fiction=0', 'comics': '&comics=1'
        };
        return `${baseUrl}/search?index=&page=${page}${categoryParams[categoryId] || ''}&q=`;
  },

  getSearchUrl: (query, page = 1) => `https://annas-archive.gl/search?index=&page=${page}&sort=&display=&q=${encodeURIComponent(query)}`,

  getNovelDetailsScript: () => `
        (() => {
            // Find all "Slow Partner Server" links
            const slowLinks = Array.from(document.querySelectorAll('a[href*="/slow_download/"]'));
            
            // Look for the first link where the parent element's text contains "no waitlist"
            const noWaitlistLink = slowLinks.find(link => {
                const parentText = link.parentElement ? link.parentElement.textContent.toLowerCase() : '';
                return parentText.includes('no waitlist');
            });

            // Set the download link to the "no waitlist" server, or fallback to the first available one
            const downloadPageLink = noWaitlistLink ? noWaitlistLink.href : (slowLinks.length > 0 ? slowLinks[0].href : null);

            // Metadata Extraction
            const titleEl = document.querySelector('.font-semibold.text-2xl');
            const title = titleEl ? titleEl.innerText.trim().replace('🔍', '').trim() : '';
            
            const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
            const author = authorEl ? authorEl.closest('a').innerText.trim() : 'Unknown';
            
            const descEl = document.querySelector('.js-md5-top-box-description');
            const description = descEl ? Array.from(descEl.querySelectorAll('div')).map(div => div.innerText.trim()).filter(l => l.length > 0).join('\\n') : 'No description available.';
            
            let cover = null;
            const coverImg = document.querySelector('div[id^="cover_aarecord_id__md5:"] img');
            if (coverImg) {
                cover = coverImg.getAttribute('data-src') || coverImg.src;
                if (cover && cover.startsWith('/')) cover = 'https://annas-archive.gl' + cover;
            }

            return {
                title, description, author, cover,
                lastChapter: "Full Book", 
                firstChapterUrl: downloadPageLink, // Passes the optimal page to the main process
                allChapters: [] 
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
    
    getDownloadUrlScript: () => `
        (() => {
            // Check for the direct text link
            const span = document.querySelector('span.break-all');
            if (span && span.innerText.trim().startsWith('http')) {
                return span.innerText.trim();
            }
            
            // Fallback to checking anchor tags
            const links = Array.from(document.querySelectorAll('a'));
            const fileLink = links.find(a => 
                a.innerText.toLowerCase().includes('download') || 
                a.href.includes('.epub') || 
                a.href.includes('.pdf')
            );
            return fileLink ? fileLink.href : null;
        })();
  `,
};