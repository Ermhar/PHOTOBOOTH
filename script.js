document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const collageCanvas = document.getElementById('collage-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const resetBtn = document.getElementById('reset-btn');
    const createCollageBtn = document.getElementById('create-collage-btn');
    const downloadCollageBtn = document.getElementById('download-collage-btn');
    const layoutSelect = document.getElementById('layout-select');
    const gallery = document.getElementById('gallery');
    const collageContainer = document.getElementById('collage-container');
    const collageResult = document.getElementById('collage-result');
    const collageOptions = document.getElementById('collage-options');
    const photoCounter = document.getElementById('photo-counter');
    const collageLayoutInfo = document.getElementById('collage-layout-info');
    
    let stream = null;
    let photosTaken = 0;
    const maxPhotos = 4;
    let capturedPhotos = [];
    let collageDataUrl = '';
    // Add this with your other variable declarations at the top
let filterActive = false;
const filterToggle = document.getElementById('filter-toggle');

    // Start camera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' 
                }, 
                audio: false 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please ensure you've granted camera permissions.");
        }
    }
    
    // Update photo counter
    function updatePhotoCounter() {
        photoCounter.textContent = `${photosTaken}/${maxPhotos}`;
    }
    
    // Capture photo
    function capturePhoto() {
    if (photosTaken >= maxPhotos) {
        alert(`You've already taken the maximum of ${maxPhotos} photos. Delete some to take more.`);
        return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply filter if active - THIS IS THE NEW LINE TO ADD
    if (filterActive) {
        applyFilterToCanvas();
    }
    
    // Rest of your existing capture code below...
    const imageData = canvas.toDataURL('image/png');
    capturedPhotos.push(imageData);
        
        // Find next empty slot
        const emptySlot = document.querySelector(`.photo-slot.empty`);
        if (emptySlot) {
            // Fill the slot with the captured image
            emptySlot.classList.remove('empty');
            emptySlot.innerHTML = `
                <img src="${imageData}" alt="Captured photo">
                <div class="photo-actions">
                    <button class="action-btn download-btn" data-img="${imageData}" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="slot-number">${emptySlot.dataset.slot}</div>
            `;
            
            photosTaken++;
            updatePhotoCounter();
            
            // Add download functionality
            emptySlot.querySelector('.download-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                downloadImage(this.getAttribute('data-img'), `photo-${emptySlot.dataset.slot}.png`);
            });
            
            // Add delete functionality
            emptySlot.querySelector('.delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                deletePhoto(emptySlot.dataset.slot - 1);
            });
            
            // Update UI based on photos taken
            updateUI();
        }
    }
    // Add these new functions with your other utility functions
function toggleFilter() {
    filterActive = !filterActive;
    filterToggle.classList.toggle('filter-active');
    
    if (filterActive) {
        filterToggle.innerHTML = '<i class="fas fa-magic"></i> Color';
        video.style.filter = 'grayscale(100%)';
    } else {
        filterToggle.innerHTML = '<i class="fas fa-magic"></i> Grey Filter';
        video.style.filter = 'none';
    }
}

function applyFilterToCanvas() {
    const ctx = canvas.getContext('2d');
    if (filterActive) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // red
            data[i + 1] = avg; // green
            data[i + 2] = avg; // blue
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
}
    // Delete individual photo
    function deletePhoto(index) {
        if (index >= 0 && index < capturedPhotos.length) {
            // Remove photo from array
            capturedPhotos.splice(index, 1);
            photosTaken--;
            updatePhotoCounter();
            
            // Reset collage if one exists
            if (collageDataUrl) {
                collageDataUrl = '';
                collageContainer.style.display = 'none';
                downloadCollageBtn.disabled = true;
            }
            
            // Rebuild gallery
            rebuildGallery();
            updateUI();
        }
    }
    
    // Rebuild gallery after deletion
    function rebuildGallery() {
        // Clear all slots
        const photoSlots = document.querySelectorAll('.photo-slot');
        photoSlots.forEach(slot => {
            slot.classList.add('empty');
            slot.innerHTML = `<div class="slot-number">${slot.dataset.slot}</div>`;
        });
        
        // Fill slots with remaining photos
        capturedPhotos.forEach((photo, index) => {
            const slot = document.querySelector(`.photo-slot[data-slot="${index + 1}"]`);
            if (slot) {
                slot.classList.remove('empty');
                slot.innerHTML = `
                    <img src="${photo}" alt="Captured photo">
                    <div class="photo-actions">
                        <button class="action-btn download-btn" data-img="${photo}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="slot-number">${slot.dataset.slot}</div>
                `;
                
                // Reattach event listeners
                slot.querySelector('.download-btn').addEventListener('click', function(e) {
                    e.stopPropagation();
                    downloadImage(this.getAttribute('data-img'), `photo-${slot.dataset.slot}.png`);
                });
                
                slot.querySelector('.delete-btn').addEventListener('click', function(e) {
                    e.stopPropagation();
                    deletePhoto(index);
                });
            }
        });
    }
    
    // Update UI elements based on current state
    function updateUI() {
        if (photosTaken >= maxPhotos) {
            captureBtn.disabled = true;
            collageOptions.style.display = 'flex';
        } else {
            captureBtn.disabled = false;
            
            if (photosTaken > 0) {
                collageOptions.style.display = 'flex';
            } else {
                collageOptions.style.display = 'none';
            }
        }
    }
    
function createCollage() {
    if (capturedPhotos.length !== 4) {
        alert('You need exactly 4 photos to create a collage!');
        return;
    }
    
    const layout = layoutSelect.value;
    const collageWidth = 800;
    const collageHeight = 800;
    collageCanvas.width = collageWidth;
    collageCanvas.height = collageHeight;
    
    const ctx = collageCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Clear previous layout classes
    collageResult.className = 'collage-result';
    
    // Set layout info text
    let layoutName = '';
    
    // Load all images and draw them according to layout
    const promises = capturedPhotos.map((photoData, index) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                switch(layout) {
                    case '2x2':
                        // Classic 2x2 grid
                        const gridSize = collageWidth / 2;
                        const x = (index % 2) * gridSize;
                        const y = Math.floor(index / 2) * gridSize;
                        ctx.drawImage(img, x + 5, y + 5, gridSize - 10, gridSize - 10);
                        layoutName = '2×2 Grid Layout';
                        break;
                        
                    case '3+1':
                        // 3 small on top, 1 big on bottom
                        if (index < 3) {
                            const smallWidth = collageWidth / 3;
                            ctx.drawImage(img, index * smallWidth + 5, 5, smallWidth - 10, collageHeight/2 - 10);
                        } else {
                            ctx.drawImage(img, 5, collageHeight/2 + 5, collageWidth - 10, collageHeight/2 - 10);
                        }
                        layoutName = '3+1 Layout';
                        break;
                        
                    case '1+3':
                        // 1 big on top, 3 small on bottom
                        if (index === 0) {
                            ctx.drawImage(img, 5, 5, collageWidth - 10, collageHeight/2 - 10);
                        } else {
                            const smallWidth = collageWidth / 3;
                            ctx.drawImage(img, (index-1) * smallWidth + 5, collageHeight/2 + 5, smallWidth - 10, collageHeight/2 - 10);
                        }
                        layoutName = '1+3 Layout';
                        break;
                        
                    case 'center':
                        // 1 big center with 3 small around
                        if (index === 0) {
                            // Center image
                            const centerSize = collageWidth * 0.6;
                            const centerPos = (collageWidth - centerSize) / 2;
                            ctx.drawImage(img, centerPos, centerPos, centerSize, centerSize);
                        } else {
                            // Small images
                            const smallSize = collageWidth * 0.25;
                            const positions = [
                                [5, 5], // top-left
                                [collageWidth - smallSize - 5, 5], // top-right
                                [5, collageHeight - smallSize - 5] // bottom-left
                            ];
                            if (index <= 3) {
                                ctx.drawImage(img, positions[index-1][0], positions[index-1][1], smallSize, smallSize);
                            }
                        }
                        layoutName = 'Center Layout';
                        break;
                        
                    case 'vertical':
                        // Vertical stack of 4 full-width images
                        const verticalHeight = collageHeight / 4;
                        ctx.drawImage(img, 5, index * verticalHeight + 5, collageWidth - 10, verticalHeight - 10);
                        layoutName = 'Vertical Stack Layout';
                        // Add class for specific styling
                        collageResult.classList.add('layout-vertical');
                        break;
                }
                resolve();
            };
            img.src = photoData;
        });
    });
    
    Promise.all(promises).then(() => {
        // Get the collage as data URL
        collageDataUrl = collageCanvas.toDataURL('image/png');
        
        // Display the collage
        collageResult.innerHTML = `<img src="${collageDataUrl}" alt="Photo collage">`;
        collageContainer.style.display = 'block';
        collageLayoutInfo.textContent = layoutName;
        
        // Enable download button
        downloadCollageBtn.disabled = false;
        
        // Scroll to collage
        collageContainer.scrollIntoView({ behavior: 'smooth' });
    });
}
    
    // Download image
    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Reset all photos
    function resetPhotos() {
        const photoSlots = document.querySelectorAll('.photo-slot');
        photoSlots.forEach(slot => {
            slot.classList.add('empty');
            slot.innerHTML = `<div class="slot-number">${slot.dataset.slot}</div>`;
        });
        
        photosTaken = 0;
        capturedPhotos = [];
        collageDataUrl = '';
        collageContainer.style.display = 'none';
        collageResult.innerHTML = '';
        collageOptions.style.display = 'none';
        downloadCollageBtn.disabled = true;
        updatePhotoCounter();
    }
    
    // Event listeners
   
    filterToggle.addEventListener('click', toggleFilter);
    captureBtn.addEventListener('click', capturePhoto);
    resetBtn.addEventListener('click', resetPhotos);
    createCollageBtn.addEventListener('click', createCollage);
    downloadCollageBtn.addEventListener('click', () => {
        if (collageDataUrl) {
            downloadImage(collageDataUrl, 'photo-collage.png');
        }
    });
    
    // Start the camera when page loads
    startCamera();
    
    // Clean up camera when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});