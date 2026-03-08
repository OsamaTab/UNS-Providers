# How to Write a New Script Source

This guide explains how to create a new source script for a novel or book scraper plugin, similar to the one for Anna's Archive. The script is exported as a JavaScript object and includes metadata, URL builders, and DOM parsing functions.

## Prerequisites
- Basic JavaScript knowledge.
- Understanding of DOM selectors (e.g., `querySelector`).
- Test in a browser console for selectors.

## Structure
The script is a module like this:
```js
module.exports = {
  // Metadata, categories, functions...
};
```

## 1. Metadata
Define basic info:
- `id`: Unique string.
- `name`: Display name.
- `version`: String (e.g., '1.0.0').
- `type`: Sorce type.
- `beta`: Boolean (optional, for testing).
- `icon`: Favicon URL.

Example:
```js
id: 'newsite',
name: "New Site",
version: '1.0.0',
type: "Novels",
beta: true,
icon: 'https://newsite.com/favicon.ico',
```

## 2. Categories
Array of objects for browsing sections:
```js
categories: [
  { id: 'category1', name: 'Category 1' },
  // ...
],
```

## 3. URL Builders
Functions to generate URLs:
```js
getCategoryUrl: (categoryId, page = 1) => {
  // Build URL based on categoryId and page
},
getSearchUrl: (query, page = 1) => {
  // Encode query and build search URL
},
```

## 4. Parsing Scripts
Strings that are IIFEs returning data:
- `getCategoryUrl`: Parse category results.
- `getChapterScript`: Parse chapter results.
- `getListScript`: Parse search results.
- `getNovelDetailsScript`: Parse book or novel details.
- `getFileInfoScript`: Parse file info.

Use `document.querySelectorAll` to extract data.

## manifest.json Example
```js
module.exports = {
    id: 'allnovel',
    name: 'AllNovel',
    version: '1.1.2',
    icon: 'https://allnovel.org/uploads/thumbs/logo-allnovel-2-1-ad7cde4de9-c5b5412be60c1e2832eda80296241749.png',
    
    // 1. Define available categories for this specific site
    categories: [
        { id: 'hot', name: 'Hot' },
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    // 2. Map category IDs to their specific URLs, supporting pagination
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://allnovel.org';
        switch (categoryId) {
            case 'Hot': return `${baseUrl}/hot-novel?page=${page}`;
            case 'latest': return `${baseUrl}/latest-release-novel?page=${page}`;
            case 'completed': return `${baseUrl}/completed-novel?page=${page}`;
            case 'popular': return `${baseUrl}/most-popular?page=${page}`;
            default: return `${baseUrl}/most-popular?page=${page}`;
        }
    },

    getSearchUrl: (query, page = 1) => `https://allnovel.org/search?keyword=${encodeURIComponent(query).replace(/%20/g, '+')}&page=${page}`,

    getNovelDetailsScript: () => `
        (() => {
            const descEl = document.querySelector('.desc-text, .summary, .description, #description');
            const description = descEl ? descEl.innerText.trim() : "No description available.";
            const authorEl = document.querySelector('.author, .info-item a, a[href*="author"]');
            const author = authorEl ? authorEl.innerText.trim() : "Unknown";
            const chapterLinks = document.querySelectorAll('ul.list-chapter li a, .chapter-list a, #list-chapter a');
            const allChapters = Array.from(chapterLinks).map(a => ({ title: a.innerText.trim(), url: a.href }));
            const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
            const firstChEl = document.querySelector('a.btn-read-now, a[href*="chapter-1"], .read-first');
            const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

            return {
                description, author, lastChapter: lastChText, firstChapterUrl,
                allChapters: allChapters.slice(0, 500)
            };
        })();`,

    // 3. Rename to getListScript as it handles both search results and category lists
    getListScript: () => `
        (() => {
            const results = [];
            const novelRows = document.querySelectorAll('.list-truyen > .row');
            
            novelRows.forEach(row => {
                const titleLink = row.querySelector('.truyen-title a');
                if (!titleLink) return;
                
                const title = titleLink.innerText.trim();
                let url = titleLink.getAttribute('href');
                if (url && url.startsWith('/')) url = 'https://allnovel.org' + url;
                else if (url && !url.startsWith('http')) url = titleLink.href; 
                
                const imgEl = row.querySelector('.col-xs-3 img');
                let cover = null;
                if (imgEl) {
                    cover = imgEl.getAttribute('src');
                    if (cover && cover.startsWith('/')) cover = 'https://allnovel.org' + cover;
                }
                
                let chapters = "View Info";
                const chapterLink = row.querySelector('.col-xs-2.text-info .chapter-text');
                if (chapterLink) chapters = chapterLink.innerText.trim();
                
                if (title && url) {
                    results.push({ title, url, chapters, cover, source: 'AllNovel' });
                }
            });
            return results;
        })();`
};
```

