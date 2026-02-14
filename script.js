// DOM Elements
const currentPostContainer = document.getElementById('current-post');
const archivePostsContainer = document.getElementById('archive-posts');
const recentPostsList = document.getElementById('recent-posts-list');
const homeLink = document.getElementById('home-link');
const archiveLink = document.getElementById('archive-link');
const archiveSection = document.getElementById('archive-section');
const postCountElement = document.getElementById('post-count');

// Create and add back to top button
const backToTopButton = document.createElement('div');
backToTopButton.className = 'back-to-top';
backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(backToTopButton);

// State variables
let posts = [];
let currentPost = null;

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Scroll to element function
function scrollToElement(element, offset = 20) {
    if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
        });
    }
}

// Show/hide back to top button based on scroll position
function toggleBackToTopButton() {
    if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
}

// Initialize the blog
async function initBlog() {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error('Failed to load posts.json');
        }
        
        const postFiles = await response.json();
        
        // Load each post
        posts = await Promise.all(
            postFiles.map(async (filename) => {
                const postResponse = await fetch(`post/${filename}`);
                if (!postResponse.ok) {
                    throw new Error(`Failed to load post: ${filename}`);
                }
                
                const fileExtension = filename.split('.').pop().toLowerCase();
                
                const parsed = parseFilename(filename);
                
                if (fileExtension === 'html') {
                    const content = await postResponse.text();
                    return {
                        filename,
                        title: parsed.title,
                        date: parsed.date,
                        content: content,
                        formattedDate: formatDate(parsed.date),
                        type: 'html'
                    };
                } else {
                    const content = await postResponse.text();
                    return {
                        filename,
                        title: parsed.title,
                        date: parsed.date,
                        content: content,
                        formattedDate: formatDate(parsed.date),
                        type: 'txt'
                    };
                }
            })
        );
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        updatePostCount(posts.length);
        
        if (posts.length > 0) {
            displayCurrentPost(posts[0]);
            currentPost = posts[0];
        }
        
        displayArchivePosts(posts.slice(1));
        
        displayRecentPosts(posts);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        currentPostContainer.innerHTML = `
            <div class="error">
                <h2>Error Loading Blog Posts</h2>
                <p>${error.message}</p>
                <p>Please check your file structure and try again.</p>
                <p>Make sure your posts.json file contains valid filenames and the post/ directory exists.</p>
            </div>
        `;
    }
}

// Update post count in author section
function updatePostCount(count) {
    if (postCountElement) {
        let current = 0;
        const increment = Math.ceil(count / 50);
        const timer = setInterval(() => {
            current += increment;
            if (current >= count) {
                current = count;
                clearInterval(timer);
            }
            postCountElement.textContent = current;
        }, 30);
    }
}

// Parse filename to extract date and title
function parseFilename(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    const parts = nameWithoutExt.split('-');
    
    if (parts.length >= 4) {
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const title = parts.slice(3).join(' '); // Rest is title
        
        return {
            date: new Date(dateStr),
            title: title.replace(/-/g, ' ')
        };
    } else {
        return {
            date: new Date(),
            title: nameWithoutExt.replace(/-/g, ' ')
        };
    }
}

// Format date to readable string
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Display the current (main) post
function displayCurrentPost(post) {
    let postContent;
    
    if (post.type === 'html') {
        postContent = post.content;
    } else {
        postContent = formatPostContent(post.content);
    }
    
    currentPostContainer.innerHTML = `
        <h1 class="post-title">${post.title}</h1>
        <div class="post-date">
            <i class="far fa-calendar"></i> Published on ${post.formattedDate}
            ${post.type === 'html' ? '<span class="post-type-badge">HTML</span>' : ''}
        </div>
        <div class="post-body">${postContent}</div>
    `;
    
    // Update active state
    homeLink.classList.add('active');
    archiveLink.classList.remove('active');
    archiveSection.style.display = 'block';
    
    // Scroll to top
    scrollToTop();
}

// Display archived posts (only titles)
function displayArchivePosts(archivePosts) {
    if (archivePosts.length === 0) {
        archivePostsContainer.innerHTML = '<p>No older posts available.</p>';
        return;
    }
    
    archivePostsContainer.innerHTML = archivePosts.map(post => `
        <div class="archive-post">
            <a href="#" class="archive-post-title" data-filename="${post.filename}">
                ${post.title}
                ${post.type === 'html' ? '<span class="archive-post-badge">HTML</span>' : ''}
            </a>
            <div class="archive-post-date">
                <i class="far fa-calendar"></i> ${post.formattedDate}
                <span class="post-file-type">${post.type.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to archive post links
    document.querySelectorAll('.archive-post-title').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filename = link.getAttribute('data-filename');
            const post = posts.find(p => p.filename === filename);
            if (post) {
                displayArchivePost(post);
            }
        });
    });
}

// Display a single archived post when clicked
function displayArchivePost(post) {
    // Determine content based on post type
    let postContent;
    
    if (post.type === 'html') {
        // For HTML posts, use the content as-is
        postContent = post.content;
    } else {
        // For TXT posts, format the content
        postContent = formatPostContent(post.content);
    }
    
    currentPostContainer.innerHTML = `
        <a href="#" class="back-home" id="back-home">
            <i class="fas fa-arrow-left"></i> Back to Latest Post
        </a>
        <h1 class="post-title">${post.title}</h1>
        <div class="post-date">
            <i class="far fa-calendar"></i> Published on ${post.formattedDate}
            ${post.type === 'html' ? '<span class="post-type-badge">HTML</span>' : ''}
        </div>
        <div class="post-body">${postContent}</div>
    `;
    
    // Add event listener to back home button
    document.getElementById('back-home').addEventListener('click', (e) => {
        e.preventDefault();
        displayCurrentPost(posts[0]);
        // Scroll to top after loading latest post
        setTimeout(() => scrollToTop(), 100);
    });
    
    // Update active state
    archiveLink.classList.add('active');
    homeLink.classList.remove('active');
    archiveSection.style.display = 'none';
    
    // Scroll to top
    scrollToTop();
}

// Display recent posts in the sidebar
function displayRecentPosts(allPosts) {
    // Show up to 5 most recent posts
    const recentPosts = allPosts.slice(0, 5);
    
    recentPostsList.innerHTML = recentPosts.map(post => `
        <li class="recent-post-item">
            <a href="#" class="recent-post-link" data-filename="${post.filename}">
                <span class="recent-post-title">${post.title}</span>
                <div class="recent-post-meta">
                    ${post.type === 'html' ? '<span class="recent-post-badge">HTML</span>' : ''}
                    <i class="fas fa-external-link-alt"></i>
                </div>
            </a>
        </li>
    `).join('');
    
    // Add event listeners to recent post links
    document.querySelectorAll('.recent-post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filename = link.getAttribute('data-filename');
            const post = posts.find(p => p.filename === filename);
            if (post) {
                if (post.filename === posts[0].filename) {
                    displayCurrentPost(post);
                } else {
                    displayArchivePost(post);
                }
            }
        });
    });
}

// Format TXT post content
function formatPostContent(content) {
    // Convert line breaks to paragraphs
    let formatted = content
        .split('\n\n')
        .map(paragraph => {
            if (paragraph.trim() === '') return '';
            
            // Check for headings (lines that end with :)
            if (paragraph.includes(':') && paragraph.split('\n').length === 1) {
                return `<h2>${paragraph}</h2>`;
            }
            
            // Check for bullet points
            if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
                const items = paragraph.split('\n').map(item => 
                    `<li>${item.substring(1).trim()}</li>`
                ).join('');
                return `<ul>${items}</ul>`;
            }
            
            // Check for numbered lists
            if (/^\d+\./.test(paragraph.trim())) {
                const items = paragraph.split('\n').map(item => {
                    const text = item.replace(/^\d+\.\s*/, '');
                    return `<li>${text}</li>`;
                }).join('');
                return `<ol>${items}</ol>`;
            }
            
            // Check for blockquotes
            if (paragraph.startsWith('>')) {
                const quote = paragraph.substring(1).trim();
                return `<blockquote>${quote}</blockquote>`;
            }
            
            // Regular paragraph
            return `<p>${paragraph}</p>`;
        })
        .join('');
    
    formatted = formatted.replace(/<\/p>\n<p>/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Set up event listeners for navigation
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (posts.length > 0) {
        displayCurrentPost(posts[0]);
        setTimeout(() => scrollToTop(), 100);
    }
});

archiveLink.addEventListener('click', (e) => {
    e.preventDefault();
    displayArchiveView();
    setTimeout(() => scrollToTop(), 100);
});

// Display all posts in an archive view
function displayArchiveView() {
    currentPostContainer.innerHTML = `
        <h1 class="post-title">All Posts</h1>
        <div class="archive-view">
            ${posts.map(post => `
                <div class="archive-view-post">
                    <h3>
                        <a href="#" class="archive-view-link" data-filename="${post.filename}">
                            ${post.title}
                            ${post.type === 'html' ? '<span class="post-type-badge">HTML</span>' : ''}
                        </a>
                    </h3>
                    <div class="archive-view-date">
                        <i class="far fa-calendar"></i> ${post.formattedDate}
                        <span class="post-file-type">${post.type.toUpperCase()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add event listeners to archive view links
    document.querySelectorAll('.archive-view-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filename = link.getAttribute('data-filename');
            const post = posts.find(p => p.filename === filename);
            if (post) {
                if (post.filename === posts[0].filename) {
                    displayCurrentPost(post);
                } else {
                    displayArchivePost(post);
                }
            }
        });
    });
    
    // Update active state
    archiveLink.classList.add('active');
    homeLink.classList.remove('active');
    archiveSection.style.display = 'none';
    
    // Scroll to top
    scrollToTop();
}

// Add scroll event listener
window.addEventListener('scroll', toggleBackToTopButton);

// Add click event to back to top button
backToTopButton.addEventListener('click', scrollToTop);

// Initialize the blog when the page loads
document.addEventListener('DOMContentLoaded', initBlog);