module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.1.1',
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

    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query);
        return `https://annas-archive.gl/search?index=&page=${page}&sort=&display=&q=${encodedQuery}`;
    },

    getListScript: () => `
    (() => {
        const results = [];
        
        // Based on the actual HTML, each result is in a container with specific structure
        // Looking at the search results page structure
        const resultContainers = document.querySelectorAll('.js-vim-focus, [class*="h-[125px]"], article, .flex.items-start');
        
        resultContainers.forEach(container => {
            // Find the title link - usually in h3
            const titleEl = container.querySelector('h3 a, .font-semibold a, a[href*="/md5/"]');
            if (!titleEl) return;
            
            const title = titleEl.innerText.trim();
            const url = titleEl.href;
            
            // Get metadata (format, size, language)
            const metaEl = container.querySelector('.text-gray-500, .text-xs, .text-sm');
            const metaText = metaEl ? metaEl.innerText.trim() : '';
            
            // Get cover image - multiple strategies
            let cover = null;
            
            // Try to find img element
            const imgEl = container.querySelector('img');
            if (imgEl) {
                cover = imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                if (cover && cover.startsWith('/')) {
                    cover = 'https://annas-archive.gl' + cover;
                }
            }
            
            // If no img, look for fallback cover div with data-content
            if (!cover) {
                const fallbackCover = container.querySelector('[class*="fallback-cover"], .js-aarecord-list-fallback-cover');
                if (fallbackCover) {
                    // Create a data URL or placeholder for the cover
                    cover = null; // Keep as null for now
                }
            }
            
            results.push({
                title: title,
                url: url,
                chapters: metaText,
                cover: cover,
                sourceId: 'annas'
            });
        });
        
        return results;
    })();`,

    getNovelDetailsScript: () => `
    (() => {
        // Based on the actual HTML you provided for a detail page
        
        // Get title - from the font-semibold text-2xl div
        const titleEl = document.querySelector('.font-semibold.text-2xl');
        const title = titleEl ? titleEl.innerText.trim() : '';
        
        // Get author - from the user-edit icon link
        const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
        const author = authorEl ? authorEl.closest('a').innerText.trim() : 'Unknown';
        
        // Get publisher/year - from the company icon link
        const publisherEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--company]');
        const publisher = publisherEl ? publisherEl.closest('a').innerText.trim() : '';
        
        // Get description - from js-md5-top-box-description
        const descEl = document.querySelector('.js-md5-top-box-description');
        let description = '';
        if (descEl) {
            const lines = Array.from(descEl.querySelectorAll('div')).map(div => div.innerText.trim());
            description = lines.join('\\n');
        }
        
        // Get metadata line (English, EPUB, size, year)
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        const metadata = metadataEl ? metadataEl.innerText.trim() : '';
        
        // Get all file info from codes tabs
        const codeTabs = document.querySelectorAll('.js-md5-codes-tabs-tab');
        const allFormats = Array.from(codeTabs).map(tab => {
            const type = tab.querySelector('span:first-child')?.innerText || '';
            const value = tab.querySelector('span:last-child')?.innerText || '';
            return {
                title: type + ': ' + value.substring(0, 50),
                url: window.location.href + '#' + tab.id
            };
        }).filter(item => item.title.length > 0);
        
        // Get cover image if available
        let cover = null;
        const coverImg = document.querySelector('#cover_aarecord_id__md5\\:?[^"]* img');
        if (coverImg) {
            cover = coverImg.src;
        } else {
            // Try fallback cover div
            const fallbackCover = document.querySelector('.js-aarecord-list-fallback-cover');
            if (fallbackCover) {
                const contentDiv = fallbackCover.querySelector('[data-content]');
                if (contentDiv) {
                    // We don't have an actual image, just text
                }
            }
        }

        return {
            title: title,
            description: description || 'No description available.',
            author: author,
            lastChapter: metadata, // Using this for metadata info
            firstChapterUrl: window.location.href, // The current page is the file page
            allChapters: allFormats.slice(0, 50),
            cover: cover,
            publisher: publisher
        };
    })();`,

    getChapterScript: () => `
    (() => {
        // Get title
        const titleEl = document.querySelector('.font-semibold.text-2xl');
        const title = titleEl ? titleEl.innerText.trim() : 'File Details';
        
        let paragraphs = [];
        
        // Get author and publisher info
        const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
        if (authorEl) {
            paragraphs.push('Author: ' + authorEl.closest('a').innerText.trim());
        }
        
        const publisherEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--company]');
        if (publisherEl) {
            paragraphs.push('Publisher: ' + publisherEl.closest('a').innerText.trim());
        }
        
        // Get main metadata
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        if (metadataEl) {
            paragraphs.push('\\n📄 File info:');
            paragraphs.push(metadataEl.innerText.trim());
        }
        
        // Get description/alternative filename
        const descEl = document.querySelector('.js-md5-top-box-description');
        if (descEl) {
            paragraphs.push('\\n📝 Details:');
            const descDivs = descEl.querySelectorAll('div');
            descDivs.forEach(div => {
                const text = div.innerText.trim();
                if (text) paragraphs.push(text);
            });
        }
        
        // Get all technical details from codes
        const codeTabs = document.querySelectorAll('.js-md5-codes-tabs-tab');
        if (codeTabs.length > 0) {
            paragraphs.push('\\n🔧 Technical details:');
            codeTabs.forEach(tab => {
                const type = tab.querySelector('span:first-child')?.innerText || '';
                const value = tab.querySelector('span:last-child')?.innerText || '';
                if (type && value) {
                    paragraphs.push(type + ': ' + value);
                }
            });
        }
        
        // Find download links in the Downloads tab
        const downloadLinks = [];
        
        // Fast downloads
        document.querySelectorAll('#md5-panel-downloads a[href*="/fast_download/"]').forEach(link => {
            downloadLinks.push({
                text: link.innerText.trim(),
                url: link.href
            });
        });
        
        // Slow downloads
        document.querySelectorAll('#md5-panel-downloads a[href*="/slow_download/"]').forEach(link => {
            downloadLinks.push({
                text: link.innerText.trim(),
                url: link.href
            });
        });
        
        // External downloads
        document.querySelectorAll('.js-show-external a[href*="libgen"], .js-show-external a[href*="z-lib"]').forEach(link => {
            downloadLinks.push({
                text: 'External: ' + link.innerText.trim(),
                url: link.href
            });
        });
        
        if (downloadLinks.length > 0) {
            paragraphs.push('\\n📥 Download options:');
            downloadLinks.slice(0, 5).forEach(link => {
                paragraphs.push('• ' + link.text + ': ' + link.url);
            });
        }

        return {
            title: title,
            paragraphs: paragraphs.length > 0 ? paragraphs : ['No details available.'],
            nextUrl: downloadLinks.length > 0 ? downloadLinks[0].url : null
        };
    })();`,

    getDownloadLinkScript: () => `
    (() => {
        // Try fast downloads first
        const fastLink = document.querySelector('#md5-panel-downloads a[href*="/fast_download/"]');
        if (fastLink) return fastLink.href;
        
        // Then slow downloads
        const slowLink = document.querySelector('#md5-panel-downloads a[href*="/slow_download/"]');
        if (slowLink) return slowLink.href;
        
        // Then external
        const externalLink = document.querySelector('.js-show-external a[href*="libgen"], .js-show-external a[href*="z-lib"]');
        if (externalLink) return externalLink.href;
        
        return null;
    })()`
};