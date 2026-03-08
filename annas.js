module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.1.0',
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
        return `https://annas-archive.gl/search?q=${encodedQuery}&page=${page}`;
    },

    // Novel details script (adapted from FreeWebNovel)
   getNovelDetailsScript: () => `
    (() => {
        // Get description from the alternative filename and other metadata
        const descEl = document.querySelector('.js-md5-top-box-description, .prose, .text-gray-700');
        let description = "No description available.";
        
        if (descEl) {
            // Try to get alternative filename or other descriptive text
            const altFilename = descEl.querySelector('div:contains("Alternative filename") + div');
            if (altFilename) {
                description = "File: " + altFilename.innerText.trim();
            } else {
                description = descEl.innerText.trim();
            }
        }

        // Get author - look for links with /search?q=author pattern
        const authorEl = document.querySelector('a[href*="/search?q="]:not([href*="publisher"])');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown";

        // Get publisher/year info
        const publisherEl = document.querySelector('a[href*="publisher"], .text-gray-800 a[href*="/search?q="]');
        const publisher = publisherEl ? publisherEl.innerText.trim() : "";
        
        // Get format info from the metadata line
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        const formatInfo = metadataEl ? metadataEl.innerText.trim() : "No format info";

        // Get file information as "chapters" (different file versions/collections)
        const fileLinks = document.querySelectorAll('.js-md5-codes-tabs-tab, [id^="md5-codes-tab-"]');
        const allFormats = Array.from(fileLinks).map(a => ({
            title: a.innerText.trim().substring(0, 50) + (a.innerText.length > 50 ? '...' : ''),
            url: window.location.href + '#' + a.id
        })).filter(f => f.title && f.title.length > 0);

        // Get the main file download URL as first chapter
        const firstFileUrl = window.location.href;

        // Get stats (downloads, lists)
        const statsEl = document.querySelector('.text-gray-500 .whitespace-nowrap');
        const downloads = statsEl ? statsEl.innerText.trim() : "";

        // Get all available metadata from codes panel
        const codesContainer = document.querySelector('.js-md5-codes-container');
        const technicalDetails = [];
        if (codesContainer) {
            const codeTabs = codesContainer.querySelectorAll('.js-md5-codes-tabs-tab');
            codeTabs.forEach(tab => {
                const type = tab.querySelector('span:first-child')?.innerText || 'Info';
                const value = tab.querySelector('span:last-child')?.innerText || '';
                if (type && value) {
                    technicalDetails.push(\`\${type}: \${value}\`);
                }
            });
        }

        return {
            description: description + (technicalDetails.length > 0 ? '\\n\\nTechnical details:\\n' + technicalDetails.join('\\n') : ''),
            author: author,
            lastChapter: formatInfo, // Using this for format info
            firstChapterUrl: firstFileUrl,
            allChapters: allFormats.slice(0, 50), // Limit to 50 items
            // Additional fields that might be useful
            publisher: publisher,
            downloads: downloads,
            fileInfo: metadataEl ? metadataEl.innerText.trim() : ""
        };
    })();`,

    // Chapter script (adapted for file details page)
    getChapterScript: () => `
    (() => {
        // Get file title - look for the main title
        const titleEl = document.querySelector('.font-semibold.text-2xl, h1, h2');
        const title = titleEl ? titleEl.innerText.trim() : "File Details";
        
        // Get file information as paragraphs
        let paragraphs = [];
        
        // Get the main metadata line
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        if (metadataEl) {
            paragraphs.push(metadataEl.innerText.trim());
        }
        
        // Get description/alternative filename
        const descEl = document.querySelector('.js-md5-top-box-description');
        if (descEl) {
            const descText = descEl.innerText.trim();
            if (descText) {
                paragraphs.push(descText);
            }
        }
        
        // Get file size and other details from codes
        const codesContainer = document.querySelector('.js-md5-codes-container');
        if (codesContainer) {
            const codeTabs = codesContainer.querySelectorAll('.js-md5-codes-tabs-tab');
            const details = Array.from(codeTabs).map(tab => {
                const type = tab.querySelector('span:first-child')?.innerText || '';
                const value = tab.querySelector('span:last-child')?.innerText || '';
                return type && value ? \`\${type}: \${value}\` : null;
            }).filter(Boolean);
            
            if (details.length > 0) {
                paragraphs.push('\\nTechnical details:');
                paragraphs.push(...details);
            }
        }

        // Find download links (both fast and slow)
        const downloadLinks = [];
        
        // Fast downloads
        const fastLinks = document.querySelectorAll('#md5-panel-downloads a[href*="/fast_download/"]');
        fastLinks.forEach(link => {
            if (link.href && link.innerText.trim()) {
                downloadLinks.push({
                    text: link.innerText.trim(),
                    url: link.href
                });
            }
        });
        
        // Slow downloads
        const slowLinks = document.querySelectorAll('#md5-panel-downloads a[href*="/slow_download/"]');
        slowLinks.forEach(link => {
            if (link.href && link.innerText.trim()) {
                downloadLinks.push({
                    text: link.innerText.trim(),
                    url: link.href
                });
            }
        });
        
        // External downloads
        const externalLinks = document.querySelectorAll('#md5-panel-downloads .js-show-external a');
        externalLinks.forEach(link => {
            if (link.href && link.innerText.trim()) {
                downloadLinks.push({
                    text: "External: " + link.innerText.trim(),
                    url: link.href
                });
            }
        });

        // Add download links as paragraphs if they exist
        if (downloadLinks.length > 0) {
            paragraphs.push('\\n📥 Download options:');
            downloadLinks.slice(0, 10).forEach(link => {
                paragraphs.push(\`• \${link.text}: \${link.url}\`);
            });
        }

        // Find the first available download link as "nextUrl"
        const firstDownload = downloadLinks.find(link => 
            link.url.includes('/fast_download/') || 
            link.url.includes('/slow_download/')
        );

        return {
            title: title,
            paragraphs: paragraphs.length > 0 ? paragraphs : ["No details available."],
            nextUrl: firstDownload ? firstDownload.url : null
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
        // Try to find fast download links first
        const fastLinks = Array.from(document.querySelectorAll('a[href*="/fast_download/"]'));
        if (fastLinks.length > 0) {
            // Prefer recommended ones
            const recommended = fastLinks.find(link => 
                link.innerText.toLowerCase().includes('recommended')
            );
            return recommended ? recommended.href : fastLinks[0].href;
        }
        
        // Then try slow download links
        const slowLinks = Array.from(document.querySelectorAll('a[href*="/slow_download/"]'));
        if (slowLinks.length > 0) {
            return slowLinks[0].href;
        }
        
        // Then try external links
        const externalLinks = Array.from(document.querySelectorAll('.js-show-external a[href*="libgen"], .js-show-external a[href*="z-lib"]'));
        if (externalLinks.length > 0) {
            return externalLinks[0].href;
        }
        
        // Finally, look for any download button
        const downloadButtons = Array.from(document.querySelectorAll('a, button')).filter(el => 
            el.innerText.toLowerCase().includes('download') ||
            el.innerText.toLowerCase().includes('slow') ||
            el.innerText.toLowerCase().includes('fast')
        );
        
        const firstButtonWithLink = downloadButtons.find(b => b.href || b.querySelector('a'));
        return firstButtonWithLink ? (firstButtonWithLink.href || firstButtonWithLink.querySelector('a').href) : null;
    })()`,
};