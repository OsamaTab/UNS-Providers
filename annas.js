module.exports = {
    id: 'annas',
    name: "Anna's Archive",
    version: '1.0.0',
    icon: 'https://annas-archive.gl/favicon.ico',

    getSearchUrl: (query, page = 1) => {
        return `https://annas-archive.gl/search?q=${encodeURIComponent(query)}&page=${page}`;
    },

    getListScript: () => `
    (() => {
        const results = [];
        // Anna's Archive uses a specific layout for search results
        const rows = document.querySelectorAll('a.js-vim-focus');
        
        rows.forEach(row => {
            const titleEl = row.querySelector('h3');
            if (!titleEl) return;

            const title = titleEl.innerText.trim();
            const url = row.href;
            
            // Extract metadata like (EPUB, 1.2MB, English)
            const meta = row.querySelector('div.text-xs')?.innerText || "";
            const isEpub = meta.toLowerCase().includes('epub');
            
            const imgEl = row.querySelector('img');
            const cover = imgEl ? imgEl.src : null;
            
            if (isEpub) { // Only show EPUBs for your library
                results.push({
                    title,
                    url,
                    chapters: meta, // Using metadata as the "chapters" text
                    cover,
                    source: 'Annas'
                });
            }
        });
        return results;
    })();`,

    // This script would run on the book's detail page to find the final file link
    getDownloadLinkScript: () => `
    (() => {
        // Look for "Slow" download mirrors or LibGen mirrors
        const downloadLink = document.querySelector('a.js-download-link');
        return downloadLink ? downloadLink.href : null;
    })()`
};