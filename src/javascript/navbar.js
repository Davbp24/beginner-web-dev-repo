// javascript/navbar.js

window.initNavbar = function () {
    const navItems = document.querySelectorAll(".nav-item");
    const navHighlight = document.getElementById("navHighlight");
    const mobileToggle = document.getElementById("mobileToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    let activeIndex = -1;

    // --- Core Highlight Logic ---

    // Move highlight under hovered/active item
    function moveHighlight(el) {
        if (!navHighlight) return; // Safety check
        if (!el) {
            navHighlight.style.opacity = "0";
            return;
        }
        
        // Find the closest parent that is the container for nav links for correct positioning
        const parentContainer = el.closest('.nav-links');
        if (!parentContainer) return;

        const rect = el.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        navHighlight.style.left = rect.left - parentRect.left + "px";
        navHighlight.style.width = rect.width + "px";
        navHighlight.style.opacity = "1";
    }

    // Get base path (matches router)
    function getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/src/')) {
            return '/src';
        }
        return '';
    }

    const BASE_PATH = getBasePath();

    // Normalize path helper (matches router)
    function normalizePath(path) {
        // Remove base path if present
        if (BASE_PATH && path.startsWith(BASE_PATH)) {
            path = path.substring(BASE_PATH.length);
        }
        // Remove trailing slash, but keep single "/" as is
        return path.replace(/\/$/, "") || "/";
    }

    // --- Active State Logic (Exposed to Router) ---

    // Set active item based on URL
    function setActiveByPath() {
        // Use window.location.pathname to determine the current path
        const currentPath = normalizePath(window.location.pathname);
        
        activeIndex = Array.from(navItems).findIndex((item) => {
            const itemPath = normalizePath(item.getAttribute("href"));
            return itemPath === currentPath;
        });

        navItems.forEach((item, i) => {
            // Add a class for CSS styling, which is generally better than inline styles
            if (i === activeIndex) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        if (activeIndex >= 0) moveHighlight(navItems[activeIndex]);
        else navHighlight.style.opacity = "0";
    }

    // **IMPORTANT:** Expose this function for the router to call after navigation
    window.setActiveNavState = setActiveByPath; 
    
    // --- Event Listeners ---
    
    // 1. Click: Updates the active index immediately.
    navItems.forEach((item, i) => {
        item.addEventListener("click", () => {
            // The router handles the page change, we just ensure the visual state is updated
            // It's technically redundant as the router will call setActiveNavState after navigation, 
            // but keeps the activeIndex variable correct for hover logic.
            activeIndex = i; 
        });

        // 2. Hover: Move highlight to the hovered item.
        item.addEventListener("mouseenter", () => moveHighlight(item));
        
        // 3. Mouse Leave: Move highlight back to the active item.
        item.addEventListener("mouseleave", () => {
            if (activeIndex >= 0) moveHighlight(navItems[activeIndex]);
            else navHighlight.style.opacity = "0";
        });
    });

    // 4. Resize: Re-position highlight on screen size changes.
    window.addEventListener("resize", () => {
        if (activeIndex >= 0) moveHighlight(navItems[activeIndex]);
    });

    // Initial call to set the active state when the navbar is loaded
    setActiveByPath();

    // 5. Mobile toggle menu
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            mobileToggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });
        
        // Close mobile menu on click of any mobile link (optional but recommended for UX)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove("open");
                mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }
}