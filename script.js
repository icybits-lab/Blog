// DOM Elements
const currentPostContainer = document.getElementById('current-post');
const archivePostsContainer = document.getElementById('archive-posts');
const recentPostsList = document.getElementById('recent-posts-list');
const homeLink = document.getElementById('home-link');
const archiveLink = document.getElementById('archive-link');
const archiveSection = document.getElementById('archive-section');
const postCountElement = document.getElementById('post-count');

// State variables
let posts = [];
let currentPost = null;

// Initialize the blog
async function initBlog() {
    try {
        // Load the posts.json file
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
                
                // Get file extension
                const fileExtension = filename.split('.').pop().toLowerCase();
                
                // Parse the filename to extract date and title
                const parsed = parseFilename(filename);
                
                // Load content based on file type
                if (fileExtension === 'html') {
                    // For HTML files, get the content as HTML
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
                    // For TXT files and any other text files
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
        
        // Update post count in author section
        updatePostCount(posts.length);
        
        // Display the first (newest) post as current
        if (posts.length > 0) {
            displayCurrentPost(posts[0]);
            currentPost = posts[0];
        }
        
        // Display archive posts (all except the first)
        displayArchivePosts(posts.slice(1));
        
        // Display recent posts in sidebar
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
        // Animate the count up
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

// Parse filename to extract date and title (supports .txt and .html)
function parseFilename(filename) {
    // Remove file extension (.txt or .html)
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Split by dash, first three parts should be date
    const parts = nameWithoutExt.split('-');
    
    if (parts.length >= 4) {
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const title = parts.slice(3).join(' '); // Rest is title
        
        return {
            date: new Date(dateStr),
            title: title.replace(/-/g, ' ') // Replace hyphens with spaces
        };
    } else {
        // Fallback if filename doesn't match expected format
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
    });
    
    // Update active state
    archiveLink.classList.add('active');
    homeLink.classList.remove('active');
    archiveSection.style.display = 'none';
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

// Format TXT post content (basic markdown-like formatting)
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
    
    // Convert single line breaks to <br> tags within paragraphs
    formatted = formatted.replace(/<\/p>\n<p>/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Set up event listeners for navigation
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (posts.length > 0) {
        displayCurrentPost(posts[0]);
    }
});

archiveLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Show all posts in archive view
    displayArchiveView();
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
}

// Initialize the blog when the page loads
document.addEventListener('DOMContentLoaded', initBlog);