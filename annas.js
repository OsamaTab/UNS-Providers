module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.2.0',
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
        const resultContainers = document.querySelectorAll('.js-vim-focus, [class*="h-[125px]"], article, .flex.items-start');
        resultContainers.forEach(container => {
            const titleEl = container.querySelector('h3 a, .font-semibold a, a[href*="/md5/"]');
            if (!titleEl) return;
            const title = titleEl.innerText.trim();
            const url = titleEl.href;
            const metaEl = container.querySelector('.text-gray-500, .text-xs, .text-sm');
            const metaText = metaEl ? metaEl.innerText.trim() : '';
            let cover = null;
            const imgEl = container.querySelector('img');
            if (imgEl) {
                cover = imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                if (cover && cover.startsWith('/')) {
                    cover = 'https://annas-archive.gl' + cover;
                }
            }
            if (!cover) {
                const fallbackCover = container.querySelector('[class*="fallback-cover"], .js-aarecord-list-fallback-cover');
                if (fallbackCover) {
                    cover = null; // Or generate a placeholder if needed
                }
            }
            results.push({
                title: title,
                url: url,
                metadata: metaText, // Renamed from chapters for accuracy
                cover: cover,
                sourceId: 'annas'
            });
        });
        return results;
    })();`,
    getBookDetailsScript: () => `  // Renamed from getNovelDetailsScript for clarity
    (() => {
        const titleEl = document.querySelector('.font-semibold.text-2xl');
        const title = titleEl ? titleEl.innerText.trim() : '';
        const authorEl = document.querySelector('a[href*="/search?q="]:has(.icon-[mdi--user-edit])');
        const author = authorEl ? authorEl.innerText.trim() : 'Unknown';
        const publisherEl = document.querySelector('a[href*="/search?q="]:has(.icon-[mdi--company])');
        const publisher = publisherEl ? publisherEl.innerText.trim() : '';
        const descEl = document.querySelector('.js-md5-top-box-description');
        let description = '';
        if (descEl) {
            const lines = Array.from(descEl.querySelectorAll('div')).map(div => div.innerText.trim());
            description = lines.join('\\n');
        }
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        const metadata = metadataEl ? metadataEl.innerText.trim() : '';
        const codeTabs = document.querySelectorAll('.js-md5-codes-tabs-tab');
        const allMetadata = Array.from(codeTabs).map(tab => {
            const type = tab.querySelector('span:first-child')?.innerText || '';
            const value = tab.querySelector('span:last-child')?.innerText || '';
            return {
                title: type + ': ' + value.substring(0, 50),
                url: window.location.href + '#' + tab.id
            };
        }).filter(item => item.title.length > 0);
        let cover = null;
        const coverImg = document.querySelector('#cover_aarecord_id__md5\\:?[^"]* img');
        if (coverImg) {
            cover = coverImg.src;
        } else {
            const fallbackCover = document.querySelector('.js-aarecord-list-fallback-cover');
            if (fallbackCover) {
                // Optionally, create a placeholder or leave as null
            }
        }
        return {
            title: title,
            description: description || 'No description available.',
            author: author,
            metadata: metadata,  // Renamed from lastChapter
            fileUrl: window.location.href,  // Renamed from firstChapterUrl
            technicalIds: allMetadata.slice(0, 50),  // Renamed from allChapters
            cover: cover,
            publisher: publisher
        };
    })();`,
    getFileInfoScript: () => `  // Renamed from getChapterScript for clarity
    (() => {
        const titleEl = document.querySelector('.font-semibold.text-2xl');
        const title = titleEl ? titleEl.innerText.trim() : 'File Details';
        let paragraphs = [];
        const authorEl = document.querySelector('a[href*="/search?q="]:has(.icon-[mdi--user-edit])');
        if (authorEl) {
            paragraphs.push('Author: ' + authorEl.innerText.trim());
        }
        const publisherEl = document.querySelector('a[href*="/search?q="]:has(.icon-[mdi--company])');
        if (publisherEl) {
            paragraphs.push('Publisher: ' + publisherEl.innerText.trim());
        }
        const metadataEl = document.querySelector('.text-gray-800.dark\\:text-slate-400');
        if (metadataEl) {
            paragraphs.push('\\n📄 File info:');
            paragraphs.push(metadataEl.innerText.trim());
        }
        const descEl = document.querySelector('.js-md5-top-box-description');
        if (descEl) {
            paragraphs.push('\\n📝 Details:');
            const descDivs = descEl.querySelectorAll('div');
            descDivs.forEach(div => {
                const text = div.innerText.trim();
                if (text) paragraphs.push(text);
            });
        }
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
        const downloadLinks = [];
        document.querySelectorAll('#md5-panel-downloads a[href*="/fast_download/"]').forEach(link => {
            downloadLinks.push({
                text: link.innerText.trim(),
                url: link.href
            });
        });
        document.querySelectorAll('#md5-panel-downloads a[href*="/slow_download/"]').forEach(link => {
            downloadLinks.push({
                text: link.innerText.trim(),
                url: link.href
            });
        });
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
        const fastLink = document.querySelector('#md5-panel-downloads a[href*="/fast_download/"]');
        if (fastLink) return fastLink.href;
        const slowLink = document.querySelector('#md5-panel-downloads a[href*="/slow_download/"]');
        if (slowLink) return slowLink.href;
        const externalLink = document.querySelector('.js-show-external a[href*="libgen"], .js-show-external a[href*="z-lib"]');
        if (externalLink) return externalLink.href;
        return null;
    })()`
};