// Configuration
const REPO_OWNER = 'Runarok';
const REPO_NAME = 'cozywalls';
const FOLDER_PATH = 'Cozywalls';
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/${FOLDER_PATH}/`;

let wallpapers = [];
let currentIndex = 0;

// Elements
const grid = document.getElementById('grid');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const tutorial = document.getElementById('tutorial');
const closeTutorial = document.getElementById('close-tutorial');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const countTotal = document.getElementById('count-total');
const modalInfo = document.getElementById('modal-info');

function checkTutorial() {
    const hasSeenTutorial = localStorage.getItem('cozywalls_onboarded');
    if (!hasSeenTutorial) {
        tutorial.classList.add('active');
    }
}

closeTutorial.onclick = () => {
    tutorial.classList.remove('active');
    localStorage.setItem('cozywalls_onboarded', 'true');
    // Small delay to remove from DOM display
    setTimeout(() => tutorial.style.display = 'none', 500);
};

sidebar.onmouseenter = () => {
    overlay.classList.add('opacity-100', 'pointer-events-auto');
};

sidebar.onmouseleave = () => {
    overlay.classList.remove('opacity-100', 'pointer-events-auto');
};

// Initial Fetch
async function fetchWallpapers() {
    try {
        // Fetching from GitHub API to list folder contents
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FOLDER_PATH}`);
        const data = await response.json();
        
        wallpapers = data
            .filter(file => file.type === 'file' && (file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.webp') || file.name.endsWith('.jpeg')))
            .map(file => ({
                name: file.name,
                url: file.download_url
            }));

        countTotal.innerText = wallpapers.length;
        renderGrid();
    } catch (error) {
        console.error('Error fetching wallpapers:', error);
        // Fallback to placeholder if API fails
        wallpapers = Array.from({length: 12}).map((_, i) => ({
            name: `Sample Wallpaper ${i+1}.jpg`,
            url: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=1920&q=80`
        }));
        renderGrid();
    }
}

function renderGrid() {
    grid.innerHTML = '';
    wallpapers.forEach((wp, index) => {
        const item = document.createElement('div');
        item.className = 'wp-item group relative aspect-video glass overflow-hidden rounded-xl';
        item.innerHTML = `
            <img src="${wp.url}" alt="${wp.name}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                <span class="text-[10px] uppercase tracking-widest text-white/70 font-light">${wp.name}</span>
            </div>
        `;
        item.onclick = () => openModal(index);
        grid.appendChild(item);
    });
}

function openModal(index) {
    currentIndex = index;
    modalImg.src = wallpapers[currentIndex].url;
    modalInfo.innerText = `${currentIndex + 1} / ${wallpapers.length} — ${wallpapers[currentIndex].name}`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function navigate(dir) {
    if (dir === 'next') currentIndex = (currentIndex + 1) % wallpapers.length;
    else currentIndex = (currentIndex - 1 + wallpapers.length) % wallpapers.length;
    openModal(currentIndex);
}

function shuffle() {
    let next;
    do { next = Math.floor(Math.random() * wallpapers.length); } while (next === currentIndex);
    openModal(next);
}

// Download All Functionality
async function downloadAll() {
    const btn = document.getElementById('download-all-btn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-blue-500 w-5"></i><span class="nav-label text-sm font-light">Zipping...</span>';
    btn.disabled = true;

    try {
        const zip = new JSZip();
        const folder = zip.folder("cozywalls");

        const promises = wallpapers.map(async (wp) => {
            const response = await fetch(wp.url);
            const blob = await response.blob();
            folder.file(wp.name, blob);
        });

        await Promise.all(promises);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "cozywalls-collection.zip");
    } catch (error) {
        console.error("[v0] Download all failed:", error);
        alert("Failed to download collection. Check console for details.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// Event Listeners
document.getElementById('close-modal').onclick = closeModal;
document.getElementById('next-btn').onclick = () => navigate('next');
document.getElementById('prev-btn').onclick = () => navigate('prev');
document.getElementById('modal-next').onclick = () => navigate('next');
document.getElementById('modal-prev').onclick = () => navigate('prev');
document.getElementById('shuffle-btn').onclick = shuffle;
document.getElementById('refresh-btn').onclick = fetchWallpapers;
document.getElementById('download-btn').onclick = () => {
    const link = document.createElement('a');
    link.href = wallpapers[currentIndex].url;
    link.download = wallpapers[currentIndex].name;
    link.click();
};
document.getElementById('download-all-btn').onclick = downloadAll;

window.onclick = (e) => { if (e.target === modal) closeModal(); };

window.onkeydown = (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'ArrowRight') navigate('next');
    if (e.key === 'ArrowLeft') navigate('prev');
    if (e.key === 'Escape') closeModal();
};

// Init
checkTutorial();
fetchWallpapers();