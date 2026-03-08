module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.1',
    icon: 'https://annas-archive.gl/favicon.ico',

    // Updated to match the exact URL structure you provided
    getSearchUrl: (query, page = 1) => {
        const encodedQuery = encodeURIComponent(query);
        // Using the full parameter set to ensure the search is reliable
        return `https://annas-archive.gl/search?index=&page=${page}&sort=&display=&q=${encodedQuery}`;
    },

    getListScript: () => `
    (() => {
        const results = [];
        // Anna's Archive uses 'a.js-vim-focus' for result links
        const rows = document.querySelectorAll('a.js-vim-focus');
        
        rows.forEach(row => {
            // Title is usually inside an h3 within the flex-grow container
            const titleEl = row.querySelector('h3');
            if (!titleEl) return;

            const title = titleEl.innerText.trim();
            const url = row.href;
            
            // Meta info (Format, Size, Language) is usually in text-xs or specific gray spans
            // We want to extract formatting info to confirm it's an EPUB
            const metaContainer = row.innerText || "";
            const isEpub = metaContainer.toLowerCase().includes('epub');
            
            // Extract a cleaner metadata string for the "Chapters" field in your UI
            // Usually looks like: "English, epub, 2.5MB, Game of Thrones"
            const metaInfo = row.querySelector('div.line-clamp-2, .text-gray-500')?.innerText || "EPUB File";
            
            // Cover Image
            const imgEl = row.querySelector('img');
            const cover = imgEl ? imgEl.src : null;
            
            // Only push if it's an EPUB to save your scraper from trying to parse PDFs
            if (isEpub) {
                results.push({
                    title: title,
                    url: url,
                    chapters: metaInfo.split(',').slice(0, 3).join(','), // "English, epub, 2.5MB"
                    cover: cover,
                    sourceId: 'annas'
                });
            }
        });
        return results;
    })();`,

    // Updated to find the first available "Slow" or "External" mirror
    getDownloadLinkScript: () => `
    (() => {
        // Anna's uses specific classes for their download mirrors
        // We look for 'js-download-link' which is the primary button
        const links = Array.from(document.querySelectorAll('a.js-download-link'));
        
        // Prefer links that look like mirrors (Libgen, IPFS, etc)
        const mirrorLink = links.find(a => 
            a.href.includes('libgen') || 
            a.href.includes('ipfs') || 
            a.innerText.toLowerCase().includes('slow')
        );

        return mirrorLink ? mirrorLink.href : (links[0] ? links[0].href : null);
    })()`
};