module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.3',
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

        const parseItem = (item) => {
            const titleEl = item.querySelector('h3');
            if (!titleEl) return;

            const title = titleEl.innerText.trim();
            const url = item.href;

            const meta = item.innerText.toLowerCase();
            if (!meta.includes('epub')) return;

            const img = item.querySelector('img');

            results.push({
            title,
            url: url.startsWith('http') ? url : 'https://annas-archive.gl' + url,
            chapters: 'EPUB',
            cover: img ? img.src : null,
            sourceId: 'annas'
            });
        };

        document.querySelectorAll('main a[href*="/md5/"]').forEach(parseItem);

        return results;
        })();
        `,

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