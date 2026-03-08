module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.4',
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
            // Try to find the main link - usually in h3 > a
            const linkEl = item.querySelector('h3 a') || item.querySelector('a');
            if (!linkEl) return;

            const title = linkEl.innerText.trim();
            const url = linkEl.href;
            
            // Get the container for metadata (the line with format, size, language)
            const metaContainer = item.querySelector('.text-gray-500, .text-xs, .text-sm');
            const metaText = metaContainer ? metaContainer.innerText : '';
            
            // Check if this is an EPUB file
            const isEpub = metaText.toLowerCase().includes('epub');
            
            // Get cover image if exists
            const imgEl = item.querySelector('img');
            const cover = imgEl ? imgEl.src : null;

            // You can remove the isEpub filter if you want ALL results
            // if (isEpub) {
                results.push({
                    title: title,
                    url: url.startsWith('http') ? url : 'https://annas-archive.gl' + url,
                    chapters: metaText.trim(),
                    cover: cover,
                    sourceId: 'annas'
                });
            // }
        };

        // Look for result items - they appear to be in divs with specific classes
        // Based on the HTML structure, each result seems to be in a container
        document.querySelectorAll('[class*="h-[125px]"], .js-vim-focus, .flex.items-start').forEach(parseItem);
        
        // Alternative: Find all links that contain book information
        document.querySelectorAll('a[href*="/md5/"], a[href*="/nexusstc/"], a[href*="/details/"]').forEach(link => {
            // Find the parent container that has all metadata
            const container = link.closest('div[class*="flex"], div[class*="relative"]');
            if (container) parseItem(container);
        });

        return results;
    })();`,

    // Updated to find the first available "Slow" or "External" mirror
   getDownloadLinkScript: () => `
    (() => {
        // Look for download links - they often contain specific text
        const links = Array.from(document.querySelectorAll('a[href*="libgen"], a[href*="ipfs"], a[href*="download"]'));
        
        // Look for buttons that might be download triggers
        const downloadButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
            el.innerText.toLowerCase().includes('slow') ||
            el.innerText.toLowerCase().includes('external') ||
            el.innerText.toLowerCase().includes('download')
        );
        
        // Combine and find first valid link
        const allLinks = [...links, ...downloadButtons.map(b => b.href ? b : b.querySelector('a')).filter(Boolean)];
        
        return allLinks.length > 0 ? allLinks[0].href : null;
    })()`
};