// File: ../javascript/pomodoro.js

window.initPomodoro = function() {
    console.log("Pomodoro initialized via window.initPomodoro()");
    
    // Check if the script has already initialized its listeners
    if (window.pomodoroInitialized) {
        console.log("Pomodoro listeners already set. Skipping.");
        return;
    }
    
    // --- DOM Elements ---
    const pomodoroContainer = document.getElementById('pomodoro-container');
    const collapsedButton = document.getElementById('pomodoro-toggle-collapsed');
    const collapsedTimerDisplay = document.getElementById('collapsed-timer-display'); // Time display in collapsed state
    const collapsedStateIcon = document.getElementById('collapsed-state-icon'); // NEW: Icon in collapsed state
    const expandedPanel = document.getElementById('pomodoro-expanded');
    const closeButton = document.getElementById('pomodoro-toggle-expanded');
    const timerDisplay = document.getElementById('timer-display');
    const startStopButton = document.getElementById('pomodoro-start-stop');
    const resetButton = document.getElementById('pomodoro-reset');
    const timerPhase = document.getElementById('timer-phase');
    const pomodoroCountDisplay = document.getElementById('pomodoro-count');
    
    // CRITICAL: Check if elements exist before proceeding
    if (!pomodoroContainer || !collapsedButton || !expandedPanel || !startStopButton) {
        console.error("Pomodoro DOM elements missing. Cannot initialize.");
        return;
    }

    // Safely get the icon only if the button exists
    const startStopIcon = startStopButton.querySelector('i');

    // --- Pomodoro State & Config ---
    const TIME_POMODORO = 25 * 60; // 25 minutes (seconds)
    const TIME_SHORT_BREAK = 5 * 60;  // 5 minutes
    const TIME_LONG_BREAK = 15 * 60; // 15 minutes
    const LONG_BREAK_INTERVAL = 4; // Long break after 4 pomodoros

    let currentPhase = 'pomodoro'; // 'pomodoro', 'short-break', 'long-break'
    let timeRemaining = TIME_POMODORO;
    let isRunning = false;
    let intervalId = null;
    let pomodoroCount = 0;
    
    // NEW STATE FOR COLLAPSE/EXPAND
    let isPomodoroOpen = false; // Initial state: Collapsed

    // --- Helper Functions (all remain the same) ---
    const formatTime = (seconds) => {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    const updateDisplay = () => {
        const time = formatTime(timeRemaining);
        
        // Expanded display
        timerDisplay.textContent = time;
        timerPhase.textContent = currentPhase.replace('-', ' ').toUpperCase();
        pomodoroCountDisplay.textContent = pomodoroCount;
        
        // Collapsed display
        if (collapsedTimerDisplay) {
            collapsedTimerDisplay.textContent = time;
        }
        
        // Update the collapsed icon based on running state
        if (collapsedStateIcon) {
             if (isRunning) {
                 collapsedStateIcon.classList.replace('fa-play', 'fa-pause');
                 collapsedStateIcon.classList.replace('fa-stopwatch', 'fa-pause');
                 collapsedButton.title = "Timer is running (Click to expand)";
             } else {
                 collapsedStateIcon.classList.replace('fa-pause', 'fa-play');
                 collapsedStateIcon.classList.replace('fa-stopwatch', 'fa-play');
                 collapsedButton.title = "Timer is paused (Click to expand)";
             }
        }
        
        // Update colors based on phase for visual cues
        const phaseColors = {
            'pomodoro': { text: 'text-red-400', button: 'bg-red-500 hover:bg-red-600' },
            'short-break': { text: 'text-green-400', button: 'bg-green-500 hover:bg-green-600' },
            'long-break': { text: 'text-blue-400', button: 'bg-blue-500 hover:bg-blue-600' }
        };

        // Reset all color classes
        timerPhase.classList.remove('text-red-400', 'text-green-400', 'text-blue-400');
        
        // Use a more careful way to remove background classes from button
        const classesToKeep = startStopButton.className.split(' ').filter(c => !c.startsWith('bg-') && !c.startsWith('hover:bg-') && c.length > 0);
        startStopButton.className = classesToKeep.join(' ');


        // Apply current phase color classes
        timerPhase.classList.add(phaseColors[currentPhase].text);
        startStopButton.classList.add(...phaseColors[currentPhase].button.split(' '));
        
        // Update collapsed button color (NEW)
        const currentBg = phaseColors[currentPhase].button.split(' ')[0]; // e.g., 'bg-red-500'
        
        // Preserve the new collapsed button classes from HTML (rounded-lg, flex, items-center, justify-center, gap-2, text-white, shadow-lg, px-2, py-1.5, etc.)
        const collapsedClassesToKeep = collapsedButton.className.split(' ').filter(c => !c.startsWith('bg-') && !c.startsWith('hover:bg-') && c.length > 0);
        collapsedButton.className = collapsedClassesToKeep.join(' ');
        
        // Add back necessary structural and new background/hover classes
        collapsedButton.classList.add('h-full', 'flex', 'items-center', 'justify-center', 'gap-2', 'text-white', 'rounded-lg', 'transition-colors', 'duration-150', 'cursor-pointer', 'shadow-lg', 'px-2', 'py-1.5', currentBg, currentBg.replace('bg-', 'hover:bg-'));
    };

    const startTimer = () => {
        if (isRunning) return;
        isRunning = true;
        // Expanded icon
        startStopIcon.classList.replace('fa-play', 'fa-pause');
        startStopButton.title = "Pause Timer";
        // Collapsed icon (updated via updateDisplay)
        updateDisplay(); 

        intervalId = setInterval(() => {
            timeRemaining--;
            updateDisplay();

            if (timeRemaining <= 0) {
                clearInterval(intervalId);
                handlePhaseEnd();
            }
        }, 1000);
    };

    const pauseTimer = () => {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(intervalId);
        // Expanded icon
        startStopIcon.classList.replace('fa-pause', 'fa-play');
        startStopButton.title = "Start Timer";
        // Collapsed icon (updated via updateDisplay)
        updateDisplay(); 
    };

    const resetTimer = () => {
        pauseTimer();
        
        // Set time back to the STARTING duration of the current phase
        if (currentPhase === 'pomodoro') {
            timeRemaining = TIME_POMODORO;
        } else if (currentPhase === 'short-break') {
            timeRemaining = TIME_SHORT_BREAK;
        } else if (currentPhase === 'long-break') {
            timeRemaining = TIME_LONG_BREAK;
        }
        
        updateDisplay();
    };

    const handlePhaseEnd = () => {
        alert(`${currentPhase.replace('-', ' ')} finished! Time for the next phase.`);

        if (currentPhase === 'pomodoro') {
            pomodoroCount++;
            if (pomodoroCount % LONG_BREAK_INTERVAL === 0) {
                currentPhase = 'long-break';
                timeRemaining = TIME_LONG_BREAK;
            } else {
                currentPhase = 'short-break';
                timeRemaining = TIME_SHORT_BREAK;
                
            }
        } else { // break phase (short or long) ends
            currentPhase = 'pomodoro';
            timeRemaining = TIME_POMODORO;
        }

        updateDisplay();
        // Automatically start the next phase
        startTimer();
    };

    const toggleStartStop = () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    };
    
    // --- Collapse/Expand Logic (UPDATED) ---
    
    const renderPomodoro = () => {
        // Collapsed Dimensions (centered)
        const collapsedWidth = '6.5rem'; // Auto is better, but this ensures a minimum width
        const collapsedHeight = '2.25rem'; // Matches button's py-1.5 height
        const collapsedBorderRadius = '0.8rem'; // Small rounded rectangle (rounded-lg)

        // Expanded Dimensions
        const expandedTop = '7%';
        const expandedWidth = '20rem';
        const expandedHeight = '22rem'; 
        const expandedBorderRadius = '1.25rem'; // rounded-xl

        
        // Apply Centering and Vertical Position
        pomodoroContainer.style.top = isPomodoroOpen ? expandedTop : `7%`;
        pomodoroContainer.style.left = '50%'; // Centered horizontally
        pomodoroContainer.style.right = 'auto'; // Disable 'right' CSS from original file
        pomodoroContainer.style.transform = 'translateX(-50%)'; // Always centered
        
        // Apply Size and Shape (UPDATED TO REMOVE CIRCLE)
        pomodoroContainer.style.width = isPomodoroOpen ? expandedWidth : collapsedWidth;
        pomodoroContainer.style.height = isPomodoroOpen ? expandedHeight : collapsedHeight; 
        pomodoroContainer.style.borderRadius = isPomodoroOpen ? expandedBorderRadius : collapsedBorderRadius; 

        
        // Show/Hide content based on state
        if (isPomodoroOpen) {
            collapsedButton.style.display = 'none';
            expandedPanel.style.display = 'flex';
        } else {
            collapsedButton.style.display = 'flex';
            expandedPanel.style.display = 'none';
        }
    };
    
    const onPomodoroToggle = () => {
        isPomodoroOpen = !isPomodoroOpen;
        renderPomodoro();
        console.log(`Pomodoro ${isPomodoroOpen ? 'expanded' : 'collapsed'}.`);
    };
    
    // --- Event Listeners ---
    
    // 1. Collapse/Expand Logic (Updated to use renderPomodoro)
    collapsedButton.addEventListener('click', onPomodoroToggle);
    closeButton.addEventListener('click', onPomodoroToggle); // Uses the same toggle function

    // 2. Timer Controls
    startStopButton.addEventListener('click', toggleStartStop);
    resetButton.addEventListener('click', resetTimer);

    // Initial setup
    updateDisplay();
    // Initial render of the container state
    renderPomodoro(); 
    
    // ** CRITICAL CHANGE: Start the timer automatically on load **
    startTimer();

    // Set flag to prevent adding listeners multiple times
    window.pomodoroInitialized = true; 
};