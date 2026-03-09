# 📚 Universal Novel Scraper (UNS) - Provider Development Guide

Welcome to the UNS Provider Development Guide! This document explains how to create a new source script (provider) to expand the app's library.

Providers are JavaScript modules that define how the app navigates a specific website, searches for novels, and extracts chapter data or direct file downloads. Because UNS runs on Electron, your extraction scripts are injected directly into a hidden Chromium browser window, giving you full access to the live DOM.

---

## 🛠️ Prerequisites

Before building a provider, you should be comfortable with:

* **Modern JavaScript (ES6+)**
* **DOM Manipulation & Selectors:** (`document.querySelector`, `querySelectorAll`, etc.)
* **Browser DevTools:** Testing your extraction logic in the Chrome/Edge console before pasting it into your script is highly recommended!

---

## 🏗️ The Anatomy of a Provider

Every provider exports a single configuration object. Create a new file (e.g., `newsite.js`) and structure it like this:

```javascript
module.exports = {
    // 1. Metadata
    id: 'newsite',
    name: 'New Site',
    version: '1.0.0',
    icon: 'https://newsite.com/favicon.ico',
    mode: 'scrape', // 'scrape' for chapter-by-chapter, 'download' for direct files

    // 2. Categories
    categories: [],

    // 3. URL Builders
    getCategoryUrl: (categoryId, page = 1) => { ... },
    getSearchUrl: (query, page = 1) => { ... },

    // 4. DOM Extraction Scripts (Returned as Strings)
    getListScript: () => `(() => { ... })()`,
    getNovelDetailsScript: () => `(() => { ... })()`,
    getChapterScript: () => `(() => { ... })()`
};

```

---

## 1. Core Metadata

Define the identity and behavior of your provider.

| Property | Type | Description |
| --- | --- | --- |
| **`id`** | `String` | Unique identifier (lowercase, no spaces). Must match the filename (e.g., `allnovel`). |
| **`name`** | `String` | The display name shown in the UI. |
| **`version`** | `String` | Semantic versioning (e.g., `'1.0.0'`). |
| **`icon`** | `String` | Absolute URL to the site's favicon or logo. |
| **`mode`** | `String` | **Crucial:** Use `'scrape'` if the app needs to read chapters one by one. Use `'download'` if the site provides direct `.epub`, `.pdf`, or `.mobi` files (like Anna's Archive). |
| **`beta`** | `Boolean` | *(Optional)* Set to `true` to flag this source as experimental in the UI. |

---

## 2. Categories & Navigation

Help the app navigate the source's library and search functionality.

### `categories`

An array of objects defining the browseable tabs for this source.

```javascript
categories: [
    { id: 'hot', name: 'Hot' },
    { id: 'latest', name: 'Latest Updates' }
]

```

### URL Builders

Functions that return the exact URL the hidden browser should navigate to.

```javascript
// Build URL for a specific category and page
getCategoryUrl: (categoryId, page = 1) => `https://example.com/category/${categoryId}?page=${page}`,

// Build URL for a user search query
getSearchUrl: (query, page = 1) => `https://example.com/search?q=${encodeURIComponent(query)}&page=${page}`

```

---

## 3. DOM Extraction Scripts

**⚠️ Important:** These functions must return a **String** containing an Immediately Invoked Function Expression (IIFE). Electron executes this string inside the target webpage.

### A. `getListScript()`

Extracts an array of novels from a search results page or category list.

* **Returns:** Array of Objects `[{ title, url, chapters, cover, source }]`

### B. `getNovelDetailsScript()`

Extracts metadata and the chapter list from a specific novel's homepage.

* **Returns:** Object `{ description, author, lastChapter, firstChapterUrl, allChapters: [{title, url}], cover }`

### C. `getChapterScript()` *(Only required if `mode: 'scrape'`)*

Extracts the text content from a reading page and finds the link to the next chapter.

* **Returns:** Object `{ title, paragraphs: ["text", "text"], nextUrl: "https..." }`

---

## 📄 Full Example (`allnovel.js`)

Here is a complete, working example of a chapter-scraping provider:

```javascript
module.exports = {
    id: 'allnovel',
    name: 'AllNovel',
    version: '1.1.2',
    icon: 'https://allnovel.org/uploads/thumbs/logo-allnovel-2-1-ad7cde4de9-c5b5412be60c1e2832eda80296241749.png',
    mode: 'scrape', 
    
    categories: [
        { id: 'hot', name: 'Hot' },
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'completed', name: 'Completed' }
    ],

    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://allnovel.org';
        switch (categoryId) {
            case 'hot': return `${baseUrl}/hot-novel?page=${page}`;
            case 'latest': return `${baseUrl}/latest-release-novel?page=${page}`;
            case 'completed': return `${baseUrl}/completed-novel?page=${page}`;
            case 'popular': default: return `${baseUrl}/most-popular?page=${page}`;
        }
    },

    getSearchUrl: (query, page = 1) => 
        `https://allnovel.org/search?keyword=${encodeURIComponent(query).replace(/%20/g, '+')}&page=${page}`,

    getListScript: () => `
        (() => {
            const results = [];
            document.querySelectorAll('.list-truyen > .row').forEach(row => {
                const titleLink = row.querySelector('.truyen-title a');
                if (!titleLink) return;
                
                const title = titleLink.innerText.trim();
                let url = titleLink.getAttribute('href');
                if (url && url.startsWith('/')) url = 'https://allnovel.org' + url;
                
                const imgEl = row.querySelector('.col-xs-3 img');
                let cover = imgEl ? imgEl.getAttribute('src') : null;
                if (cover && cover.startsWith('/')) cover = 'https://allnovel.org' + cover;
                
                const chapterLink = row.querySelector('.col-xs-2.text-info .chapter-text');
                const chapters = chapterLink ? chapterLink.innerText.trim() : "View Info";
                
                if (title && url) {
                    results.push({ title, url, chapters, cover, sourceId: 'allnovel' });
                }
            });
            return results;
        })();`,

    getNovelDetailsScript: () => `
        (() => {
            const descEl = document.querySelector('.desc-text, .summary, .description');
            const authorEl = document.querySelector('.author, .info-item a');
            
            const chapterLinks = Array.from(document.querySelectorAll('ul.list-chapter li a'));
            const allChapters = chapterLinks.map(a => ({ 
                title: a.innerText.trim(), 
                url: a.href 
            }));
            
            const firstChEl = document.querySelector('a.btn-read-now, .read-first');
            const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters[0]?.url || window.location.href);

            return {
                description: descEl ? descEl.innerText.trim() : "No description available.",
                author: authorEl ? authorEl.innerText.trim() : "Unknown",
                lastChapter: allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A",
                firstChapterUrl: firstChapterUrl,
                allChapters: allChapters.slice(0, 500)
            };
        })();`,
        
    getChapterScript: () => `
        (() => {
            const title = document.querySelector('.chr-title')?.innerText?.trim();
            const paragraphs = Array.from(document.querySelectorAll('#chr-content p'))
                                   .map(p => p.innerText.trim())
                                   .filter(p => p.length > 0);
                                   
            const nextBtn = Array.from(document.querySelectorAll('a')).find(a => 
                (a.innerText || '').toLowerCase().includes('next') && 
                a.href.startsWith('http')
            );
            
            return { 
                title: title || 'Untitled Chapter', 
                paragraphs, 
                nextUrl: nextBtn ? nextBtn.href : null 
            };
        })();`
};

```