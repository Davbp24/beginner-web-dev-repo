/************************************************************
 * INFINITE WHITEBOARD IMPLEMENTATION
 ************************************************************/

window.initBoard = function() {
    // Wrap everything in IIFE to avoid global scope pollution
    
    const DRAWING_STORAGE_KEY = 'whiteboardDrawings';

    const workspace = document.getElementById('workspace');
    const scrollContainer = document.getElementById('scrollContainer');
    const customCursor = document.getElementById('customCursor');
    const chat = document.querySelector('.fa-comment');

      if (!workspace || !scrollContainer || !customCursor) {
        console.error('Board elements not found in DOM. Cannot initialize.');
        console.log('workspace:', workspace);
        console.log('scrollContainer:', scrollContainer);
        console.log('customCursor:', customCursor);
        return;
    }

    console.log('✅ Board elements found, initializing...');
    
    


    /***********************
     * TOOLBAR ELEMENTS
     ***********************/
    const addFrameBtn = document.getElementById('addFrame');
    const addNoteBtn = document.getElementById('addNote');
    const penToolBtn = document.getElementById('penTool');
    const eraserToolBtn = document.getElementById('eraserTool');
    const mouseToolBtn = document.getElementById('mouseTool');
    const penPopup = document.getElementById('penPopup');
    const eraserPopup = document.getElementById('eraserPopup');
    const penColorsContainer = document.getElementById('penColors');
    const penSizesContainer = document.getElementById('penSizes');
    const eraserSizesContainer = document.getElementById('eraserSizes');
    const customColorInput = document.getElementById('customColor');
    const customColorPreview = document.getElementById('customColorPreview');

    /***********************
     * STATE VARIABLES
     ***********************/
    let frames = []; // Array of top-level frame objects
    let notes = []; // This will contain the note elements
    let activeTool = 'mouse';
    let penColor = '#1a1a1a';
    let penSize = 2;
    let eraserSize = 15;
    let isMovingElement = false; // Flag to disable drawing while dragging/moving
    let openPopup = null;
    let drawingsData = {}; // Stores all canvas drawings as base64 strings

    // --- Toolbar Setup (Colors & Sizes) ---
    const presetColors = ['#1a1a1a', '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffb703', '#fb8500', '#8338ec', '#3a86ff', '#06d6a0'];
    presetColors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'w-6 h-6 flex-shrink-0 rounded-full border-2 cursor-pointer';
        div.style.backgroundColor = color;
        div.onclick = () => { penColor = color; customColorPreview.style.backgroundColor = color; };
        penColorsContainer.appendChild(div);
    });
    customColorPreview.style.backgroundColor = penColor;
    customColorInput.addEventListener('change', e => {
        penColor = e.target.value;
        customColorPreview.style.backgroundColor = penColor;
    });

    [2, 5, 10, 20].forEach(size => {
        const dot = document.createElement('div');
        dot.className = 'rounded-full flex-shrink-0 bg-gray-500 hover:scale-110 hover:bg-gray-700 transition cursor-pointer';
        dot.style.width = `${size / 2 + 4}px`;
        dot.style.height = `${size / 2 + 4}px`;
        dot.onclick = () => penSize = size;
        penSizesContainer.appendChild(dot);
    });

    [10, 20, 30].forEach(size => {
        const dot = document.createElement('div');
        dot.className = 'bg-gray-500 rounded-full cursor-pointer hover:scale-110 hover:bg-gray-700 transition';
        dot.style.width = `${size / 5 + 4}px`;
        dot.style.height = `${size / 5 + 4}px`;
        dot.onclick = () => eraserSize = size;
        eraserSizesContainer.appendChild(dot);
    });

    // --- Toolbar Logic ---
    function closePopups() {
        penPopup.classList.add('hidden');
        eraserPopup.classList.add('hidden');
        openPopup = null;
    }

     function togglePopup(name) {
        // Close all popups first
        closePopups();

        // If clicking the same tool again → deactivate
        if (openPopup === name || activeTool === name) {
            activeTool = 'mouse';
            return;
        }

        // Otherwise, open the corresponding popup
        if (name === 'pen') {
            penPopup.classList.remove('hidden');
            activeTool = 'pen';
            openPopup = 'pen';
        } 
        else if (name === 'eraser') {
            eraserPopup.classList.remove('hidden');
            activeTool = 'eraser';
            openPopup = 'eraser';
        }
    }

    penToolBtn.onclick = () => togglePopup('pen');
    eraserToolBtn.onclick = () => togglePopup('eraser');
    mouseToolBtn.onclick = () => {
        activeTool = 'mouse';
        closePopups();
    };
    addFrameBtn.onclick = () => addFrame();
    // The addNoteBtn will now look for a selected board to add the note, 
    // or add to the workspace if none is selected.
    addNoteBtn.onclick = () => {
        const selectedBoard = document.querySelector('.canvas-frame.ring-blue-500');
        addStickyNote(selectedBoard || workspace);
    };

    /***********************
     * DRAWING & STORAGE
     ***********************/

    function saveDrawingToLocalStorage(id, canvas) {
        drawingsData[id] = {
            data: canvas.toDataURL(),
            originalWidth: canvas.width,
            originalHeight: canvas.height
        };
        localStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(drawingsData));
    }

    function loadDrawingFromLocalStorage(id, canvas, ctx) {
        if (drawingsData[id]) {
            const data = drawingsData[id];
            const img = new Image();
            img.onload = () => {
                const currentWidth = canvas.width;
                const currentHeight = canvas.height;
                
                // Temporarily set canvas to original size for drawImage
                canvas.width = data.originalWidth;
                canvas.height = data.originalHeight;
                ctx.drawImage(img, 0, 0);

                // Restore to current size (important for drawing continuity)
                canvas.width = currentWidth;
                canvas.height = currentHeight;
            };
            img.src = data.data;
        }
    }

    /*******************************************************
     * STICKY NESTING LOGIC - FIND & RE-PARENT ON DRAG END
     *******************************************************/
    function reparentNote(noteElement) {
        const rect = noteElement.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;

        // Default parent is the main workspace
        let newParent = workspace; 

        // Find potential new parent (any board/frame)
        // Iterate backwards to prioritize nesting in front-most elements
        const topLevelFrames = frames.map(f => f.element);
        for (let i = topLevelFrames.length - 1; i >= 0; i--) {
            const frame = topLevelFrames[i];
            
            // Skip if the note is already a child of this frame
            if (frame === noteElement.parentElement) continue;
            
            const frameRect = frame.getBoundingClientRect();

            // Check if the center of the note is inside the potential parent frame
            if (
                elementCenterX > frameRect.left &&
                elementCenterX < frameRect.right &&
                elementCenterY > frameRect.top &&
                elementCenterY < frameRect.bottom
            ) {
                newParent = frame;
                break;
            }
        }

        const oldParent = noteElement.parentElement;

        // Only perform reparenting if the parent has actually changed
        if (newParent !== oldParent) {
            // Get the position of the element relative to the viewport
            const elementXViewport = rect.left;
            const elementYViewport = rect.top;

            // Get the position of the new parent relative to the viewport
            const newParentRect = newParent.getBoundingClientRect();

            // Calculate the element's new position relative to the new parent's top-left
            const newX = elementXViewport - newParentRect.left;
            const newY = elementYViewport - newParentRect.top;

            // 1. Re-append the element to the new parent
            newParent.appendChild(noteElement);

            // 2. Update its position using absolute coordinates relative to the new parent
            noteElement.style.left = `${newX}px`;
            noteElement.style.top = `${newY}px`;
            
        } else {
            // If parent is the same, just apply the transform changes as final absolute positioning
            const dx = parseFloat(noteElement.getAttribute('data-x')) || 0;
            const dy = parseFloat(noteElement.getAttribute('data-y')) || 0;
            const finalX = parseFloat(noteElement.style.left) + dx;
            const finalY = parseFloat(noteElement.style.top) + dy;

            noteElement.style.left = `${finalX}px`;
            noteElement.style.top = `${finalY}px`;
        }

        // 3. Clean up the drag-related attributes/styles
        noteElement.style.transform = ''; 
        noteElement.removeAttribute('data-x');
        noteElement.removeAttribute('data-y');
        
        // Re-initialize interact drag with the correct restriction (new parent)
        interact(noteElement).draggable({
            modifiers: [interact.modifiers.restrictRect({ restriction: noteElement.parentElement })],
        });
    }

    /***********************
     * FRAME CREATION
     ***********************/
    function createFrame(x, y, width, height, title) {
        const frameId = Date.now();
        const frame = document.createElement('div');
        frame.className = 'canvas-frame';
        frame.style.left = `${x}px`;
        frame.style.top = `${y}px`;
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
        frame.dataset.id = frameId;

        // 1. Frame Header and Title
        const header = document.createElement('div');
        header.className = 'frame-header';

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = title;
        titleInput.className = 'frame-title-input';
        titleInput.placeholder = 'Board Title';
        header.appendChild(titleInput);

        // 2. Add Board/Frame Plus Icon (Adds a new top-level frame)
        const plus = document.createElement('i');
        plus.className = 'relative fas fa-plus -z-10 text-gray-400 hover:text-blue-500 cursor-pointer';
        plus.title = 'Add New Board';
        plus.onclick = (e) => {
            e.stopPropagation(); 
            addFrame();
        };
        header.appendChild(plus);
        frame.appendChild(header);

        // 3. Canvas for drawing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.className = 'absolute inset-0 w-full h-full';
        frame.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        let drawing = false;

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        // Drawing event listeners
        canvas.addEventListener('mousedown', e => {
            if (!['pen', 'eraser'].includes(activeTool) || isMovingElement) return;
            const { x, y } = getMousePos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            drawing = true;
        });

        canvas.addEventListener('mousemove', e => {
            if (!drawing || isMovingElement) return;
            const { x, y } = getMousePos(e);
            if (activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = eraserSize;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = penColor;
                ctx.lineWidth = penSize;
            }
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        canvas.addEventListener('mouseup', () => {
            if (drawing) {
                drawing = false;
                ctx.closePath();
                saveDrawingToLocalStorage(frameId, canvas); 
            }
        });
        canvas.addEventListener('mouseleave', () => { drawing = false; ctx.closePath(); });
        
        // Selection/Deselection
        frame.addEventListener('click', (e) => {
            if (activeTool === 'mouse') {
                document.querySelectorAll('.canvas-frame').forEach(f => f.classList.remove('ring-blue-500'));
                frame.classList.add('ring-blue-500');
                e.stopPropagation();
            }
        });

        // 4. Interact.js Dragging/Resizing
        const interactable = interact(frame).draggable({
            enabled: false, // Default: Frames should only move when double-clicked
            // Frames should only be restricted by the main workspace (always top-level now)
            modifiers: [interact.modifiers.restrictRect({ restriction: workspace })], 
            listeners: {
                start() {
                    isMovingElement = true;
                    frame.style.zIndex = 100; // Bring to front while dragging
                    frame.classList.add('ring-1', 'ring-blue-500', 'ring-offset-2');
                },
                move(event) {
                    const x = (parseFloat(frame.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(frame.getAttribute('data-y')) || 0) + event.dy;
                    frame.style.transform = `translate(${x}px, ${y}px)`;
                    frame.setAttribute('data-x', x);
                    frame.setAttribute('data-y', y);
                },
                end() {
                    frame.style.zIndex = ''; // Reset z-index
                    frame.classList.remove('ring-1', 'ring-blue-500', 'ring-offset-2');
                    interactable.draggable({ enabled: false }); // Disable drag
                    frame.classList.remove('interact-draggable-enabled');

                    // Finalize position using absolute coordinates (Crucial for nesting to work)
                    const dx = parseFloat(frame.getAttribute('data-x')) || 0;
                    const dy = parseFloat(frame.getAttribute('data-y')) || 0;
                    frame.style.left = `${parseFloat(frame.style.left) + dx}px`;
                    frame.style.top = `${parseFloat(frame.style.top) + dy}px`;
                    frame.style.transform = ''; 
                    frame.removeAttribute('data-x');
                    frame.removeAttribute('data-y');

                    isMovingElement = false;
                }
            }
        }).resizable({
            edges: { left: true, right: true, bottom: true, top: true },
        }).on('resizemove', event => {
            const { width, height } = event.rect;
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = oldWidth;
            tempCanvas.height = oldHeight;
            tempCtx.drawImage(canvas, 0, 0);

            frame.style.width = `${width}px`;
            frame.style.height = `${height}px`;
            canvas.width = width;
            canvas.height = height;

            // Re-draw the original drawing without scaling/morphing
            ctx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight);

            saveDrawingToLocalStorage(frameId, canvas);
        });

        // Double-click to enable drag
        frame.addEventListener('dblclick', (e) => {
            // Only enable drag if the mouse tool is selected
            if (activeTool !== 'mouse') return;
            // Ensure double-click is on the board itself (canvas, or frame background)
            if (e.target !== frame && e.target !== canvas) return;
            interactable.draggable({ enabled: true });
            frame.classList.add('interact-draggable-enabled');
            e.stopPropagation(); // Prevent propagation to workspace
        });

        const frameData = { id: frameId, x, y, width, height, title, element: frame };
        
        // Add initial frame to the workspace
        workspace.appendChild(frame);
        loadDrawingFromLocalStorage(frameId, canvas, ctx);
        
        return frameData;
    }

    function addFrame() {
        const width = 600, height = 400;
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;

        // Position near the center of the visible area
        const x = scrollLeft + containerWidth / 2 - width / 2 + (Math.random() * 100 - 50);
        const y = scrollTop + containerHeight / 2 - height / 2 + (Math.random() * 100 - 50);
        
        const newFrame = createFrame(x, y, width, height, `Board ${frames.length + 1}`);
        // Frames are always top-level in this simplified approach
        frames.push(newFrame);
    }

    /***********************
     * STICKY NOTES
     ***********************/
    function addStickyNote(parent = workspace) {
        const isNested = parent !== workspace;
        const width = 150, height = 120;
        let x, y;

        if (isNested) {
            // Position relative to the board's top-left corner
            x = 10 + (Math.random() * 50);
            y = 10 + (Math.random() * 50);
        } else {
            // Position relative to the visible area of the workspace
            const scrollLeft = scrollContainer.scrollLeft;
            const scrollTop = scrollContainer.scrollTop;
            const containerWidth = scrollContainer.clientWidth;
            const containerHeight = scrollContainer.clientHeight;
            x = scrollLeft + containerWidth / 2 - width / 2 + (Math.random() * 100 - 50);
            y = scrollTop + containerHeight / 2 - height / 2 + (Math.random() * 100 - 50);
        }

        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.style.left = `${x}px`;
        note.style.top = `${y}px`;
        note.style.width = `${width}px`;
        note.style.height = `${height}px`;
        note.dataset.id = Date.now(); // Add ID for identification

        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-full note-textarea text-gray-800 font-medium text-sm';
        textarea.value = 'New Note';
        note.appendChild(textarea);

        parent.appendChild(note);
        notes.push(note);

        // Set up drag on the note with restriction to its current parent
        interact(note).draggable({
            // Restriction is set to the note's immediate parent element (workspace or canvas-frame)
            modifiers: [interact.modifiers.restrictRect({ restriction: note.parentElement })],
            listeners: {
                start() { 
                    isMovingElement = true;
                    note.style.zIndex = 100;
                },
                move(event) {
                    const x = (parseFloat(note.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(note.getAttribute('data-y')) || 0) + event.dy;
                    note.style.transform = `translate(${x}px, ${y}px)`;
                    note.setAttribute('data-x', x);
                    note.setAttribute('data-y', y);
                },
                end() {
                    note.style.zIndex = '';
                    isMovingElement = false;
                    
                    // Sticky notes use reparenting logic to jump boards
                    reparentNote(note);
                }
            }
        }).resizable({
            edges: { left: true, right: true, bottom: true, top: true },
        }).on('resizemove', event => {
            const { width, height } = event.rect;
            note.style.width = `${width}px`;
            note.style.height = `${height}px`;
        });
    }

    /***********************
     * INITIALIZATION
     ***********************/
    function centerDefaultFrame() {
        const width = 800;
        const height = 500;
        const centerX = (14000 - width) / 2;
        const centerY = (14000 - height) / 2;

        const newFrame = createFrame(centerX, centerY, width, height, 'Board 1');
        frames.push(newFrame);

        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        scrollContainer.scrollLeft = centerX - containerWidth / 2 + width / 2;
        scrollContainer.scrollTop = centerY - containerHeight / 2 + height / 2;
    }

    // Handle clicks outside of elements to deselect board
    document.addEventListener('click', (e) => {
        if (e.target === workspace || e.target === scrollContainer) {
             document.querySelectorAll('.canvas-frame').forEach(f => f.classList.remove('ring-blue-500'));
        }
    });

    function init() {
        // Load existing drawings data
        const savedDrawings = localStorage.getItem(DRAWING_STORAGE_KEY);
        if (savedDrawings) {
            drawingsData = JSON.parse(savedDrawings);
            // Note: Full reconstruction of saved boards/notes requires a robust data model
            // and a separate save/load function for element metadata (position, size, nesting).
        }

        centerDefaultFrame();
        customCursor.style.display = 'block';
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.classList.add('no-cursor');
        }
    }

    /***********************
     * CUSTOM CURSOR
     ***********************/
    let cursorPos = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
        cursorPos = { x: e.clientX, y: e.clientY };
        customCursor.style.left = `${cursorPos.x}px`;
        customCursor.style.top = `${cursorPos.y}px`;

        if (activeTool === 'mouse') {
           customCursor.className = 'fas fa-location-arrow custom-cursor text-[#1a1a1a] opacity-100';
            customCursor.style.transform = 'rotate(-90deg)';
        } else if (activeTool === 'eraser') {
            customCursor.className = 'fas fa-location-arrow custom-cursor text-[#1a1a1a] opacity-100';
            customCursor.style.transform = 'rotate(-90deg)';
        } else {
            customCursor.className = 'fas fa-location-arrow custom-cursor text-[#1a1a1a] opacity-100';
            customCursor.style.transform = 'rotate(-90deg)';
        }

        if (isMovingElement) {
            customCursor.className = 'fas fa-arrows-alt custom-cursor text-blue-500 opacity-100';
            customCursor.style.transform = '';
        }
    });

    document.addEventListener('mousedown', () => { 
        customCursor.style.transform += ' scale(0.9)'; 
    });
    
    document.addEventListener('mouseup', () => { 
        customCursor.style.transform = customCursor.style.transform.replace(' scale(0.9)', ''); 
    });


    

    // Initialize when script loads
    init();

} 