module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.2.3',
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
  getNovelDetailsScript: () => `
(() => {
  // Get title - from the font-semibold text-2xl div
  const titleEl = document.querySelector('.font-semibold.text-2xl');
  const title = titleEl ? titleEl.innerText.trim().replace('🔍', '').trim() : '';
  
  // Get author - from the user-edit icon link
  const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
  let author = 'Unknown';
  if (authorEl) {
    const authorLink = authorEl.closest('a');
    if (authorLink) {
      author = authorLink.innerText.trim();
    }
  }
  
  // Get publisher/year - from the company icon link
  const publisherEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--company]');
  let publisher = '';
  if (publisherEl) {
    const publisherLink = publisherEl.closest('a');
    if (publisherLink) {
      // Extract just the publisher name (first part before comma)
      const fullText = publisherLink.innerText.trim();
      publisher = fullText.split(',')[0].trim();
    }
  }
  
  // Get description - from js-md5-top-box-description
  const descEl = document.querySelector('.js-md5-top-box-description');
  let description = '';
  if (descEl) {
    const lines = Array.from(descEl.querySelectorAll('div')).map(div => div.innerText.trim());
    description = lines.filter(line => line.length > 0).join('\\n');
  }
  
  // Get metadata line (English, EPUB, size, year)
  const metadataEl = document.querySelector('.text-gray-800.dark\\\\:text-slate-400');
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
  // Fix: Use attribute starts-with selector instead of regex pattern
  const coverContainer = document.querySelector('div[id^="cover_aarecord_id__md5:"]');
  if (coverContainer) {
    const coverImg = coverContainer.querySelector('img');
    if (coverImg) {
      cover = coverImg.getAttribute('data-src') || coverImg.src;
      if (cover && cover.startsWith('/')) {
        cover = 'https://annas-archive.gl' + cover;
      }
    }
  }
  
  // Fallback: try list cover container
  if (!cover) {
    const listCoverContainer = document.querySelector('div[id^="list_cover_aarecord_id__md5:"]');
    if (listCoverContainer) {
      const listCoverImg = listCoverContainer.querySelector('img');
      if (listCoverImg) {
        cover = listCoverImg.getAttribute('data-src') || listCoverImg.src;
        if (cover && cover.startsWith('/')) {
          cover = 'https://annas-archive.gl' + cover;
        }
      }
    }
  }
  
  return {
    title: title,
    description: description || 'No description available.',
    author: author,
    lastChapter: metadata,
    firstChapterUrl: window.location.href,
    allChapters: allFormats.slice(0, 50),
    cover: cover,
    publisher: publisher
  };
})();`,
  getChapterScript: () => `
(() => {
  // Get title
  const titleEl = document.querySelector('.font-semibold.text-2xl');
  const title = titleEl ? titleEl.innerText.trim().replace('🔍', '').trim() : 'File Details';
  
  let paragraphs = [];
  
  // Get author and publisher info
  const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');
  if (authorEl) {
    const authorLink = authorEl.closest('a');
    if (authorLink) {
      paragraphs.push('Author: ' + authorLink.innerText.trim());
    }
  }
  
  const publisherEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--company]');
  if (publisherEl) {
    const publisherLink = publisherEl.closest('a');
    if (publisherLink) {
      const fullText = publisherLink.innerText.trim();
      const publisher = fullText.split(',')[0].trim();
      paragraphs.push('Publisher: ' + publisher);
    }
  }
  
  // Get main metadata
  const metadataEl = document.querySelector('.text-gray-800.dark\\\\:text-slate-400');
  if (metadataEl) {
    paragraphs.push('');
    paragraphs.push('📄 File info:');
    paragraphs.push(metadataEl.innerText.trim());
  }
  
  // Get description/alternative filename
  const descEl = document.querySelector('.js-md5-top-box-description');
  if (descEl) {
    paragraphs.push('');
    paragraphs.push('📝 Details:');
    const descDivs = descEl.querySelectorAll('div');
    descDivs.forEach(div => {
      const text = div.innerText.trim();
      if (text) paragraphs.push(text);
    });
  }
  
  // Get all technical details from codes
  const codeTabs = document.querySelectorAll('.js-md5-codes-tabs-tab');
  if (codeTabs.length > 0) {
    paragraphs.push('');
    paragraphs.push('🔧 Technical details:');
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
    paragraphs.push('');
    paragraphs.push('📥 Download options:');
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
})();`
};