window.initChat = function() {
    console.log("Chat initialized: Setting up listeners and state.");

    // --- State Variables ---
    let isOpen = false; // Initial state: Collapsed
    let messages = [];
    let showSettings = false;
    let showAccount = false;
    let showSavedPopup = false;
    
    // --- DOM Elements ---
    const sidebarContainer = document.getElementById('sidebar-container');
    const toggleCollapsedBtn = document.getElementById('toggle-collapsed');
    const toggleExpandedBtn = document.getElementById('toggle-expanded');
    const sidebarExpanded = document.getElementById('sidebar-expanded');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    // Utility Bar Elements
    const userIcon = document.getElementById('user-icon');
    const gearIcon = document.getElementById('gear-icon');
    const saveButton = document.getElementById('save-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const accountOverlay = document.getElementById('account-overlay');
    const savePopup = document.getElementById('save-popup');

    // --- Configuration ---
    const defaultMessages = [
        { text: "Hey, did you finish the wireframe?", sender: "A", fromSelf: false },
        { text: "Almost! I’m updating the sticky note layout.", sender: "L", fromSelf: true },
        { text: "Nice — send it over when ready.", sender: "S", fromSelf: false },
    ];
    
    // --- Core Functions ---

    const loadMessages = () => {
        const saved = localStorage.getItem("chatMessages");
        try {
            messages = saved ? JSON.parse(saved) : defaultMessages;
        } catch (e) {
            console.error("Error parsing messages from localStorage:", e);
            messages = defaultMessages;
        }
    };

    const saveMessages = () => {
        localStorage.setItem("chatMessages", JSON.stringify(messages));
    };

    /**
     * Renders all messages to the DOM and scrolls to the bottom.
     */
    const renderMessages = () => {
        messagesContainer.innerHTML = ''; // Clear previous messages
        messages.forEach((msg) => {
            // Determine alignment and colors
            const alignClass = msg.fromSelf ? "flex-col items-end" : "flex-col items-start";
            const bubbleClasses = msg.fromSelf
                ? "bg-blue-600 text-white self-end"
                : "bg-[#2b3037] text-gray-200 self-start";
            const senderClasses = msg.fromSelf ? "self-end" : "self-start";

            const messageDiv = document.createElement('div');
            messageDiv.className = `flex ${alignClass} gap-1 animate-bounce-in w-full`;
            
            // Message Bubble
            const bubble = document.createElement('div');
            bubble.className = `${bubbleClasses} rounded-2xl px-3 py-2 text-[12px] leading-relaxed max-w-[80%] shadow-sm whitespace-pre-wrap`;
            bubble.style.wordWrap = 'break-word';
            bubble.style.overflowWrap = 'break-word';
            bubble.textContent = msg.text;
            

            // Sender Initials
            const senderInitials = document.createElement('div');
            senderInitials.className = `rounded-full flex items-center justify-center text-black text-xs px-2 py-0.5 font-semibold bg-gray-200 ${senderClasses}`;
            senderInitials.textContent = msg.sender;

            messageDiv.appendChild(bubble);
            messageDiv.appendChild(senderInitials);
            messagesContainer.appendChild(messageDiv);
        });

        // Scroll to the bottom of the chat
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const onToggle = () => {
        isOpen = !isOpen;
        renderSidebar();
    };

    /**
     * Applies the dynamic sizing styles based on the isOpen state.
     */
    const renderSidebar = () => {
        // Apply main container styles
        sidebarContainer.style.top = isOpen ? "7.5%" : "50%";
        sidebarContainer.style.transform = isOpen ? "translateY(0)" : "translateY(-50%)";
        sidebarContainer.style.width = isOpen ? "20rem" : "2.5rem";
        sidebarContainer.style.height = isOpen ? "90vh" : "2.5rem";
        sidebarContainer.style.borderRadius = isOpen ? "1.25rem" : "50%";
        
        // Show/Hide content based on state
        if (isOpen) {
            toggleCollapsedBtn.style.display = 'none';
            sidebarExpanded.style.display = 'flex';
            
            // Render messages immediately (removed 500ms delay)
            renderMessages(); 
        } else {
            toggleCollapsedBtn.style.display = 'flex';
            sidebarExpanded.style.display = 'none';
        }
    };

    const handleSend = () => {
        const text = messageInput.value.trim();
        if (!text) return;

        const newMessageObj = { text: text, sender: "L", fromSelf: true };
        messages.push(newMessageObj);
        
        messageInput.value = ""; // Clear input
        saveMessages();
        renderMessages();
    };

    const handleSave = () => {
        if (showSavedPopup) return;

        showSavedPopup = true;
        renderUtilityBar();

        setTimeout(() => {
            showSavedPopup = false;
            renderUtilityBar();
        }, 2000);
    };
    
    const toggleSettings = (show) => {
        showSettings = typeof show === 'boolean' ? show : !showSettings;
        showAccount = false; 
        renderUtilityBar();
    };

    const toggleAccount = (show) => {
        showAccount = typeof show === 'boolean' ? show : !showAccount;
        showSettings = false; 
        renderUtilityBar();
    };

    const renderUtilityBar = () => {
        // Render Modals
        settingsOverlay.style.display = showSettings ? 'flex' : 'none';
        accountOverlay.style.display = showAccount ? 'flex' : 'none';

        // Render Save Popup
        if (showSavedPopup) {
            savePopup.style.display = 'flex';
            // Restart animation
            savePopup.classList.remove('animate-fade-in-out');
            void savePopup.offsetWidth; 
            savePopup.classList.add('animate-fade-in-out');
        } else {
            // Hide after animation cycle completes 
            if (!savePopup.classList.contains('animate-fade-in-out')) {
                savePopup.style.display = 'none';
            }
        }
    };


    // --- Event Listeners & Initialization ---
    
    // 1. Load data
    loadMessages();
    
    // 2. Initial render for all dynamic elements
    renderSidebar();
    renderUtilityBar();

    // 3. Attach Sidebar listeners
    toggleCollapsedBtn.addEventListener('click', onToggle);
    toggleExpandedBtn.addEventListener('click', onToggle);
    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // 4. Attach Utility Bar listeners
    userIcon.addEventListener('click', () => toggleAccount(true));
    gearIcon.addEventListener('click', () => toggleSettings(true));
    saveButton.addEventListener('click', handleSave);

    // 5. Add click listeners to close overlays (backdrop clicks)
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) toggleSettings(false);
    });
    accountOverlay.addEventListener('click', (e) => {
        if (e.target === accountOverlay) toggleAccount(false);
    });
    
    // Expose toggle functions globally for use in modal buttons
    window.toggleSettings = toggleSettings;
    window.toggleAccount = toggleAccount;
};