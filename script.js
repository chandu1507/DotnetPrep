// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Calculate offset for sticky navigation
                const navHeight = document.querySelector('.main-nav').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active navigation item
                updateActiveNavItem(this);
            }
        });
    });
    
    // Highlight active navigation item based on scroll position
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const navHeight = document.querySelector('.main-nav').offsetHeight;
        
        navLinks.forEach(link => {
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const sectionTop = targetSection.offsetTop - navHeight - 50;
                const sectionBottom = sectionTop + targetSection.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    updateActiveNavItem(link);
                }
            }
        });
    });
    
    function updateActiveNavItem(activeLink) {
        // Remove active class from all nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current link
        activeLink.classList.add('active');
    }
    
    // Add search functionality
    addSearchFunctionality();
    
    // Add copy code functionality
    addCopyCodeFunctionality();
    
    // Add expand/collapse functionality for large code blocks
    addCodeBlockToggle();
});

// Search functionality
function addSearchFunctionality() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <input type="text" id="search-input" placeholder="Search topics..." />
        <div id="search-results"></div>
    `;
    
    // Insert search container after header
    const header = document.querySelector('header');
    header.insertAdjacentElement('afterend', searchContainer);
    
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        const results = searchContent(query);
        displaySearchResults(results, searchResults);
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function searchContent(query) {
    const sections = document.querySelectorAll('.topic-section');
    const results = [];
    
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        const sectionId = section.id;
        
        // Search in section content
        const content = section.textContent.toLowerCase();
        if (content.includes(query)) {
            // Find specific matches in subsections
            const cards = section.querySelectorAll('.concept-card');
            cards.forEach(card => {
                const cardTitle = card.querySelector('h3').textContent;
                const cardContent = card.textContent.toLowerCase();
                
                if (cardContent.includes(query)) {
                    results.push({
                        section: sectionTitle,
                        subsection: cardTitle,
                        id: sectionId,
                        relevance: calculateRelevance(cardContent, query)
                    });
                }
            });
        }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

function calculateRelevance(content, query) {
    const matches = (content.match(new RegExp(query, 'gi')) || []).length;
    return matches;
}

function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result">No results found</div>';
    } else {
        container.innerHTML = results.map(result => `
            <div class="search-result" onclick="navigateToSection('${result.id}')">
                <strong>${result.section}</strong>
                <div class="search-subsection">${result.subsection}</div>
            </div>
        `).join('');
    }
    
    container.style.display = 'block';
}

function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navHeight = document.querySelector('.main-nav').offsetHeight;
        const targetPosition = section.offsetTop - navHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Hide search results
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('search-input').value = '';
    }
}

// Copy code functionality
function addCopyCodeFunctionality() {
    const codeBlocks = document.querySelectorAll('.code-example');
    
    codeBlocks.forEach(block => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.textContent = 'Copy';
        copyButton.title = 'Copy code to clipboard';
        
        copyButton.addEventListener('click', function() {
            const code = block.querySelector('pre').textContent;
            
            navigator.clipboard.writeText(code).then(() => {
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#27ae60';
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.style.backgroundColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                copyButton.textContent = 'Failed';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        });
        
        block.style.position = 'relative';
        block.appendChild(copyButton);
    });
}

// Code block toggle for large blocks
function addCodeBlockToggle() {
    const codeBlocks = document.querySelectorAll('.code-example pre');
    
    codeBlocks.forEach(pre => {
        const lines = pre.textContent.split('\n').length;
        
        if (lines > 15) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-code-btn';
            toggleButton.textContent = 'Show More';
            
            pre.style.maxHeight = '300px';
            pre.style.overflow = 'hidden';
            
            toggleButton.addEventListener('click', function() {
                if (pre.style.maxHeight === '300px') {
                    pre.style.maxHeight = 'none';
                    this.textContent = 'Show Less';
                } else {
                    pre.style.maxHeight = '300px';
                    this.textContent = 'Show More';
                }
            });
            
            pre.parentElement.appendChild(toggleButton);
        }
    });
}

// Progress indicator
function addProgressIndicator() {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill"></div>';
    
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        
        document.querySelector('.progress-fill').style.width = progress + '%';
    });
}

// Initialize progress indicator
document.addEventListener('DOMContentLoaded', function() {
    addProgressIndicator();
});

// Back to top button
function addBackToTopButton() {
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '↑';
    backToTop.title = 'Back to top';
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize back to top button
document.addEventListener('DOMContentLoaded', function() {
    addBackToTopButton();
});
