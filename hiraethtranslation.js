module.exports = {
    id: 'hiraethtranslation',
    name: 'HiraethTranslation',
    version: '1.1.0',
    icon: 'https://hiraethtranslation.com/wp-content/uploads/2023/03/HTL.png',
    
    // 1. Define available categories
    categories: [
        { id: 'popular', name: 'Most Popular' },
        { id: 'latest', name: 'Latest Updates' },
        { id: 'new', name: 'New Novels' }
    ],

    // 2. Map category URLs (Madara theme format)
    getCategoryUrl: (categoryId, page = 1) => {
        const baseUrl = 'https://hiraethtranslation.com/novels';
        const pagePath = page > 1 ? `/page/${page}/` : '/';
        
        switch (categoryId) {
            case 'popular': return `${baseUrl}${pagePath}?m_orderby=views`;
            case 'latest': return `${baseUrl}${pagePath}?m_orderby=latest`;
            case 'new': return `${baseUrl}${pagePath}?m_orderby=new-manga`;
            default: return `${baseUrl}${pagePath}?m_orderby=views`;
        }
    },
    
    // 3. Search URL
    getSearchUrl: (query, page = 1) => {
        const pagePath = page > 1 ? `page/${page}/` : '';
        return `https://hiraethtranslation.com/${pagePath}?s=${encodeURIComponent(query).replace(/%20/g, '+')}&post_type=wp-manga`;
    },

    // 4. Details Extraction (Tailored for Madara Themes)
    getNovelDetailsScript: () => `
    (() => {
        // Extract Description
        const descEl = document.querySelector('.summary__content, .manga-summary, .post-content_item .summary-content');
        const description = descEl ? descEl.innerText.trim() : "No description available.";

        // Extract Author
        const authorEl = document.querySelector('.author-content a, .manga-author a');
        const author = authorEl ? authorEl.innerText.trim() : "Unknown Author";

        // Extract Chapters
        const chapterLinks = document.querySelectorAll('li.wp-manga-chapter a');
        let allChapters = Array.from(chapterLinks).map(a => ({
            title: a.innerText.trim(),
            url: a.href
        }));

        // Madara themes typically list chapters newest first. 
        // We reverse it so Chapter 1 is at the top of your list.
        if (allChapters.length > 0) {
            allChapters.reverse();
        }

        const lastChText = allChapters.length > 0 ? allChapters[allChapters.length - 1].title : "N/A";
        
        // Find the "Read First" button or fallback to the first chapter in our reversed list
        const firstChEl = document.querySelector('.btn-read-first a, a.wp-manga-action-button');
        const firstChapterUrl = firstChEl ? firstChEl.href : (allChapters.length > 0 ? allChapters[0].url : window.location.href);

        return {
            description,
            author,
            lastChapter: lastChText,
            firstChapterUrl,
            allChapters: allChapters.slice(0, 500) // Prevent IPC memory overload
        };
    })();`,
    
    // 5. List/Search Extraction
    getListScript: () => `
    (() => {
        const results = [];
        const mainContent = document.querySelector('.c-page-content, .site-content, .main-col, .content-area, #content') || document;
        const titleLinks = mainContent.querySelectorAll('.post-title h3 a, .post-title h4 a, .tab-content h3 a');
        
        titleLinks.forEach(aEl => {
            try {
                // Ignore trending widgets/sidebars
                if (aEl.closest('.c-sidebar, .widget, .sidebar, .popular-slider')) return;
                
                const title = aEl.innerText.trim();
                const url = aEl.href;
                
                if (!title || !url) return;
                
                const container = aEl.closest('.c-tabs-item__content, .row, .page-item-detail, .manga-item');
                let cover = null;
                let chapters = "Latest";
                
                if (container) {
                    const imgEl = container.querySelector('img');
                    if (imgEl) {
                        cover = imgEl.getAttribute('data-src') || 
                                imgEl.getAttribute('data-lazy-src') || 
                                imgEl.getAttribute('src');
                    }

                    const chapEl = container.querySelector('.chapter a, .font-meta.chapter a, .chapter-item a');
                    if (chapEl) {
                        chapters = chapEl.innerText.trim();
                    }
                }
                
                if (!results.find(r => r.url === url)) {
                    results.push({ title, url, chapters, cover, source: 'HiraethTranslation' });
                }
            } catch (error) {
                console.warn('Scraping error on HiraethTranslation:', error);
            }
        });
        
        return results;
    })();`
};