module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.2',
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
            
            // Function to parse a single result element
            const parseItem = (item) => {
                const titleEl = item.querySelector('h3');
                if (!titleEl) return;

                const title = titleEl.innerText.trim();
                const url = item.href || item.querySelector('a')?.href;
                if (!url) return;

                // Metadata extraction (Format, Size, Language)
                const metaText = item.innerText || "";
                const isEpub = metaText.toLowerCase().includes('epub');
                
                // Grab the gray metadata line (e.g., "English, epub, 2.5MB")
                const metaInfo = item.querySelector('.text-gray-500, .text-xs')?.innerText || "EPUB";
                
                const imgEl = item.querySelector('img');
                const cover = imgEl ? imgEl.src : null;

                if (isEpub) {
                    results.push({
                        title: title,
                        url: url.startsWith('http') ? url : 'https://annas-archive.gl' + url,
                        chapters: metaInfo.trim(),
                        cover: cover,
                        sourceId: 'annas'
                    });
                }
            };

            // 1. Parse visible results
            document.querySelectorAll('a.js-vim-focus').forEach(parseItem);

            // 2. THE SECRET FIX: Parse hidden results inside SGML comments
            // Anna's Archive hides results in comments under '.js-scroll-hidden'
            document.querySelectorAll('.js-scroll-hidden').forEach(container => {
                const comment = Array.from(container.childNodes).find(n => n.nodeType === 8); // Node.COMMENT_NODE
                if (comment) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = comment.data;
                    const hiddenLink = tempDiv.querySelector('a');
                    if (hiddenLink) parseItem(hiddenLink);
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