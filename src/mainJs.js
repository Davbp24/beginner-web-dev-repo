// mainJS.js - COMPLETE FIXED VERSION for dynamic loading and SPA functions

// Load partial HTML into a container
async function loadHTML(path, containerId) {
    const container = document.getElementById(containerId);
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p>Error loading page: ${path}</p>`;
        console.error("Failed to load HTML:", path, err);
    }
}

// --- ROUTER ---

// Get the base path from the current location
function getBasePath() {
    const path = window.location.pathname;
    // If accessing mainapp.html or index.html, get the directory
    if (path.includes('/src/')) {
        return '/src';
    }
    return '';
}

const BASE_PATH = getBasePath();
console.log("Base path detected:", BASE_PATH || "(root)");

// Centralized route map
const routes = {
    "/": "Pages/homepage.html",
    "/home": "Pages/homepage.html",
    "/board": "Pages/board.html",
    "/chat": "Pages/chats.html",
    "/login": "Pages/login.html",
    "/signin": "Pages/signin.html",
};

// Normalize path helper - removes base path and trailing slashes
function normalizePath(path) {
    // Remove base path if present
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
        path = path.substring(BASE_PATH.length);
    }
    // Remove trailing slash, but keep single "/" as is
    path = path.replace(/\/$/, "") || "/";
    return path;
}

// Build full path with base
function buildPath(route) {
    return BASE_PATH + route;
}

// Navigate to a route (no reload)
async function navigate(path) {
    const pageContainer = document.getElementById("page-content");
    const navbarContainer = document.getElementById("navbar-container");

    // Normalize path (remove base and trailing slash)
    path = normalizePath(path);
    console.log("Navigating to:", path);

    // Check for a valid route
    const route = routes[path] || null;
    if (!route) {
        pageContainer.innerHTML = `<h2>404 Page Not Found</h2><p>Path: ${path}</p>`;
        window.history.replaceState({}, "", buildPath(path));
        if (window.setActiveNavState) window.setActiveNavState();
        return;
    }

    console.log("Loading route:", route);

    // Show/Hide Navbar
    if (navbarContainer) {
        if (path === "/board" || path === "/chat" || path === "/login" || path === "/signin") {
            // Hide navbar for board, chat, and login pages
            navbarContainer.style.display = 'none';
            console.log("Navbar hidden for:", path);
        } else {
            // Show navbar for all other pages
            navbarContainer.style.display = '';
            console.log("Navbar shown.");
        }
    }

    // Load the HTML
    await loadHTML(route, "page-content");

    // Call navbar state updater
    if (window.setActiveNavState) window.setActiveNavState();

    // ---  Load route-specific JS ---
    if (path === "/board") {
        try {
            // Check if scripts are already loaded (using sentinel value like window.initBoard)
            if (!window.initBoard || !window.initPomodoro) { // Check for Pomodoro init function too
                
                // 1. Board Script
                const script = document.createElement("script");
                script.src = "javascript/board.js";
                document.body.appendChild(script);

                // 2. Chat Script
                const chatScript = document.createElement("script");
                chatScript.src = "javascript/chat.js";
                document.body.appendChild(chatScript);

                // 3. Pomodoro Script
                const pomodoroScript = document.createElement("script");
                pomodoroScript.src = "javascript/pomodoro.js";
                document.body.appendChild(pomodoroScript);
                // ------------------------------------

                script.onload = () => {
                    setTimeout(() => {
                        if (window.initBoard) {
                            console.log("Initializing board...");
                            window.initBoard();
                        }
                    }, 0);
                };

                chatScript.onload = () => {
                    setTimeout(() => {
                        if (window.initChat) {
                            console.log("Initializing chat...");
                            window.initChat();
                        }
                    }, 0);
                };

                // ⭐ CALL INITPOMODORO AFTER SCRIPT LOADED ⭐
                pomodoroScript.onload = () => {
                    setTimeout(() => {
                        if (window.initPomodoro) {
                            console.log("Initializing pomodoro...");
                            window.initPomodoro(); 
                        }
                    }, 0);
                };
                // ---------------------------------------------

            } else {
                // If scripts are already defined, call their init functions again
                setTimeout(() => {
                    console.log("Re-initializing board (already loaded)...");
                    window.initBoard();

                    if (window.initChat) {
                        console.log("Re-initializing chat (already loaded)...");
                        window.initChat();
                    }

                    // ⭐ RE-CALL INITPOMODORO FOR SUBSEQUENT NAVIGATIONS ⭐
                    if (window.initPomodoro) {
                        console.log("Re-initializing pomodoro...");
                        window.initPomodoro(); 
                    }
                    // --------------------------------------------------

                }, 0);
            }
            console.log("✅ Board, Chat, and Pomodoro scripts handled");
        } catch (err) {
            console.error("Failed to load board/chat/pomodoro scripts:", err);
        }
    } else if (path === "/login") {
        try {
            // Check if login script is already loaded
            if (!window.loginInitialized) {
                // Remove old script if it exists to allow re-initialization
                const oldScript = document.querySelector('script[src*="login.js"]');
                if (oldScript) {
                    oldScript.remove();
                }

                const loginScript = document.createElement("script");
                loginScript.src = "javascript/login.js";
                document.body.appendChild(loginScript);

                loginScript.onload = () => {
                    console.log("✅ Login script loaded");
                    window.loginInitialized = true;
                };

                loginScript.onerror = () => {
                    console.error("Failed to load login.js");
                };
            } else {
                // Since login.js uses DOMContentLoaded, re-dispatch it
                console.log("Re-initializing login page...");
                const event = new Event('DOMContentLoaded');
                document.dispatchEvent(event);
            }
        } catch (err) {
            console.error("Failed to load login script:", err);
        }
    }
}

// Initialize the SPA
async function initApp() {
    console.log("Initializing app...");

    // --- Load the Navbar ---
    await loadHTML("components/navbar.html", "navbar-container");

    // Load navbar JS
    const navbarScript = document.createElement("script");
    navbarScript.src = "javascript/navbar.js";
    document.body.appendChild(navbarScript);
    await new Promise((resolve) => {
        navbarScript.onload = resolve;
        navbarScript.onerror = () => {
            console.error("Failed to load navbar.js");
            resolve();
        };
    });

    if (window.initNavbar) {
        window.initNavbar();
    } else {
        console.warn("window.initNavbar not found");
    }

    // --- Initial route (based on current URL) ---
    const initialPath = window.location.pathname;
    console.log("Initial path:", initialPath);

    // If we're at mainapp.html or index.html, go to home
    if (initialPath.endsWith('mainapp.html') || initialPath.endsWith('index.html')) {
        window.history.replaceState({}, "", buildPath('/'));
        await navigate('/');
    } else {
        await navigate(initialPath);
    }

    // --- Handle link clicks (intercept) ---
    document.body.addEventListener("click", (e) => {
        const link = e.target.closest("a[href]");
        if (!link) return;

        const href = link.getAttribute("href");

        // Skip external links and hash links
        if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;

        // Create URL to check if it's internal
        try {
            const url = new URL(href, window.location.origin);
            const path = normalizePath(url.pathname);

            console.log("Link clicked:", href, "-> normalized:", path);

            // Only handle internal routes that are defined
            if (routes[path]) {
                e.preventDefault();
                window.history.pushState({}, "", buildPath(path));
                navigate(path);
            } else {
                console.log("Route not defined:", path);
            }
        } catch (err) {
            console.error("Error processing link:", href, err);
        }
    });

    // --- Handle browser navigation (back/forward) ---
    window.addEventListener("popstate", () => {
        console.log("Popstate event, navigating to:", window.location.pathname);
        navigate(window.location.pathname);
    });

    console.log("App initialized successfully");
}

// --- Boot up the app ---
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}