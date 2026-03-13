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
    
    // Use this if mode is 'scrape'
    getChapterScript: () => `(() => { ... })()`, 
    
    // Use this if mode is 'download'
    getDownloadUrlScript: () => `(() => { ... })()` 
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
| **`mode`** | `String` | **Crucial:** Use `'scrape'` if the app needs to read chapters one by one. Use `'download'` if the site provides direct `.epub`, `.pdf`, or `.mobi` files. |
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

* **Returns:** Array of Objects `[{ title, url, chapters, cover, sourceId }]`

### B. `getNovelDetailsScript()`

Extracts metadata and the chapter/download list from a specific novel's homepage.

* **Returns:** Object `{ description, author, lastChapter, firstChapterUrl, allChapters: [{title, url}], cover }`

### C. `getChapterScript()` *(Only required if `mode: 'scrape'`)*

Extracts the text content from a reading page and finds the link to the next chapter.

* **Returns:** Object `{ title, paragraphs: ["text", "text"], nextUrl: "https..." }`

### D. `getDownloadUrlScript()` *(Only required if `mode: 'download'`)*

Extracts the final direct file URL (like an `.epub` or `.pdf` link) from the download page. The main app handles navigation and protection bypass (like Cloudflare); this script only needs to locate the link in the DOM.

* **Returns:** String `"https://..."` (The direct download URL) or `null` if not found yet.

---

## 📄 Full Example: Chapter Scraper (`mode: 'scrape'`)

Here is a complete, working example of a provider that scrapes chapter by chapter:

```javascript
module.exports = {
    id: 'allnovel',
    name: 'AllNovel',
    version: '1.1.2',
    icon: 'https://allnovel.org/uploads/thumbs/logo.png',
    mode: 'scrape', 
    
    categories: [
        { id: 'hot', name: 'Hot' },
        { id: 'popular', name: 'Most Popular' }
    ],

    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://allnovel.org';
        return categoryId === 'hot' ? `${baseUrl}/hot-novel?page=${page}` : `${baseUrl}/most-popular?page=${page}`;
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
                
                results.push({ title, url, sourceId: 'allnovel' });
            });
            return results;
        })();`,

    getNovelDetailsScript: () => `
        (() => {
            const descEl = document.querySelector('.desc-text');
            const authorEl = document.querySelector('.author');
            const chapterLinks = Array.from(document.querySelectorAll('ul.list-chapter li a'));
            
            return {
                description: descEl ? descEl.innerText.trim() : "No description available.",
                author: authorEl ? authorEl.innerText.trim() : "Unknown",
                lastChapter: chapterLinks.length > 0 ? chapterLinks[chapterLinks.length - 1].innerText.trim() : "N/A",
                firstChapterUrl: chapterLinks[0]?.href || window.location.href,
                allChapters: chapterLinks.map(a => ({ title: a.innerText.trim(), url: a.href }))
            };
        })();`,
        
    getChapterScript: () => `
        (() => {
            const title = document.querySelector('.chr-title')?.innerText?.trim();
            const paragraphs = Array.from(document.querySelectorAll('#chr-content p'))
                                   .map(p => p.innerText.trim())
                                   .filter(p => p.length > 0);
                                   
            const nextBtn = Array.from(document.querySelectorAll('a')).find(a => 
                (a.innerText || '').toLowerCase().includes('next') && a.href.startsWith('http')
            );
            
            return { 
                title: title || 'Untitled Chapter', 
                paragraphs, 
                nextUrl: nextBtn ? nextBtn.href : null 
            };
        })();`
};

```

---

## 📄 Full Example: Direct File Downloader (`mode: 'download'`)

Here is a working example of a provider that downloads entire files directly, using `getDownloadUrlScript`:

```javascript
module.exports = {
  id: 'annas',
  name: "Anna's Archive",
  version: '1.3.2',
  icon: 'https://annas-archive.gl/favicon.ico',
  mode: 'download',

  categories: [
    { id: 'recent', name: 'Recent' },
    { id: 'fiction', name: 'Fiction' }
  ],
  
  getCategoryUrl: (categoryId, page = 1) => {
        const params = { 'recent': '&sort=newest', 'fiction': '&fiction=1' };
        return `https://annas-archive.gl/search?index=&page=${page}${params[categoryId] || ''}&q=`;
  },

  getSearchUrl: (query, page = 1) => `https://annas-archive.gl/search?page=${page}&q=${encodeURIComponent(query)}`,

  getListScript: () => `
    (() => {
        const results = [];
        document.querySelectorAll('[class*="h-[125px]"], .flex.items-start').forEach(item => {
            const linkEl = item.querySelector('h3 a') || item.querySelector('a');
            if (!linkEl) return;
            results.push({
                title: linkEl.innerText.trim(),
                url: linkEl.href.startsWith('http') ? linkEl.href : 'https://annas-archive.gl' + linkEl.href,
                sourceId: 'annas'
            });
        });
        return results;
    })();`,

  getNovelDetailsScript: () => `
        (() => {
            const slowLinks = Array.from(document.querySelectorAll('a[href*="/slow_download/"]'));
            const downloadPageLink = slowLinks.length > 0 ? slowLinks[0].href : null;

            const titleEl = document.querySelector('.font-semibold.text-2xl');
            const authorEl = document.querySelector('a[href*="/search?q="] .icon-[mdi--user-edit]');

            return {
                title: titleEl ? titleEl.innerText.trim() : '',
                author: authorEl ? authorEl.closest('a').innerText.trim() : 'Unknown',
                lastChapter: "Full Book", 
                firstChapterUrl: downloadPageLink, // Passes the download page to the main process
                allChapters: [] 
            };
        })();`,

  getDownloadUrlScript: () => `
        (() => {
            // Check for direct text links
            const span = document.querySelector('span.break-all');
            if (span && span.innerText.trim().startsWith('http')) {
                return span.innerText.trim();
            }
            
            // Fallback to checking anchor tags for common file extensions
            const links = Array.from(document.querySelectorAll('a'));
            const fileLink = links.find(a => 
                a.innerText.toLowerCase().includes('download') || 
                a.href.includes('.epub') || 
                a.href.includes('.pdf')
            );
            return fileLink ? fileLink.href : null;
        })();`
};

```