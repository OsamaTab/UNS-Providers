module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.3.0',
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
            // Find the "Slow Partner Server" link (this is the intermediate download page)
            const slowLinks = Array.from(document.querySelectorAll('a[href*="/slow_download/"]'));
            const downloadPageLink = slowLinks.length > 0 ? slowLinks[0].href : null;

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
                firstChapterUrl: downloadPageLink, // Passes the intermediate page to the main process
                allChapters: [] 
            };
        })();`,

  getListScript: () => `/* Keep your existing getListScript here */`
};