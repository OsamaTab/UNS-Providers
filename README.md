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
- `beta`: Boolean (optional, for testing).
- `icon`: Favicon URL.

Example:
```js
id: 'newsite',
name: "New Site",
version: '1.0.0',
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
- `getListScript`: Parse search results.
- `getNovelDetailsScript`: Parse book or novel details.
- `getFileInfoScript`: Parse file info.

Use `document.querySelectorAll` to extract data.

## manifest.json Example
```json
{
  "id": "annas",
  "name": "Anna's Archive",
  "version": "1.2.0",
  "beta": true,
  "icon": "https://annas-archive.gl/favicon.ico"
}
```