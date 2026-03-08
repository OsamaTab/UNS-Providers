module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.2.2',
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
  
  // Target the actual search result containers: flex divs with border separator
  const resultContainers = document.querySelectorAll('div.flex[class*="border-b"], div.flex.pt-3');
  
  resultContainers.forEach(container => {
    // Find the main link that contains both cover and title (href contains /md5/)
    const mainLink = container.querySelector('a[href*="/md5/"]');
    if (!mainLink) return;
    
    // Get title from the link text or from the h3/font-semibold element
    const titleEl = mainLink.querySelector('.js-vim-focus, .font-semibold, .line-clamp-\\[3\\]');
    const title = titleEl ? titleEl.innerText.trim() : mainLink.innerText.trim().split('\\n')[0];
    if (!title || title.length < 2) return;
    
    const url = mainLink.href.startsWith('http') ? mainLink.href : 'https://annas-archive.gl' + mainLink.href;
    
    // === COVER IMAGE EXTRACTION (FIXED) ===
    let cover = null;
    
    // Strategy 1: Look for actual img element inside the cover container
    const coverContainer = mainLink.querySelector('[id*="list_cover_aarecord_id__md5:"], [id*="cover_aarecord_id__md5:"]');
    if (coverContainer) {
      const img = coverContainer.querySelector('img');
      if (img) {
        // Get src or data-src, and TRIM whitespace (important!)
        let src = img.getAttribute('data-src') || img.getAttribute('src') || '';
        src = src.trim(); // ← Critical fix: removes trailing spaces like "  "
        if (src && src.startsWith('http')) {
          cover = src;
        } else if (src && src.startsWith('/')) {
          cover = 'https://annas-archive.gl' + src;
        }
      }
    }
    
    // Strategy 2: Fallback - search entire container for img if not found yet
    if (!cover) {
      const img = container.querySelector('img');
      if (img) {
        let src = (img.getAttribute('data-src') || img.getAttribute('src') || '').trim();
        if (src && src.startsWith('http')) {
          cover = src;
        } else if (src && src.startsWith('/')) {
          cover = 'https://annas-archive.gl' + src;
        }
      }
    }
    
    // Strategy 3: Handle fallback cover (no actual image available)
    if (!cover) {
      const fallbackCover = container.querySelector('.js-aarecord-list-fallback-cover');
      if (fallbackCover && !fallbackCover.classList.contains('hidden')) {
        // No real image exists - keep cover as null, app can show placeholder
        cover = null;
      }
    }
    
    // === METADATA EXTRACTION ===
    // Get format/size/language line (gray text below title)
    const metaEl = container.querySelector('.text-gray-800.dark\\\\:text-slate-400, .text-sm.text-gray-600');
    const metaText = metaEl ? metaEl.innerText.trim().split('·')[0]?.trim() || metaEl.innerText.trim() : '';
    
    // Get author (from user-edit icon link)
    let author = '';
    const authorLink = container.querySelector('a[href*="/search?q="] .icon-\\[mdi--user-edit\\]');
    if (authorLink) {
      const link = authorLink.closest('a');
      if (link) author = link.innerText.trim();
    }
    
    // Get publisher (from company icon link) - extract just the name
    let publisher = '';
    const publisherLink = container.querySelector('a[href*="/search?q="] .icon-\\[mdi--company\\]');
    if (publisherLink) {
      const link = publisherLink.closest('a');
      if (link) {
        const fullText = link.innerText.trim();
        publisher = fullText.split(',')[0].trim(); // Take first part before comma
      }
    }
    
    // Combine metadata for chapters field
    const chapters = [metaText, author, publisher].filter(Boolean).join(' · ');
    
    results.push({
      title: title,
      url: url,
      chapters: chapters || metaText,
      cover: cover,
      sourceId: 'annas'
    });
  });
  
  return results;
})();`,
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