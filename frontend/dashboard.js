let currentPlaylistName = '';
let recentSongsHistory = [];
let currentSongTitle = '';
let playlistMeta = {};
let pendingPlaylistCard = null;

// Check if user is logged in
async function checkLogin() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    let fullName = localStorage.getItem('fullName');

    try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`);
        if (response.ok) {
            const user = await response.json();
            fullName = user.fullName || fullName;
            localStorage.setItem('fullName', fullName);
        } else {
            console.warn('Unable to verify user profile from backend:', response.status);
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
    }

    if (!fullName) {
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userFullName').textContent = fullName;
    const welcomeSection = document.getElementById('welcomeSection');
    welcomeSection.style.display = 'block';

    setTimeout(() => {
        welcomeSection.style.display = 'none';
    }, 2000);

    loadRecentSongsHistory();
    renderRecentSongs();
}

// Check login on page load
checkLogin();

// Load recent songs from localStorage
function getRecentSongsStorageKey() {
    const userId = localStorage.getItem('userId');
    return userId ? `recentSongsHistory_${userId}` : 'recentSongsHistory';
}

function getLegacyRecentSongsStorageKey() {
    return 'recentSongsHistory';
}

function loadRecentSongsHistory() {
    const storageKey = getRecentSongsStorageKey();
    const legacyKey = getLegacyRecentSongsStorageKey();

    const savedCurrent = localStorage.getItem(storageKey);
    const savedLegacy = localStorage.getItem(legacyKey);
    let merged = [];

    function parseHistory(value) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Failed to parse recent song history:', error);
            return [];
        }
    }

    const currentHistory = savedCurrent ? parseHistory(savedCurrent) : [];
    const legacyHistory = savedLegacy ? parseHistory(savedLegacy) : [];

    if (currentHistory.length > 0 && legacyHistory.length > 0) {
        // merge legacy history behind current history, preserving uniqueness
        merged = [...currentHistory];
        legacyHistory.forEach(song => {
            if (!merged.includes(song)) {
                merged.push(song);
            }
        });
    } else if (currentHistory.length > 0) {
        merged = currentHistory;
    } else if (legacyHistory.length > 0) {
        merged = legacyHistory;
    }

    if (merged.length > 0 && storageKey !== legacyKey) {
        localStorage.setItem(storageKey, JSON.stringify(merged));
    }
    if (savedLegacy && storageKey !== legacyKey) {
        localStorage.removeItem(legacyKey);
    }

    recentSongsHistory = merged;
}

// Playlists (stored in localStorage)
let playlists = {};

// Default built-in playlists with songs
const defaultPlaylists = {
    'Telugu': [
        { song: 'Dheemtana', urls: ['music/Dheemtana.mp3'], image: '' },
        { song: 'Yaalo Yaalaa', urls: ['music/Yaalo Yaalaa.mp3'], image: '' },
        { song: 'Nuvu Simhame', urls: ['music/Nuvu Simhame.mp3'], image: '' },
        { song: 'Panchadhara Bomma', urls: ['music/Panchadhara Bomma.mp3'], image: '' },
        { song: 'Jorsey', urls: ['music/Jorsey.mp3'], image: '' },
        { song: 'Dheera Dheera Dheera', urls: ['music/Dheera Dheera Dheera.mp3'], image: '' },
        { song: 'Kumkumala', urls: ['music/Kumkumala.mp3'], image: '' },
        { song: 'Deva Deva', urls: ['music/Deva Deva.mp3'], image: '' },
        { song: 'Kanave Unnai', urls: ['music/Kanave Unnai.mp3'], image: '' },
        { song: 'Ninne Tholi Prema Lo', urls: ['music/Ninne Tholi Prema Lo.mp3'], image: '' },
        { song: 'Sooseki', urls: ['music/sooseki.mp3'], image: '' },
        { song: 'Veyira Cheyyi', urls: ['music/Veyira Cheyyi.mp3'], image: '' },
        { song: 'Ayudha Pooja', urls: ['music/Ayudha Pooja.mp3'], image: '' },
        { song: 'Sri Anjaneyam', urls: ['music/Sri Anjaneyam.mp3'], image: '' },
        { song: 'Fear', urls: ['music/Fear.mp3'], image: '' }
    ],
    'English': [
        { song: 'Night Changes', urls: ['music/Night Changes.mp3'], image: '' },
        { song: 'Faded', urls: ['music/Faded.mp3'], image: '' },
        { song: 'Cheap Thrills', urls: ['music/Cheap Thrills.mp3'], image: '' },
        { song: 'See You Again', urls: ['music/See You Again.mp3'], image: '' },
        { song: 'Infinity', urls: ['music/Infinity - Jaymes Young.mp3'], image: '' },
        { song: 'Perfect', urls: ['music/Perfect.mp3'], image: '' },
        { song: 'I Wanna Be Yours', urls: ['music/I Wanna Be Yours.mp3'], image: '' },
        { song: 'On My Way', urls: ['music/On My Way.mp3'], image: '' },
        { song: 'My Baby', urls: ['music/My Baby.mp3'], image: '' },
        { song: 'Cheri Cheri Lady', urls: ['music/Cheri Cheri Lady.mp3'], image: '' },
        { song: 'Young and Beautiful', urls: ['music/Young and Beautiful.mp3'], image: '' },
        { song: 'Moral of the Story', urls: ['music/Moral of the Story.mp3'], image: '' }
    ],
    'Hindi': [
        { song: 'Luka Chuppi', urls: ['music/Luka Chuppi.mp3'], image: '' },
        { song: 'Luk Chup Na Jao', urls: ['music/Luk Chup Na Jao.mp3'], image: '' },
        { song: 'Chaiyya Chaiyya', urls: ['music/Chaiyya Chaiyya.mp3'], image: '' },
        { song: 'Heeriye', urls: ['music/Heeriye.mp3'], image: '' },
        { song: 'Chammak Challo', urls: ['music/Chammak Challo.mp3'], image: '' },
        { song: 'Tere Vaaste', urls: ['music/Tere Vaaste.mp3'], image: '' }
    ],
    'Folk': [
        { song: 'Rambai Neemeedha Naku', urls: ['music/Rambai-Neemeedha-Naku.mp3'], image: '' },
        { song: 'Telangana Dappulu', urls: ['music/Telangana Dappulu - Telugu Dj Songs.mp3'], image: '' },
        { song: 'Peddi Reddy', urls: ['music/Peddi-Reddy-Full-Song-Bullet-Bandi-Laxman-Madeen-Sk-Naga-Durga-Leading-Boys.mp3'], image: '' },
        { song: 'Seniga Chenla Nilabadi', urls: ['music/SENIGA CHENLA NILABADI(KoshalWorld.Com).mp3'], image: '' },
        { song: 'Yerra Yerrani Rumalu Gatti', urls: ['music/Yerra Yerrani Rumalu Gatti.mp3'], image: '' },
        { song: 'Daripontothundu', urls: ['music/Daripontothundu(KoshalWorld.Com).mp3'], image: '' },
        { song: 'DEKU DEKU', urls: ['music/DEKU DEKU(KoshalWorld.Com).mp3'], image: '' },
        { song: 'Pori Rayee Jathara', urls: ['music/Pori Rayee Jathara(KoshalWorld.Com).mp3'], image: '' },
        { song: 'Nimmathota Vanamulo', urls: ['music/Nimmathota Vanamulo(KoshalWorld.Com).mp3'], image: '' },
        { song: 'Ranu Bombai Ki Ranu', urls: ['music/Ranu-Bombai-Ki-Ranu-Ramu-Rathod-NaaSongs.mp3'], image: '' }
    ]
};

function getDeletedBuiltInKey() {
    const userId = localStorage.getItem('userId');
    return userId ? `deletedBuiltIn_${userId}` : 'deletedBuiltIn';
}

function loadDeletedBuiltIn() {
    try {
        const raw = localStorage.getItem(getDeletedBuiltInKey());
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveDeletedBuiltIn(names) {
    localStorage.setItem(getDeletedBuiltInKey(), JSON.stringify(names));
}

function getPlaylistsKey() {
    const userId = localStorage.getItem('userId');
    return userId ? `playlists_${userId}` : 'playlists';
}

function getPlaylistMetaKey() {
    const userId = localStorage.getItem('userId');
    return userId ? `playlistMeta_${userId}` : 'playlistMeta';
}

const PLAYLIST_VERSION = 3;

function loadPlaylists() {
    const key = getPlaylistsKey();
    const metaKey = getPlaylistMetaKey();
    const saved = localStorage.getItem(key);
    const savedMeta = localStorage.getItem(metaKey);
    const savedVersion = localStorage.getItem(key + '_version');

    if (saved && savedMeta && savedVersion == PLAYLIST_VERSION) {
        try {
            playlists = JSON.parse(saved);
            playlistMeta = JSON.parse(savedMeta);
            // Remove any built-in playlists the admin deleted
            const deleted = loadDeletedBuiltIn();
            deleted.forEach(name => {
                if (playlistMeta[name]?.isBuiltIn) {
                    delete playlists[name];
                    delete playlistMeta[name];
                }
            });
            return;
        } catch (e) {
            console.warn('Failed to parse saved playlists:', e);
        }
    }

    localStorage.removeItem(key);
    localStorage.removeItem(metaKey);

    // First time or version update — seed default playlists
    playlists = {};
    playlistMeta = {};
    const deleted = loadDeletedBuiltIn();
    const coverMap = {
        'Telugu': 'images/telugu.svg',
        'English': 'images/english.svg',
        'Hindi': 'images/hindi.svg',
        'Folk': 'images/folk.svg'
    };
    Object.keys(defaultPlaylists).forEach(name => {
        if (deleted.includes(name)) return;
        playlists[name] = defaultPlaylists[name].map(s => ({ ...s }));
        playlistMeta[name] = {
            coverImage: coverMap[name] || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isBuiltIn: true
        };
    });
    savePlaylists();
}

function savePlaylists() {
    localStorage.setItem(getPlaylistsKey(), JSON.stringify(playlists));
    localStorage.setItem(getPlaylistMetaKey(), JSON.stringify(playlistMeta));
    localStorage.setItem(getPlaylistsKey() + '_version', PLAYLIST_VERSION);
}

function createNewPlaylist() {
    const modal = document.getElementById('playlistActionModal');
    document.getElementById('playlistActionTitle').textContent = 'Create Playlist';
    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');
    document.getElementById('playlistActionBody').innerHTML = `
        <div style="padding:4px 0;">
            <div class="form-group" style="text-align:left;margin-bottom:12px;">
                <label style="color:#fff;display:block;margin-bottom:4px;font-size:0.85em;">Playlist Name</label>
                <input type="text" id="newPlaylistNameInput" placeholder="Enter playlist name" style="padding:10px;border-radius:6px;border:1px solid #404040;background:#333;color:#fff;box-sizing:border-box;width:100%;font-size:1em;">
            </div>
            ${isAdmin ? `
            <div class="form-group" style="text-align:left;margin-bottom:12px;">
                <label style="color:#fff;display:block;margin-bottom:4px;font-size:0.85em;">Cover Image (optional)</label>
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <button onclick="setNewCoverSource('url')" id="newCoverSrcUrlBtn" style="flex:1;padding:6px;border-radius:6px;border:1px solid #404040;background:var(--accent-color);color:#000;cursor:pointer;font-weight:600;">URL</button>
                    <button onclick="setNewCoverSource('file')" id="newCoverSrcFileBtn" style="flex:1;padding:6px;border-radius:6px;border:1px solid #404040;background:#333;color:#fff;cursor:pointer;">Upload</button>
                    <button onclick="setNewCoverSource('path')" id="newCoverSrcPathBtn" style="flex:1;padding:6px;border-radius:6px;border:1px solid #404040;background:#333;color:#fff;cursor:pointer;">File Path</button>
                </div>
                <div id="newCoverUrlGroup">
                    <input type="text" id="newCoverImageUrl" placeholder="Paste image URL (e.g. https://example.com/image.jpg)" style="padding:10px;border-radius:6px;border:1px solid #404040;background:#333;color:#fff;box-sizing:border-box;width:100%;">
                </div>
                <div id="newCoverFileGroup" style="display:none;">
                    <input type="file" id="newCoverImageFile" accept=".jpg,.jpeg,.png,.gif,.svg,.webp" style="color:#fff;width:100%;">
                </div>
                <div id="newCoverPathGroup" style="display:none;">
                    <input type="text" id="newCoverImagePath" placeholder="Local file path (e.g. C:\\images\\cover.jpg)" style="padding:10px;border-radius:6px;border:1px solid #404040;background:#333;color:#fff;box-sizing:border-box;width:100%;">
                </div>
            </div>
            ` : ''}
            <div style="display:flex;gap:10px;margin-top:16px;">
                <button class="timer-btn" onclick="closePlaylistActionModal()" style="flex:1;padding:10px;">Cancel</button>
                <button class="timer-btn timer-custom-go" onclick="submitCreatePlaylist()" style="flex:1;padding:10px;">Create</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('newPlaylistNameInput').focus(), 100);
}

function setNewCoverSource(type) {
    document.getElementById('newCoverUrlGroup').style.display = type === 'url' ? '' : 'none';
    document.getElementById('newCoverFileGroup').style.display = type === 'file' ? '' : 'none';
    document.getElementById('newCoverPathGroup').style.display = type === 'path' ? '' : 'none';
    document.getElementById('newCoverSrcUrlBtn').style.background = type === 'url' ? 'var(--accent-color)' : '#333';
    document.getElementById('newCoverSrcUrlBtn').style.color = type === 'url' ? '#000' : '#fff';
    document.getElementById('newCoverSrcFileBtn').style.background = type === 'file' ? 'var(--accent-color)' : '#333';
    document.getElementById('newCoverSrcFileBtn').style.color = type === 'file' ? '#000' : '#fff';
    document.getElementById('newCoverSrcPathBtn').style.background = type === 'path' ? 'var(--accent-color)' : '#333';
    document.getElementById('newCoverSrcPathBtn').style.color = type === 'path' ? '#000' : '#fff';
}

async function submitCreatePlaylist() {
    const nameInput = document.getElementById('newPlaylistNameInput');
    const name = nameInput.value.trim();
    if (!name) { showToast('Please enter a playlist name.'); return; }
    if (playlists[name]) {
        showToast('A playlist with that name already exists.');
        return;
    }

    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');

    let coverImage = '';
    if (isAdmin) {
        const urlVisible = document.getElementById('newCoverUrlGroup') ? document.getElementById('newCoverUrlGroup').style.display !== 'none' : false;
        const fileVisible = document.getElementById('newCoverFileGroup') ? document.getElementById('newCoverFileGroup').style.display !== 'none' : false;
        const pathVisible = document.getElementById('newCoverPathGroup') ? document.getElementById('newCoverPathGroup').style.display !== 'none' : false;

        if (urlVisible) {
            coverImage = document.getElementById('newCoverImageUrl').value.trim();
        } else if (fileVisible) {
            const fileInput = document.getElementById('newCoverImageFile');
            if (fileInput && fileInput.files.length) {
                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('adminEmail', adminEmail);
                formData.append('file', file);
                try {
                    const resp = await fetch(`${API_ROOT}/api/playlist/upload-cover`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await resp.json();
                    if (resp.ok) {
                        coverImage = data.imageUrl;
                    } else {
                        showToast('Failed to upload image: ' + (data.message || 'Upload failed'));
                        return;
                    }
                } catch (e) {
                    showToast('Server unreachable. Failed to upload image.');
                    return;
                }
            }
        } else if (pathVisible) {
            coverImage = document.getElementById('newCoverImagePath').value.trim();
        }
    }

    if (isAdmin) {
        try {
            const resp = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail, playlistName: name, coverImage })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast('Failed to create shared playlist: ' + (data.message || 'Server error'));
                return;
            }
            playlists[name] = [];
            playlistMeta[name] = {
                coverImage: coverImage,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isBuiltIn: false,
                isGlobal: true,
                globalId: data.playlist._id
            };
            savePlaylists();
            renderPlaylists();
            loadGlobalPlaylists();
            closePlaylistActionModal();
            showToast('Playlist "' + name + '" created and shared with all users!');
            return;
        } catch (e) {
            showToast('Server unreachable. Please try again.');
            return;
        }
    }

    const userId = localStorage.getItem('userId');
    try {
        const resp = await fetch(`${API_ROOT}/api/playlist/user-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, playlistName: name, coverImage })
        });
        const data = await resp.json();
        if (!resp.ok) {
            showToast('Failed to save playlist: ' + (data.message || 'Server error'));
            return;
        }
        playlists[name] = [];
        playlistMeta[name] = {
            coverImage: coverImage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isBuiltIn: false,
            isGlobal: false,
            globalId: data.playlist._id
        };
        savePlaylists();
        renderPlaylists();
        closePlaylistActionModal();
        showToast('Playlist "' + name + '" created!');
    } catch (e) {
        showToast('Could not save playlist. Make sure the server is running.');
    }
}

// ==================== GLOBAL PLAYLISTS (Admin) ====================

let globalPlaylistsData = [];

async function loadGlobalPlaylists() {
    try {
        const response = await fetch(`${API_ROOT}/api/playlist/global`);
        if (!response.ok) return;
        const data = await response.json();
        globalPlaylistsData = data;
        // Remove local entries that were previously synced as global
        Object.keys(playlistMeta).forEach(name => {
            if (playlistMeta[name]?.isGlobal) {
                delete playlists[name];
                delete playlistMeta[name];
            }
        });
        // Re-add from server
        data.forEach(p => {
            const name = p.playlistName;
            // Don't overwrite a local non-global, non-built-in playlist with the same name
            if (playlistMeta[name] && !playlistMeta[name].isGlobal && !playlistMeta[name].isBuiltIn) {
                return;
            }
            playlists[name] = (p.songs || []).map(s => ({ song: s.songName, urls: [s.songUrl], image: s.songImage || '' }));
            playlistMeta[name] = {
                coverImage: p.coverImage || '',
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: p.createdAt || new Date().toISOString(),
                isBuiltIn: false,
                isGlobal: true,
                globalId: p._id
            };
        });
        renderPlaylists();
    } catch (e) {
        // silently fail — server may be offline
    }
}

async function loadUserPlaylists() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const response = await fetch(`${API_ROOT}/api/playlist/user-playlists/${userId}`);
        if (!response.ok) return;
        const data = await response.json();
        // Remove local entries that were previously synced as user playlists
        Object.keys(playlistMeta).forEach(name => {
            if (playlistMeta[name]?.globalId && !playlistMeta[name]?.isGlobal && !playlistMeta[name]?.isBuiltIn) {
                delete playlists[name];
                delete playlistMeta[name];
            }
        });
        // Add from server
        data.forEach(p => {
            const name = p.playlistName;
            if (playlistMeta[name] && (playlistMeta[name].isGlobal || playlistMeta[name].isBuiltIn)) {
                return;
            }
            playlists[name] = (p.songs || []).map(s => ({ song: s.songName, urls: [s.songUrl], image: s.songImage || '' }));
            playlistMeta[name] = {
                coverImage: p.coverImage || '',
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: p.createdAt || new Date().toISOString(),
                isBuiltIn: false,
                isGlobal: false,
                globalId: p._id
            };
        });
        renderPlaylists();
    } catch (e) {
        // silently fail
    }
}

function setCoverSource(type) {
    document.getElementById('coverUrlGroup').style.display = type === 'url' ? '' : 'none';
    document.getElementById('coverFileGroup').style.display = type === 'file' ? '' : 'none';
    document.getElementById('coverPathGroup').style.display = type === 'path' ? '' : 'none';
    document.getElementById('coverSrcUrlBtn').style.background = type === 'url' ? 'var(--accent-color)' : '#333';
    document.getElementById('coverSrcUrlBtn').style.color = type === 'url' ? '#000' : '#fff';
    document.getElementById('coverSrcFileBtn').style.background = type === 'file' ? 'var(--accent-color)' : '#333';
    document.getElementById('coverSrcFileBtn').style.color = type === 'file' ? '#000' : '#fff';
    document.getElementById('coverSrcPathBtn').style.background = type === 'path' ? 'var(--accent-color)' : '#333';
    document.getElementById('coverSrcPathBtn').style.color = type === 'path' ? '#000' : '#fff';
}

function showCreateGlobalPlaylistForm() {
    document.getElementById('createGlobalPlaylistForm').style.display = '';
    document.getElementById('manageGlobalPlaylistsView').style.display = 'none';
    document.getElementById('globalPlaylistName').value = '';
    document.getElementById('coverImageUrl').value = '';
    document.getElementById('coverImageFile').value = '';
    document.getElementById('coverImagePath').value = '';
    setCoverSource('url');
    document.getElementById('globalPlaylistName').focus();
}

function hideCreateGlobalPlaylistForm() {
    document.getElementById('createGlobalPlaylistForm').style.display = 'none';
    document.getElementById('manageGlobalPlaylistsView').style.display = '';
}

async function uploadCoverImage() {
    const adminEmail = localStorage.getItem('email');
    const fileInput = document.getElementById('coverImageFile');
    const urlInput = document.getElementById('coverImageUrl').value.trim();

    // Determine which source is active
    const urlVisible = document.getElementById('coverUrlGroup').style.display !== 'none';
    const fileVisible = document.getElementById('coverFileGroup').style.display !== 'none';

    if (urlVisible && urlInput) {
        return urlInput;
    }
    if (fileVisible && fileInput.files.length) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        try {
            const resp = await fetch(`${API_ROOT}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) throw new Error(data.message || 'Upload failed');
            return data.imageUrl;
        } catch (e) {
            throw new Error('Failed to upload image: ' + e.message);
        }
    }
    return '';
}

async function createGlobalPlaylist() {
    const nameInput = document.getElementById('globalPlaylistName');
    const name = nameInput.value.trim();
    if (!name) { alert('Please enter a playlist name.'); return; }
    if (playlists[name]) {
        alert('A playlist with that name already exists.');
        return;
    }
    const adminEmail = localStorage.getItem('email');
    try {
        // Upload or resolve the cover image first
        let coverImage = '';
        try {
            coverImage = await uploadCoverImage();
        } catch (e) {
            alert(e.message);
            return;
        }

        const response = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail, playlistName: name, coverImage })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Failed to create shared playlist');
            return;
        }
        playlists[name] = [];
        playlistMeta[name] = {
            coverImage: coverImage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isBuiltIn: false,
            isGlobal: true,
            globalId: data.playlist._id
        };
        savePlaylists();
        renderPlaylists();
        hideCreateGlobalPlaylistForm();
        showToast('Shared playlist created successfully!');
    } catch (e) {
        alert('Connection error. Is the server running?');
    }
}

function showManageGlobalPlaylists() {
    document.getElementById('manageGlobalPlaylistsView').style.display = '';
    document.getElementById('songSettingsCards').style.display = 'none';
    document.getElementById('addSongForm').style.display = 'none';
    document.getElementById('removeSongForm').style.display = 'none';
    document.getElementById('createGlobalPlaylistForm').style.display = 'none';
    loadGlobalPlaylistsList();
}

function hideManageGlobalPlaylists() {
    document.getElementById('manageGlobalPlaylistsView').style.display = 'none';
    document.getElementById('globalPlaylistCards').style.display = '';
}

async function loadGlobalPlaylistsList() {
    const container = document.getElementById('globalPlaylistsList');
    try {
        const response = await fetch(`${API_ROOT}/api/playlist/global`);
        if (!response.ok) {
            container.innerHTML = '<div style="color:#b3b3b3;text-align:center;padding:10px;">Failed to load.</div>';
            return;
        }
        const data = await response.json();
        globalPlaylistsData = data;
        if (data.length === 0) {
            container.innerHTML = '<div style="color:#b3b3b3;text-align:center;padding:10px;">No shared playlists yet.</div>';
            return;
        }
        let html = '';
        data.forEach(p => {
            const cover = p.coverImage || '';
            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;background:#333;border-radius:6px;padding:10px 12px;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${cover ? `<img src="${cover}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">` : `<span style="font-size:1.5em;">🎵</span>`}
                        <span style="color:#fff;font-weight:500;">${p.playlistName}</span>
                    </div>
                    <button onclick="deleteGlobalPlaylist('${p._id}')" style="background:#ff4444;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.85em;">Delete</button>
                </div>`;
        });
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div style="color:#b3b3b3;text-align:center;padding:10px;">Connection error.</div>';
    }
}

async function deleteGlobalPlaylist(playlistId) {
    if (!confirm('Delete this shared playlist? This cannot be undone.')) return;
    const adminEmail = localStorage.getItem('email');
    try {
        const response = await fetch(`${API_ROOT}/api/playlist/admin-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail, playlistId })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Failed to delete');
            return;
        }
        // Delete from all local data
        globalPlaylistsData = globalPlaylistsData.filter(p => p._id !== playlistId);
        const metaEntry = Object.entries(playlistMeta).find(([, m]) => m.globalId === playlistId);
        if (metaEntry) {
            const [name] = metaEntry;
            delete playlists[name];
            delete playlistMeta[name];
            savePlaylists();
        }
        // Fully re-sync from server to ensure clean state
        await loadGlobalPlaylists();
        renderPlaylists();
        loadGlobalPlaylistsList();
        showToast('Shared playlist deleted.');
    } catch (e) {
        alert('Connection error. Is the server running?');
    }
}

function renderPlaylists() {
    const mainContainer = document.getElementById('playlistContainer');
    const userContainer = document.getElementById('userPlaylistContainer');
    const userHeading = document.getElementById('userPlaylistHeading');
    let mainHtml = '';
    let userHtml = '';
    let hasMain = false;
    let hasUser = false;

    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');

    const builtInOrder = ['Telugu', 'English', 'Hindi', 'Folk'];
    const allKeys = Object.keys(playlists);
    allKeys.sort((a, b) => {
        const aIdx = builtInOrder.indexOf(a);
        const bIdx = builtInOrder.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return allKeys.indexOf(b) - allKeys.indexOf(a);
    }).forEach(name => {
        if (playlistMeta[name]?.isBuiltIn) {
            const img = playlistMeta[name].coverImage || '';
            mainHtml += `<div class="playlist" onclick="openPlaylist('${name.replace(/'/g, "\\'")}')">
                ${img ? `<img src="${img}" alt="${name}">` : `<div class="custom-playlist-img">🎵</div>`}
                <div class="playlist-title">${name}</div>
            </div>`;
            hasMain = true;
        } else if (playlistMeta[name]?.isGlobal) {
            const img = playlistMeta[name]?.coverImage || '';
            const safeName = name.replace(/'/g, "\\'");
            mainHtml += `<div class="playlist playlist-custom" onclick="openPlaylist('${safeName}')">
                ${img ? `<img src="${img}" alt="${name}">` : `<div class="custom-playlist-img">🎵</div>`}
                <div class="playlist-title">${name}</div>
                ${isAdmin ? `<button class="playlist-dots" onclick="event.stopPropagation(); showPlaylistCardMenu('${safeName}', this)" title="More">⋮</button>` : ''}
            </div>`;
            hasMain = true;
        } else {
            const img = playlistMeta[name]?.coverImage || '';
            const safeName = name.replace(/'/g, "\\'");
            userHtml += `<div class="playlist playlist-custom" onclick="openPlaylist('${safeName}')">
                ${img ? `<img src="${img}" alt="${name}">` : `<div class="custom-playlist-img">🎵</div>`}
                <div class="playlist-title">${name}</div>
                <button class="playlist-dots" onclick="event.stopPropagation(); showPlaylistCardMenu('${safeName}', this)" title="More">⋮</button>
            </div>`;
            hasUser = true;
        }
    });

    if (isAdmin) {
        mainHtml += userHtml;
        mainHtml += `<div class="playlist create-playlist" onclick="createNewPlaylist()">
            <div class="create-playlist-content">
                <span class="create-playlist-icon">+</span>
                <span class="create-playlist-text">Create Playlist</span>
            </div>
        </div>`;
        mainContainer.innerHTML = mainHtml;
        userHeading.style.display = 'none';
        userContainer.innerHTML = '';
    } else {
        mainContainer.innerHTML = mainHtml;
        userHeading.style.display = '';
        userHtml += `<div class="playlist create-playlist" onclick="createNewPlaylist()">
            <div class="create-playlist-content">
                <span class="create-playlist-icon">+</span>
                <span class="create-playlist-text">Create Playlist</span>
            </div>
        </div>`;
        userContainer.innerHTML = userHtml;
    }
}

// Load playlists on page load
(function init() {
    loadPlaylists();
    renderPlaylists();
    loadGlobalPlaylists();
    loadUserPlaylists();
    syncBuiltInPlaylists();
})();

async function syncBuiltInPlaylists() {
    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');
    if (!isAdmin) return;
    try {
        const glResp = await fetch(`${API_ROOT}/api/playlist/global`);
        if (!glResp.ok) return;
        const glData = await glResp.json();
        for (const [name, meta] of Object.entries(playlistMeta)) {
            if (!meta?.isBuiltIn) continue;
            if (glData.some(p => p.playlistName === name)) continue;
            const crResp = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail, playlistName: name, coverImage: meta.coverImage || '' })
            });
            const crData = await crResp.json();
            if (!crResp.ok || !crData.playlist) continue;
            const songs = playlists[name] || [];
            for (const s of songs) {
                const url = s.urls?.[0];
                if (!url || !url.trim()) continue;
                await fetch(`${API_ROOT}/api/playlist/admin-add-song-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail, playlistId: crData.playlist._id, songName: s.song, songUrl: url, songImage: s.image || '' })
                }).catch(() => {});
            }
            meta.globalId = crData.playlist._id;
            meta.isGlobal = true;
            meta.isBuiltIn = false;
        }
        savePlaylists();
        loadGlobalPlaylists();
    } catch (e) {}
}

const savedSize = localStorage.getItem('appFontSize') || 'medium';
applyFontSize(savedSize);

const savedMode = localStorage.getItem('appThemeMode') || 'dark';
document.documentElement.classList.toggle('light-mode', savedMode === 'light');

const savedThemeColor = localStorage.getItem('appThemeColor') || '#1db954';
document.documentElement.style.setProperty('--accent-color', savedThemeColor);

const savedBg = localStorage.getItem('appBackground') || '';
const savedBgImage = localStorage.getItem('appBgImage') || '';
if (savedBgImage) {
    document.getElementById('bgLayer').style.background = `url(${savedBgImage}) center/cover no-repeat`;
    document.body.classList.add('has-bg');
} else if (savedBg) {
    applyBgColor(savedBg);
}

// Go home to playlists
function goHome() {
    renderPlaylists();
    loadGlobalPlaylists();
    document.getElementById('songsSection').style.display = 'none';
    document.getElementById('playlistSection').style.display = 'block';
    document.getElementById('favoritesSection').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'none';
    document.getElementById('searchInput').value = '';
    renderRecentSongs();
}

let sleepTimerInterval = null;
let sleepTimerRemaining = 0;

// Open settings
function openSettings() {
    document.getElementById('playlistSection').style.display = 'none';
    document.getElementById('songsSection').style.display = 'none';
    document.getElementById('favoritesSection').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('recentSection').style.display = 'none';
    document.getElementById('miniPlayer').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'block';
    document.getElementById('searchInput').value = '';

    // Set profile name
    const fullName = localStorage.getItem('fullName') || 'User';
    document.getElementById('profileSettingsName').textContent = fullName;

    // Show admin-only buttons based on role
    const adminStatus = localStorage.getItem('adminStatus');
    const adminBtn = document.getElementById('adminRequestsSettingsBtn');
    const songBtn = document.getElementById('songSettingsBtn');
    if (adminStatus === 'leader') {
        adminBtn.style.display = '';
        songBtn.style.display = '';
    } else if (adminStatus === 'approved') {
        adminBtn.style.display = 'none';
        songBtn.style.display = '';
    } else {
        adminBtn.style.display = 'none';
        songBtn.style.display = 'none';
    }

    showSettingsMain();
}

function closeSettings() {
    goHome();
    if (currentSongTitle) {
        document.getElementById('miniPlayer').style.display = 'flex';
    }
}

function showTimerView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'block';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    updateTimerDisplay();
}

function showSettingsMain() {
    document.getElementById('settingsMainView').style.display = 'block';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsPlaylistView').style.display = 'none';
    document.getElementById('settingsAdminRequestsView').style.display = 'none';
    document.getElementById('settingsSongSettingsView').style.display = 'none';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('accountPrivacyView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    document.getElementById('settingsRateView').style.display = 'none';
    document.getElementById('settingsVersionView').style.display = 'none';
    document.querySelector('#settingsSection .songs-header').style.display = '';
}

function showAdminRequestsView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsPlaylistView').style.display = 'none';
    document.getElementById('settingsAdminRequestsView').style.display = 'block';
    document.getElementById('settingsSongSettingsView').style.display = 'none';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    loadAdminRequests();
}

function showSongSettingsView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsPlaylistView').style.display = 'none';
    document.getElementById('settingsAdminRequestsView').style.display = 'none';
    document.getElementById('settingsSongSettingsView').style.display = 'flex';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    document.getElementById('addSongForm').style.display = 'none';
    document.getElementById('removeSongForm').style.display = 'none';
    document.getElementById('songSettingsCards').style.display = '';
    document.getElementById('manageGlobalPlaylistsView').style.display = 'none';
    document.getElementById('createGlobalPlaylistForm').style.display = 'none';
}

function setSongSource(type) {
    const isFile = type === 'file';
    document.getElementById('songFileGroup').style.display = isFile ? '' : 'none';
    document.getElementById('songUrlGroup').style.display = isFile ? 'none' : '';
    document.getElementById('srcFileBtn').style.background = isFile ? 'var(--accent-color)' : '#333';
    document.getElementById('srcFileBtn').style.color = isFile ? '#000' : '#fff';
    document.getElementById('srcUrlBtn').style.background = isFile ? '#333' : 'var(--accent-color)';
    document.getElementById('srcUrlBtn').style.color = isFile ? '#fff' : '#000';
}

function setImageSource(type) {
    const isUrl = type === 'url';
    document.getElementById('songImageUrlGroup').style.display = isUrl ? '' : 'none';
    document.getElementById('songImageFileGroup').style.display = isUrl ? 'none' : '';
    document.getElementById('imgSrcUrlBtn').style.background = isUrl ? 'var(--accent-color)' : '#333';
    document.getElementById('imgSrcUrlBtn').style.color = isUrl ? '#000' : '#fff';
    document.getElementById('imgSrcFileBtn').style.background = isUrl ? '#333' : 'var(--accent-color)';
    document.getElementById('imgSrcFileBtn').style.color = isUrl ? '#fff' : '#000';
}

function togglePlaylistDropdown() {
    const container = document.getElementById('newSongPlaylistCheckboxes');
    const arrow = document.getElementById('playlistDropdownArrow');
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    arrow.textContent = isHidden ? '▲' : '▼';
}

function updatePlaylistDropdownLabel() {
    const container = document.getElementById('newSongPlaylistCheckboxes');
    const checked = container.querySelectorAll('input[type=checkbox]:checked');
    const label = document.getElementById('playlistDropdownLabel');
    if (checked.length === 0) {
        label.textContent = 'Select playlists...';
        label.style.color = '#b3b3b3';
    } else {
        label.textContent = checked.length + ' playlist' + (checked.length > 1 ? 's' : '') + ' selected';
        label.style.color = '#fff';
    }
}

function showAddSongForm() {
    document.getElementById('addSongForm').style.display = 'block';
    document.getElementById('songSettingsCards').style.display = 'none';
    document.getElementById('removeSongForm').style.display = 'none';
    document.getElementById('manageGlobalPlaylistsView').style.display = 'none';
    document.getElementById('createGlobalPlaylistForm').style.display = 'none';
    const container = document.getElementById('newSongPlaylistCheckboxes');
    container.innerHTML = '';
    const names = Object.keys(playlists).reverse();
    names.forEach(name => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 0;color:#fff;font-size:0.85em;cursor:pointer;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = name;
        cb.style.cssText = 'accent-color:var(--accent-color);';
        cb.onchange = updatePlaylistDropdownLabel;
        label.appendChild(cb);
        label.append(name + (playlistMeta[name]?.isGlobal ? ' (shared)' : ''));
        container.appendChild(label);
    });
    // Reset form
    document.getElementById('newSongName').value = '';
    document.getElementById('newSongUrl').value = '';
    document.getElementById('newSongFile').value = '';
    document.getElementById('newSongImageUrl').value = '';
    document.getElementById('newSongImageFile').value = '';
    setSongSource('file');
    setImageSource('url');
}

function showRemoveSongForm() {
    document.getElementById('removeSongForm').style.display = 'block';
    document.getElementById('songSettingsCards').style.display = 'none';
    document.getElementById('addSongForm').style.display = 'none';
    document.getElementById('manageGlobalPlaylistsView').style.display = 'none';
    document.getElementById('createGlobalPlaylistForm').style.display = 'none';
    const select = document.getElementById('removeSongSelect');
    select.innerHTML = '';
    const allSongs = new Set();
    Object.keys(playlists).forEach(name => {
        playlists[name].forEach(s => {
            allSongs.add(s.song);
        });
    });
    allSongs.forEach(song => {
        const opt = document.createElement('option');
        opt.value = song;
        opt.textContent = song;
        select.appendChild(opt);
    });
}

function isLocalPath(str) {
    return /^[a-zA-Z]:\\/.test(str) || str.startsWith('\\\\');
}

async function uploadLocalFileToCloudinary(adminEmail, filePath) {
    const resp = await fetch(`${API_ROOT}/api/upload/from-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, filePath })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload local file');
    }
    return data.url;
}

async function addSongToLibrary() {
    const container = document.getElementById('newSongPlaylistCheckboxes');
    const checkedBoxes = container.querySelectorAll('input[type=checkbox]:checked');
    if (checkedBoxes.length === 0) {
        showToast('Please select at least one playlist.');
        return;
    }

    const title = document.getElementById('newSongName').value.trim();
    const fileInput = document.getElementById('newSongFile');
    const urlInput = document.getElementById('newSongUrl');
    const isUrlMode = document.getElementById('songUrlGroup').style.display !== 'none';
    const adminEmail = localStorage.getItem('email');

    if (!title) {
        showToast('Please enter a song title.');
        return;
    }

    let songUrl = '';
    let songImage = '';

    if (isUrlMode) {
        const input = urlInput.value.trim();
        if (!input) {
            showToast('Please paste a song link or file path.');
            return;
        }

        if (isLocalPath(input)) {
            // MODE 1: Local Windows path — upload to Cloudinary
            showToast('Uploading local file to Cloudinary...');
            try {
                songUrl = await uploadLocalFileToCloudinary(adminEmail, input);
            } catch (e) {
                showToast('Failed to upload song: ' + e.message);
                return;
            }
        } else if (input.startsWith('http://') || input.startsWith('https://')) {
            // MODE 3: HTTPS URL — store directly
            songUrl = input;
        } else {
            showToast('Please provide a valid HTTPS URL or a local file path.');
            return;
        }

        // Handle image for URL/local-path mode
        const isImgUrlMode = document.getElementById('songImageUrlGroup').style.display !== 'none';
        if (isImgUrlMode) {
            const imgInput = document.getElementById('newSongImageUrl').value.trim();
            if (imgInput) {
                if (isLocalPath(imgInput)) {
                    try {
                        songImage = await uploadLocalFileToCloudinary(adminEmail, imgInput);
                    } catch (e) {
                        showToast('Failed to upload image: ' + e.message);
                        return;
                    }
                } else {
                    songImage = imgInput;
                }
            }
        } else {
            const imgFile = document.getElementById('newSongImageFile').files[0];
            if (imgFile) {
                const imgFormData = new FormData();
                imgFormData.append('image', imgFile);
                try {
                    console.log('Uploading image to Cloudinary...');
                    const imgResp = await fetch(`${API_ROOT}/api/upload`, {
                        method: 'POST',
                        body: imgFormData
                    });
                    let imgData;
                    try {
                        imgData = await imgResp.json();
                    } catch (jsonErr) {
                        console.error('Image upload JSON parse error:', jsonErr);
                        imgData = { success: false, message: 'Empty server response' };
                    }
                    console.log('Image upload response:', imgResp.status, imgData);
                    if (imgResp.ok && imgData.success && imgData.imageUrl) {
                        songImage = imgData.imageUrl;
                    } else {
                        console.error('Image upload failed:', imgData.message || 'Unknown error');
                    }
                } catch (e) {
                    console.error('Image upload network error:', e);
                }
            }
        }
    } else {
        // MODE 2: File upload — upload to Cloudinary
        if (!fileInput.files.length) {
            showToast('Please select an mp3 file.');
            return;
        }
        const file = fileInput.files[0];
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            showToast('Please select an mp3 file.');
            return;
        }
        const uploadFormData = new FormData();
        uploadFormData.append('song', file);
        const imgFile = document.getElementById('newSongImageFile').files[0];
        if (imgFile) {
            uploadFormData.append('image', imgFile);
        } else {
            const imgUrl = document.getElementById('newSongImageUrl').value.trim();
            if (imgUrl) {
                songImage = imgUrl;
            }
        }
        try {
            showToast('Uploading to Cloudinary...');
            const uploadResp = await fetch(`${API_ROOT}/api/upload`, {
                method: 'POST',
                body: uploadFormData
            });
            let uploadData;
            try {
                uploadData = await uploadResp.json();
            } catch (jsonErr) {
                showToast('Server returned empty response (status ' + uploadResp.status + '). Check backend logs.');
                return;
            }
            if (!uploadResp.ok || !uploadData.success) {
                showToast('Upload failed: ' + (uploadData.message || 'HTTP ' + uploadResp.status));
                return;
            }
            songUrl = uploadData.songUrl;
            if (uploadData.imageUrl) {
                songImage = uploadData.imageUrl;
            }
        } catch (e) {
            showToast('Connection error: ' + e.message);
            return;
        }
    }

    const isAdmin = adminEmail && (localStorage.getItem('adminStatus') === 'approved' || localStorage.getItem('adminStatus') === 'leader');

    async function proceedWithAdd(targetPlaylist, targetMeta) {
        if (!targetPlaylist) return;
        const pn = targetPlaylist.name || '';

        const saveLocal = () => {
            targetPlaylist.push({ song: title, urls: [songUrl], image: songImage || '' });
            savePlaylists();
            renderPlaylists();
        };

        if (targetMeta?.isGlobal && isAdmin && songUrl) {
            try {
                const resp = await fetch(`${API_ROOT}/api/playlist/admin-add-song-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        adminEmail,
                        playlistId: targetMeta.globalId,
                        songName: title,
                        songUrl: songUrl,
                        songImage: songImage || ''
                    })
                });
                let data;
                try {
                    data = await resp.json();
                } catch (jsonErr) {
                    console.error('admin-add-song-url JSON parse error:', jsonErr);
                    data = null;
                }
                if (resp.ok && data && data.message === 'Song added to global playlist') {
                    targetPlaylist.push({ song: title, urls: [songUrl], image: songImage || '' });
                    renderPlaylists();
                    await loadGlobalPlaylists();
                    showToast(`"${title}" added to shared playlist "${pn}".`);
                } else {
                    saveLocal();
                    showToast(`"${title}" saved locally. Server sync failed (${data ? data.message : 'HTTP ' + resp.status}).`);
                }
            } catch (e) {
                saveLocal();
                showToast(`"${title}" saved locally. Connection error: ${e.message}`);
            }
        } else {
            targetPlaylist.push({ song: title, urls: [songUrl], image: songImage || '' });
            savePlaylists();
            renderPlaylists();
            showToast(`"${title}" added to "${pn}".`);
        }
    }

    for (const cb of checkedBoxes) {
        const playlistName = cb.value;

        // For built-in playlists, admin changes must sync to server
        if (playlistMeta[playlistName]?.isBuiltIn && isAdmin) {
            try {
                console.log('Syncing built-in playlist to server:', playlistName);
                const glResp = await fetch(`${API_ROOT}/api/playlist/global`);
                if (glResp.ok) {
                    let glData;
                    try {
                        glData = await glResp.json();
                    } catch (jsonErr) {
                        console.error('glResp.json() parse error:', jsonErr);
                        glData = [];
                    }
                    let glEntry = glData.find(p => p.playlistName === playlistName);
                    if (!glEntry) {
                        const crResp = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminEmail, playlistName, coverImage: playlistMeta[playlistName].coverImage || '' })
                        });
                        let crData;
                        try {
                            crData = await crResp.json();
                        } catch (jsonErr) {
                            console.error('crResp.json() parse error:', jsonErr);
                            crData = {};
                        }
                        console.log('admin-create response:', crResp.status, crData);
                        if (crResp.ok && crData.playlist) {
                            glEntry = crData.playlist;
                            const existingSongs = playlists[playlistName] || [];
                            for (const s of existingSongs) {
                                const url = s.urls?.[0];
                                if (!url || !url.trim()) continue;
                                try {
                                    await fetch(`${API_ROOT}/api/playlist/admin-add-song-url`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ adminEmail, playlistId: glEntry._id, songName: s.song, songUrl: url, songImage: s.image || '' })
                                    });
                                } catch (e) {
                                    console.error('Failed to sync existing song:', s.song, e);
                                }
                            }
                        }
                    }
                    if (glEntry) {
                        playlistMeta[playlistName].globalId = glEntry._id;
                        playlistMeta[playlistName].isGlobal = true;
                        playlistMeta[playlistName].isBuiltIn = false;
                    }
                }
            } catch (e) {
                console.error('Built-in playlist sync error:', e);
            }
        }

        const pArr = playlists[playlistName];
        if (pArr) {
            pArr.name = playlistName;
            await proceedWithAdd(pArr, playlistMeta[playlistName]);
        }
    }

    document.getElementById('addSongForm').style.display = 'none';
    document.getElementById('songSettingsCards').style.display = '';
    document.getElementById('newSongName').value = '';
    document.getElementById('newSongUrl').value = '';
    document.getElementById('newSongFile').value = '';
    document.getElementById('newSongImageUrl').value = '';
    document.getElementById('newSongImageFile').value = '';
}

async function removeSongFromLibrary() {
    const select = document.getElementById('removeSongSelect');
    const songName = select.value;
    if (!songName) {
        showToast('Please select a song to remove.');
        return;
    }
    // Remove from local playlists
    Object.keys(playlists).forEach(name => {
        playlists[name] = playlists[name].filter(s => s.song !== songName);
    });
    savePlaylists();
    // Remove from shared playlists via API
    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');
    for (const [name, meta] of Object.entries(playlistMeta)) {
        if (meta?.isBuiltIn && isAdmin) {
            try {
                const glResp = await fetch(`${API_ROOT}/api/playlist/global`);
                if (glResp.ok) {
                    const glData = await glResp.json();
                    let glEntry = glData.find(p => p.playlistName === name);
                    if (!glEntry) {
                        const crResp = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminEmail, playlistName: name, coverImage: meta.coverImage || '' })
                        });
                        const crData = await crResp.json();
                        if (crResp.ok && crData.playlist) {
                            glEntry = crData.playlist;
                            const existingSongs = playlists[name] || [];
                            for (const s of existingSongs) {
                                const url = s.urls?.[0];
                                if (!url || !url.trim()) continue;
                                await fetch(`${API_ROOT}/api/playlist/admin-add-song-url`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ adminEmail, playlistId: glEntry._id, songName: s.song, songUrl: url, songImage: s.image || '' })
                                }).catch(() => {});
                            }
                        }
                    }
                    if (glEntry) {
                        playlistMeta[name].globalId = glEntry._id;
                        playlistMeta[name].isGlobal = true;
                        playlistMeta[name].isBuiltIn = false;
                    }
                }
            } catch (e) {}
        }
        if ((meta?.isGlobal || playlistMeta[name]?.isGlobal) && playlistMeta[name]?.globalId) {
            fetch(`${API_ROOT}/api/playlist/admin-remove-song`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail, playlistId: playlistMeta[name].globalId, songName })
            }).catch(() => {});
        }
    }
    document.getElementById('removeSongForm').style.display = 'none';
    renderPlaylists();
    loadGlobalPlaylists();
    showToast(`"${songName}" removed from all playlists.`);
}

async function loadAdminRequests() {
    const container = document.getElementById('adminRequestsList');
    container.innerHTML = '<div style="text-align:center;color:#b3b3b3;padding:20px;">Loading...</div>';
    const leaderEmail = localStorage.getItem('email');
    const leaderId = localStorage.getItem('userId');
    try {
        // Load pending requests
        const reqResp = await fetch(`${API_ROOT}/api/auth/admin/requests?leaderEmail=${encodeURIComponent(leaderEmail)}`);
        const requests = reqResp.ok ? await reqResp.json() : [];

        // Load all admins
        const listResp = await fetch(`${API_ROOT}/api/auth/admin/list?leaderEmail=${encodeURIComponent(leaderEmail)}`);
        const admins = listResp.ok ? await listResp.json() : [];

        let html = '';

        // --- Pending Requests Section ---
        if (requests.length > 0) {
            html += '<h5 style="color:#fff;margin:16px 0 10px;font-size:0.95em;">Pending Requests</h5>';
            requests.forEach(req => {
                const date = new Date(req.createdAt).toLocaleDateString();
                html += `
                    <div style="background:#282828;border-radius:8px;padding:16px;margin-bottom:10px;border:1px solid #404040;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="color:#fff;font-weight:600;font-size:1em;">${req.fullName}</div>
                                <div style="color:#b3b3b3;font-size:0.85em;">${req.email}</div>
                                <div style="color:#666;font-size:0.75em;">Requested: ${date}</div>
                            </div>
                            <div style="display:flex;gap:8px;">
                                <button onclick="approveAdminRequest('${req._id}')" style="background:#1db954;color:#000;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Accept</button>
                                <button onclick="rejectAdminRequest('${req._id}')" style="background:#ff4444;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Reject</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // --- Admin List Section ---
        html += '<h5 style="color:#fff;margin:16px 0 10px;font-size:0.95em;">All Admins</h5>';
        if (admins.length === 0) {
            html += '<div style="text-align:center;color:#b3b3b3;padding:20px;">No admins found.</div>';
        } else {
            admins.forEach(admin => {
                const date = new Date(admin.createdAt).toLocaleDateString();
                const isSelf = admin._id === leaderId;
                const roleLabel = admin.adminStatus === 'leader' ? 'Leader' : 'Admin';
                html += `
                    <div style="background:#282828;border-radius:8px;padding:16px;margin-bottom:10px;border:1px solid #404040;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="color:#fff;font-weight:600;font-size:1em;">${admin.fullName} <span style="color:#1db954;font-size:0.8em;">(${roleLabel})</span></div>
                                <div style="color:#b3b3b3;font-size:0.85em;">${admin.email}</div>
                                <div style="color:#666;font-size:0.75em;">Since: ${date}</div>
                            </div>
                            ${isSelf ? '<div style="color:#666;font-size:0.85em;">You</div>' : `<button onclick="deleteAdmin('${admin._id}')" style="background:#ff4444;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Delete</button>`}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div style="text-align:center;color:#ff4444;padding:20px;">Connection error</div>';
    }
}

async function deleteAdmin(userId) {
    const leaderEmail = localStorage.getItem('email');
    try {
        const response = await fetch(`${API_ROOT}/api/auth/admin/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaderEmail, userId })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Admin deleted successfully');
            loadAdminRequests();
        } else {
            showToast(data.message || 'Failed to delete admin');
        }
    } catch (err) {
        showToast('Connection error');
    }
}

async function approveAdminRequest(userId) {
    const leaderEmail = localStorage.getItem('email');
    try {
        const response = await fetch(`${API_ROOT}/api/auth/admin/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaderEmail, userId })
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message || 'Admin request approved');
            loadAdminRequests();
        } else {
            showToast(data.message || 'Failed to approve');
        }
    } catch (err) {
        showToast('Connection error');
    }
}

async function rejectAdminRequest(userId) {
    const leaderEmail = localStorage.getItem('email');
    try {
        const response = await fetch(`${API_ROOT}/api/auth/admin/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaderEmail, userId })
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message || 'Admin request rejected');
            loadAdminRequests();
        } else {
            showToast(data.message || 'Failed to reject');
        }
    } catch (err) {
        showToast('Connection error');
    }
}

function showPlaylistView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsPlaylistView').style.display = 'block';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
}

function playAllPlaylistSongs() {
    showPlaylistPickerModal('Select a playlist to play', function(name) {
        const songs = playlists[name];
        if (!songs || songs.length === 0) {
            showToast('This playlist is empty.');
            return;
        }
        currentPlaylistName = name;
        currentQueue = songs;
        currentQueueIndex = 0;
        playSong(songs[0].song, songs[0].urls, songs[0].image);
        closeSettings();
        showToast('Playing ' + name);
    });
}

function renameCurrentPlaylist() {
    const customNames = Object.keys(playlists).filter(name => !playlistMeta[name]?.isBuiltIn && !playlistMeta[name]?.isGlobal);
    if (customNames.length === 0) {
        showToast('No custom playlists to rename.');
        return;
    }
    showPlaylistPickerModal('Select a playlist to rename', function(name) {
        showRenameInput(name);
    }, true);
}

function showRenameInput(oldName) {
    const modal = document.getElementById('playlistActionModal');
    document.getElementById('playlistActionTitle').textContent = 'Rename Playlist';
    document.getElementById('playlistActionBody').innerHTML = `
        <p style="color:#b3b3b3;margin-bottom:12px;text-align:center;">Enter a new name for <strong style="color:#fff;">${oldName}</strong></p>
        <input type="text" id="renameInput" class="timer-custom-input" value="${oldName}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #404040;background:#282828;color:#fff;font-size:1em;margin-bottom:16px;box-sizing:border-box;">
        <div style="display:flex;gap:10px;justify-content:center;">
            <button class="timer-btn" onclick="cancelRename()" style="flex:1;">Cancel</button>
            <button class="timer-btn timer-custom-go" onclick="confirmRename('${oldName.replace(/'/g, "\\'")}')" style="flex:1;">Save</button>
        </div>
    `;
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('renameInput').focus(), 100);
}

function cancelRename() {
    document.getElementById('playlistActionModal').style.display = 'none';
}

function confirmRename(oldName) {
    const newName = document.getElementById('renameInput').value.trim();
    if (!newName) {
        showToast('Playlist name cannot be empty.');
        return;
    }
    if (newName === oldName) {
        document.getElementById('playlistActionModal').style.display = 'none';
        return;
    }
    if (playlists[newName]) {
        showToast('A playlist with that name already exists.');
        return;
    }
    if (playlistMeta[oldName]?.isBuiltIn) {
        showToast('Cannot rename a built-in playlist.');
        return;
    }
    playlists[newName] = playlists[oldName];
    delete playlists[oldName];
    playlistMeta[newName] = playlistMeta[oldName];
    playlistMeta[newName].updatedAt = new Date().toISOString();
    delete playlistMeta[oldName];
    if (currentPlaylistName === oldName) currentPlaylistName = newName;
    savePlaylists();
    renderPlaylists();
    document.getElementById('playlistActionModal').style.display = 'none';
    showToast('Playlist renamed to "' + newName + '".');
}

function showPlaylistDetails() {
    showPlaylistPickerModal('Select a playlist to view details', function(name) {
        const meta = playlistMeta[name];
        const songs = playlists[name];
        const count = songs ? songs.length : 0;
        const type = meta?.isBuiltIn ? 'Built-in' : 'Custom';
        const created = meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A';
        const updated = meta?.updatedAt ? new Date(meta.updatedAt).toLocaleDateString() : 'N/A';
        const cover = meta?.coverImage || '';

        const modal = document.getElementById('playlistActionModal');
        document.getElementById('playlistActionTitle').textContent = '📋 Playlist Details';
        document.getElementById('playlistActionBody').innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0;">
                ${cover ? `<img src="${cover}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;border:2px solid #404040;">` : `<div style="font-size:4em;">🎵</div>`}
                <h3 style="color:#fff;margin:0;">${name}</h3>
                <div style="width:100%;background:#282828;border-radius:10px;padding:16px;">
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #404040;">
                        <span style="color:#b3b3b3;">Type</span>
                        <span style="color:#fff;font-weight:600;">${type}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #404040;">
                        <span style="color:#b3b3b3;">Total Songs</span>
                        <span style="color:#fff;font-weight:600;">${count}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #404040;">
                        <span style="color:#b3b3b3;">Created</span>
                        <span style="color:#fff;font-weight:600;">${created}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;">
                        <span style="color:#b3b3b3;">Last Updated</span>
                        <span style="color:#fff;font-weight:600;">${updated}</span>
                    </div>
                </div>
                <button class="timer-btn timer-custom-go" onclick="closePlaylistActionModal()" style="margin-top:8px;padding:10px 32px;">Close</button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

function deleteCurrentPlaylist() {
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminStatus === 'approved' || adminStatus === 'leader';
    const customNames = Object.keys(playlists).filter(name => {
        if (playlistMeta[name]?.isBuiltIn) return false;
        if (playlistMeta[name]?.isGlobal && !isAdmin) return false;
        return true;
    });
    if (customNames.length === 0) {
        showToast('No playlists available to delete.');
        return;
    }
    showPlaylistPickerModal('Select a playlist to delete', function(name) {
        showDeleteConfirmation(name);
    }, true);
}

function showPlaylistCardMenu(name, btn) {
    pendingPlaylistCard = name;
    const menu = document.getElementById('playlistCardDropdown');
    // Show delete only for non-global playlists, or if user is admin
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminStatus === 'approved' || adminStatus === 'leader';
    const isGlobal = playlistMeta[name]?.isGlobal;
    const deleteItem = menu.querySelector('.menu-item');
    deleteItem.style.display = (!isGlobal || isAdmin) ? '' : 'none';
    const rect = btn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.display = 'block';
}

function closePlaylistCardMenu() {
    document.getElementById('playlistCardDropdown').style.display = 'none';
    pendingPlaylistCard = null;
}

function playlistCardDelete() {
    const name = pendingPlaylistCard;
    closePlaylistCardMenu();
    if (name) {
        showDeleteConfirmation(name);
    }
}

function showDeleteConfirmation(name) {
    const modal = document.getElementById('playlistActionModal');
    document.getElementById('playlistActionTitle').textContent = '🗑️ Delete Playlist';
    document.getElementById('playlistActionBody').innerHTML = `
        <div style="text-align:center;padding:8px 0;">
            <div style="font-size:3em;margin-bottom:12px;">⚠️</div>
            <p style="color:#fff;font-size:1.1em;margin-bottom:4px;">Are you sure you want to delete</p>
            <p style="color:#ff4444;font-weight:700;font-size:1.2em;margin-bottom:16px;">"${name}"?</p>
            <p style="color:#b3b3b3;font-size:0.85em;margin-bottom:20px;">This action cannot be undone. The playlist will be permanently deleted from your library.</p>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button class="timer-btn" onclick="cancelDelete()" style="flex:1;">Cancel</button>
                <button class="timer-btn" onclick="confirmDelete('${name.replace(/'/g, "\\'")}')" style="flex:1;background:#ff4444;color:#fff;border-color:#ff4444;">Delete</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function cancelDelete() {
    document.getElementById('playlistActionModal').style.display = 'none';
}

async function confirmDelete(name) {
    if (!playlistMeta[name]) {
        showToast('Playlist not found.');
        return;
    }
    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');

    if (playlistMeta[name]?.isBuiltIn) {
        if (!isAdmin) {
            showToast('Cannot delete a built-in playlist.');
            return;
        }
        // Admin can delete built-in — persist deleted state
        const deleted = loadDeletedBuiltIn();
        if (!deleted.includes(name)) {
            deleted.push(name);
            saveDeletedBuiltIn(deleted);
        }
        delete playlists[name];
        delete playlistMeta[name];
        if (currentPlaylistName === name) currentPlaylistName = '';
        savePlaylists();
        renderPlaylists();
        document.getElementById('playlistActionModal').style.display = 'none';
        showToast('Playlist "' + name + '" deleted.');
        return;
    }
    if (playlistMeta[name]?.isGlobal) {
        if (!isAdmin) {
            showToast('This is a shared playlist and cannot be deleted.');
            return;
        }
        const playlistId = playlistMeta[name].globalId;
        if (playlistId) {
            try {
                const userId = localStorage.getItem('userId');
                const resp = await fetch(`${API_ROOT}/api/playlist/admin-delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail: adminEmail, userId: userId, playlistId })
                });
                if (!resp.ok) {
                    const err = await resp.json();
                    alert('Failed to delete shared playlist: ' + (err.message || 'Server error'));
                    return;
                }
                delete playlists[name];
                delete playlistMeta[name];
                if (currentPlaylistName === name) currentPlaylistName = '';
                savePlaylists();
                renderPlaylists();
                await loadGlobalPlaylists();
                document.getElementById('playlistActionModal').style.display = 'none';
                showToast('Playlist "' + name + '" deleted.');
                return;
            } catch (e) {
                alert('Could not reach the server. Please make sure the server is running and try again.');
                return;
            }
        }
        delete playlists[name];
        delete playlistMeta[name];
        if (currentPlaylistName === name) currentPlaylistName = '';
        savePlaylists();
        renderPlaylists();
        document.getElementById('playlistActionModal').style.display = 'none';
        showToast('Playlist "' + name + '" deleted.');
        return;
    }
    // Regular custom playlist deletion
    delete playlists[name];
    delete playlistMeta[name];
    if (currentPlaylistName === name) currentPlaylistName = '';
    savePlaylists();
    renderPlaylists();
    document.getElementById('playlistActionModal').style.display = 'none';
    showToast('Playlist "' + name + '" deleted.');
}

function showPlaylistPickerModal(title, callback, excludeBuiltIn) {
    const modal = document.getElementById('playlistActionModal');
    document.getElementById('playlistActionTitle').textContent = title;

    let names = Object.keys(playlists);
    if (excludeBuiltIn) {
        names = names.filter(name => !playlistMeta[name]?.isBuiltIn);
    }

    if (names.length === 0) {
        showToast('No playlists available.');
        return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;max-height:350px;overflow-y:auto;">';
    names.forEach(name => {
        const meta = playlistMeta[name];
        const cover = meta?.coverImage || '';
        const count = playlists[name] ? playlists[name].length : 0;
        html += `<div class="acc-item" onclick="selectPlaylistFromPicker('${name.replace(/'/g, "\\'")}')" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 16px;border-color:transparent;">
            ${cover ? `<img src="${cover}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;">` : `<span style="font-size:2em;">🎵</span>`}
            <div style="flex:1;">
                <div style="color:#fff;font-weight:600;">${name}</div>
                <div style="color:#b3b3b3;font-size:0.82em;">${count} songs</div>
            </div>
        </div>`;
    });
    html += '</div>';

    document.getElementById('playlistActionBody').innerHTML = html;
    modal.style.display = 'flex';

    window._playlistPickerCallback = callback;
}

function selectPlaylistFromPicker(name) {
    closePlaylistActionModal();
    if (window._playlistPickerCallback) {
        window._playlistPickerCallback(name);
    }
}

function closePlaylistActionModal(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('playlistActionModal').style.display = 'none';
    }
}

function showAppearanceView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsAppearanceView').style.display = 'block';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    highlightCurrentAppearance();
}

function showAccountPrivacyView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('accountPrivacyView').style.display = 'block';
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
}

function showAboutView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsAppearanceView').style.display = 'none';
    document.getElementById('accountPrivacyView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'none';
    document.getElementById('settingsRateView').style.display = 'none';
    document.getElementById('settingsVersionView').style.display = 'none';
    document.getElementById('settingsPrivacyView').style.display = 'none';
    document.getElementById('settingsTermsView').style.display = 'none';
    document.getElementById('settingsDeveloperInfoView').style.display = 'none';
    document.getElementById('settingsAboutView').style.display = 'block';
}

function showPrivacyView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsPrivacyView').style.display = 'block';
}

function showTermsView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsTermsView').style.display = 'block';
}

function showDeveloperInfoView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsDeveloperInfoView').style.display = 'block';
}

function showHelpView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsHelpView').style.display = 'block';
}

function sendFeedback() {
    window.location.href = 'mailto:metebharath4@gmail.com?subject=My%20Music%20Feedback';
}

function showRateView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsRateView').style.display = 'block';
    document.getElementById('ratingThankYou').style.display = 'none';
    currentRating = 0;
    resetStars();
}

let currentRating = 0;

function hoverStar(rating, el) {
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById('star' + i);
        star.style.color = i <= rating ? '#fbbf24' : '#404040';
    }
}

function resetStars() {
    if (currentRating > 0) {
        for (let i = 1; i <= 5; i++) {
            document.getElementById('star' + i).style.color = i <= currentRating ? '#fbbf24' : '#404040';
        }
    } else {
        for (let i = 1; i <= 5; i++) {
            document.getElementById('star' + i).style.color = '#404040';
        }
    }
}

function setRating(rating) {
    currentRating = rating;
    for (let i = 1; i <= 5; i++) {
        document.getElementById('star' + i).style.color = i <= rating ? '#fbbf24' : '#404040';
    }
    const thankYou = document.getElementById('ratingThankYou');
    thankYou.style.display = 'block';
    thankYou.textContent = 'Thank you for rating! ' + '⭐'.repeat(rating);
    showToast('You rated ' + rating + ' stars!');
}

function showVersionView() {
    document.getElementById('settingsAboutView').style.display = 'none';
    document.getElementById('settingsVersionView').style.display = 'block';
}

function rateApp() {
    const url = 'https://github.com/anomalyco/opencode/issues';
    window.open(url, '_blank');
    showToast('Thank you for your feedback!');
}

function contactSupport() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = () => overlay.remove();
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px;text-align:center;" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>📧 Contact Us</h3>
                <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <p style="color:#b3b3b3;margin-bottom:20px;line-height:1.6;">We'd love to hear from you!<br>If you have any questions, suggestions, feedback, or issues regarding Music App, feel free to contact us.</p>
            <div style="background:#282828;border-radius:10px;padding:20px 24px;margin-bottom:14px;">
                <p style="color:#b3b3b3;font-size:0.85em;margin-bottom:4px;">👨‍💻 Developer</p>
                <p style="color:#fff;font-weight:600;font-size:1.05em;">METE BHARATH</p>
            </div>
            <div style="background:#282828;border-radius:10px;padding:20px 24px;margin-bottom:14px;">
                <p style="color:#b3b3b3;font-size:0.85em;margin-bottom:4px;">📧 Email</p>
                <a href="mailto:metebharath4@gmail.com" style="color:var(--accent-color);font-weight:600;font-size:1.05em;text-decoration:none;">metebharath4@gmail.com</a>
            </div>
            <p style="color:#888;font-size:0.85em;margin-top:10px;line-height:1.5;">Thank you for using Music App!<br>Your feedback helps us improve and provide a better music experience for everyone.</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function highlightCurrentAppearance() {
    const mode = localStorage.getItem('appThemeMode') || 'dark';
    document.getElementById('darkModeBtn').classList.toggle('active', mode === 'dark');
    document.getElementById('lightModeBtn').classList.toggle('active', mode === 'light');

    const colors = { '#1db954': 'green', '#3b82f6': 'blue', '#a855f7': 'purple', '#ef4444': 'red', '#ec4899': 'pink', '#f97316': 'orange', '#14b8a6': 'teal', '#eab308': 'yellow' };
    const savedColor = localStorage.getItem('appThemeColor') || '#1db954';
    document.querySelectorAll('#settingsAppearanceView .color-swatch').forEach(el => {
        el.classList.toggle('active', el.dataset.theme === colors[savedColor]);
    });

    const fontSize = localStorage.getItem('appFontSize') || 'medium';
    document.querySelectorAll('#settingsAppearanceView .font-size-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.size === fontSize);
    });

    const hasBg = localStorage.getItem('appBackground') || localStorage.getItem('appBgImage');
    document.getElementById('removeBgBtn').style.display = hasBg ? 'block' : 'none';
}

function setThemeMode(mode, btn) {
    document.getElementById('darkModeBtn').classList.toggle('active', mode === 'dark');
    document.getElementById('lightModeBtn').classList.toggle('active', mode === 'light');
    localStorage.setItem('appThemeMode', mode);
    document.documentElement.classList.toggle('light-mode', mode === 'light');
    showToast(mode === 'dark' ? 'Dark Mode enabled.' : 'Light Mode enabled.');
}

function selectThemeColor(color, el) {
    document.querySelectorAll('#settingsAppearanceView .color-swatch').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    localStorage.setItem('appThemeColor', color);
    document.documentElement.style.setProperty('--accent-color', color);
    showToast('Theme color updated.');
}

function setDefaultBackground() {
    localStorage.removeItem('appBackground');
    localStorage.removeItem('appBgImage');
    applyBgColor('');
    document.getElementById('removeBgBtn').style.display = 'none';
    showToast('Default background set.');
}

function setCustomBackground(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        localStorage.setItem('appBgImage', dataUrl);
        document.getElementById('bgLayer').style.background = `url(${dataUrl}) center/cover no-repeat`;
        document.body.classList.add('has-bg');
        document.getElementById('removeBgBtn').style.display = 'block';
        showToast('Custom background applied.');
    };
    reader.readAsDataURL(file);
}

function openAccountModal(type) {
    const overlay = document.getElementById('accountModalOverlay');
    const title = document.getElementById('accountModalTitle');
    const body = document.getElementById('accountModalBody');

    if (type === 'username') {
        title.textContent = 'Change Username';
        body.innerHTML = `
            <div class="account-field">
                <label class="account-label">Current Username</label>
                <div class="account-current-value" id="currentUsernameDisplay"></div>
            </div>
            <div class="account-field">
                <label class="account-label">New Username</label>
                <input type="text" id="newUsernameInput" class="account-input" placeholder="Enter new username">
            </div>
            <button class="btn-primary account-save-btn" onclick="saveUsername()">Save</button>
        `;
        const name = localStorage.getItem('fullName') || '';
        document.getElementById('currentUsernameDisplay').textContent = name;
        document.getElementById('newUsernameInput').value = name;
    } else if (type === 'password') {
        title.textContent = 'Change Password';
        body.innerHTML = `
            <div class="account-field">
                <label class="account-label">Current Password</label>
                <input type="password" id="currentPasswordInput" class="account-input" placeholder="Enter current password">
            </div>
            <div class="account-field">
                <label class="account-label">New Password</label>
                <input type="password" id="newPasswordInput" class="account-input" placeholder="Enter new password">
            </div>
            <div class="account-field">
                <label class="account-label">Confirm New Password</label>
                <input type="password" id="confirmPasswordInput" class="account-input" placeholder="Confirm new password">
            </div>
            <button class="btn-primary account-save-btn" onclick="savePassword()">Save</button>
        `;
    } else if (type === 'email') {
        title.textContent = 'Change Email';
        body.innerHTML = `
            <div class="account-field">
                <label class="account-label">Current Email</label>
                <div class="account-current-value" id="currentEmailDisplay"></div>
            </div>
            <div class="account-field">
                <label class="account-label">New Email</label>
                <input type="email" id="newEmailInput" class="account-input" placeholder="Enter new email address">
            </div>
            <div class="account-field">
                <label class="account-label">Password for Verification</label>
                <input type="password" id="emailPasswordInput" class="account-input" placeholder="Enter your password">
            </div>
            <button class="btn-primary account-save-btn" onclick="saveEmail()">Save</button>
        `;
        document.getElementById('currentEmailDisplay').textContent = localStorage.getItem('email') || '';
    } else if (type === 'delete') {
        title.textContent = 'Delete Account';
        body.innerHTML = `
            <div style="text-align: center; padding: 10px 0;">
                <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                <p style="color: #ff4444; font-size: 1.1em; font-weight: 600; margin-bottom: 10px;">Are you sure?</p>
                <p style="color: #b3b3b3; margin-bottom: 20px;">This will permanently delete your account and all data. This cannot be undone.</p>
                <div class="account-field">
                    <label class="account-label">Enter your password to confirm</label>
                    <input type="password" id="deletePasswordInput" class="account-input" placeholder="Enter your password">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn-secondary" onclick="closeAccountModal()" style="flex: 1;">Cancel</button>
                    <button class="btn-primary account-save-btn" onclick="saveDeleteAccount()" style="flex: 1; background: #ff4444;">Delete</button>
                </div>
            </div>
        `;
    }

    overlay.style.display = 'flex';
}

function closeAccountModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('accountModalOverlay').style.display = 'none';
}

function showFontSizeView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsFontSizeView').style.display = 'block';
    highlightCurrentFontSize();
}

function setFontSize(size, btn) {
    document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    localStorage.setItem('appFontSize', size);
    applyFontSize(size);
    showToast(`Font size set to ${size}.`);
}

function applyFontSize(size) {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-big');
    root.classList.add('font-' + size);
}

function highlightCurrentFontSize() {
    const size = localStorage.getItem('appFontSize') || 'medium';
    document.querySelectorAll('.font-size-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.size === size);
    });
}

const bgColors = [
    { name: 'Black', value: '#121212' },
    { name: 'White', value: '#f0f0f0' },
    { name: 'Blue', value: '#1a3a5c' },
    { name: 'Green', value: '#1a5c2a' },
    { name: 'Red', value: '#5c1a1a' },
    { name: 'Purple', value: '#3a1a5c' },
    { name: 'Teal', value: '#1a5c5c' },
    { name: 'Orange', value: '#5c3a1a' },
];

function showBackgroundView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('settingsTimerView').style.display = 'none';
    document.getElementById('settingsFontSizeView').style.display = 'none';
    document.getElementById('settingsBackgroundView').style.display = 'block';
    renderColorOptions();
}

function renderColorOptions() {
    const grid = document.getElementById('colorGrid');
    grid.innerHTML = '';
    const currentBg = localStorage.getItem('appBackground') || '';
    bgColors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-swatch' + (currentBg === c.value ? ' active' : '');
        div.style.background = c.value;
        div.title = c.name;
        div.onclick = () => selectBgColor(c.value, div);
        grid.appendChild(div);
    });
}

function selectBgColor(value, el) {
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    localStorage.setItem('appBackground', value);
    applyBgColor(value);
    showToast('Background applied.');
}

function removeBackground() {
    localStorage.removeItem('appBackground');
    localStorage.removeItem('appBgImage');
    applyBgColor('');
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    document.getElementById('removeBgBtn').style.display = 'none';
    showToast('Background removed.');
}

function applyBgColor(value) {
    const layer = document.getElementById('bgLayer');
    const bgImage = localStorage.getItem('appBgImage');
    if (bgImage) {
        layer.style.background = `url(${bgImage}) center/cover no-repeat`;
        document.body.classList.add('has-bg');
    } else if (value) {
        layer.style.background = value;
        document.body.classList.add('has-bg');
    } else {
        layer.style.background = '';
        document.body.classList.remove('has-bg');
    }
}

function startTimer(minutes, btn) {
    if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
    }
    sleepTimerRemaining = minutes * 60;
    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('timerDisplay').style.display = 'block';
    updateTimerDisplay();
    sleepTimerInterval = setInterval(() => {
        sleepTimerRemaining--;
        updateTimerDisplay();
        if (sleepTimerRemaining <= 0) {
            clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
            stopPlayback();
            showToast('Sleep timer ended. Playback stopped.');
            document.getElementById('timerDisplay').style.display = 'none';
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
        }
    }, 1000);
    showToast(`Timer set for ${minutes} minutes.`);
}

function startCustomTimer() {
    const input = document.getElementById('customTimerInput');
    const minutes = parseInt(input.value, 10);
    if (!minutes || minutes < 1) {
        showToast('Please enter a valid number of minutes.');
        return;
    }
    startTimer(minutes, null);
    input.value = '';
}

function stopTimer() {
    if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
    }
    sleepTimerRemaining = 0;
    document.getElementById('timerDisplay').style.display = 'none';
    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    showToast('Timer cancelled.');
}

function updateTimerDisplay() {
    const display = document.getElementById('timerCountdown');
    if (!display) return;
    const mins = Math.floor(sleepTimerRemaining / 60);
    const secs = sleepTimerRemaining % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Favorites
function getFavoritesKey() {
    const userId = localStorage.getItem('userId');
    return userId ? `favoriteSongs_${userId}` : 'favoriteSongs';
}

function getFavorites() {
    const data = localStorage.getItem(getFavoritesKey());
    return data ? JSON.parse(data) : [];
}

function saveFavorites(favs) {
    localStorage.setItem(getFavoritesKey(), JSON.stringify(favs));
}

function toggleFavorite() {
    if (!currentSongTitle) return;
    const favs = getFavorites();
    const idx = favs.indexOf(currentSongTitle);
    if (idx === -1) {
        favs.push(currentSongTitle);
    } else {
        favs.splice(idx, 1);
    }
    saveFavorites(favs);
    updateHeartButton();
}

function isFavorite(songName) {
    return getFavorites().indexOf(songName) !== -1;
}

function updateHeartButton() {
    const btns = ['fsFavBtn', 'miniFavBtn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (currentSongTitle && isFavorite(currentSongTitle)) {
            btn.innerHTML = '♥';
            btn.classList.add('favorited');
        } else {
            btn.innerHTML = '♡';
            btn.classList.remove('favorited');
        }
    });
}

function openFavorites() {
    document.getElementById('playlistSection').style.display = 'none';
    document.getElementById('songsSection').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    const favSection = document.getElementById('favoritesSection');
    favSection.style.display = 'block';
    document.getElementById('searchInput').value = '';

    const list = document.getElementById('favoriteSongList');
    list.innerHTML = '';
    const favs = getFavorites();
    if (favs.length === 0) {
        list.innerHTML = '<div class="no-results" style="display:block;">No favorite songs yet</div>';
        return;
    }

    currentQueue = [];
    favs.forEach(songName => {
        let found = null;
        for (const pName in playlists) {
            const s = playlists[pName].find(x => x.song === songName);
            if (s) { found = s; break; }
        }
        if (found) {
            currentQueue.push(found);
            const idx = currentQueue.length - 1;
            const wrapper = document.createElement('div');
            wrapper.className = 'song-wrapper';
            if (found.image) {
                const img = document.createElement('img');
                img.className = 'song-list-img';
                img.src = found.image;
                img.alt = '';
                wrapper.appendChild(img);
            }
            const div = document.createElement('div');
            div.className = 'song';
            div.innerText = found.song;
            div.onclick = () => {
                currentQueueIndex = idx;
                playSong(found.song, found.urls, found.image);
            };
            const dotsBtn = document.createElement('button');
            dotsBtn.className = 'song-dots';
            dotsBtn.innerHTML = '⋮';
            dotsBtn.onclick = (e) => {
                e.stopPropagation();
                showSongMenu(found, dotsBtn);
            };
            wrapper.appendChild(div);
            wrapper.appendChild(dotsBtn);
            list.appendChild(wrapper);
        } else {
            const div = document.createElement('div');
            div.className = 'song';
            div.innerText = songName;
            div.style.opacity = '0.5';
            list.appendChild(div);
        }
    });
}

// Logout confirmation
function logout() {
    document.getElementById('logoutConfirmModal').style.display = 'flex';
}

function closeLogoutConfirm(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('logoutConfirmModal').style.display = 'none';
}

function confirmLogout() {
    const keysToRemove = ['userId', 'fullName', 'email', 'adminStatus', 'token'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
}

// Open playlist and show songs
function openPlaylist(playlistName) {
    currentPlaylistName = playlistName;
    currentQueue = playlists[playlistName];
    document.getElementById('playlistTitle').innerText = playlistName;
    const songList = document.getElementById('songList');
    songList.innerHTML = '';
    currentQueue.forEach((songObj, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'song-wrapper';

        if (songObj.image) {
            const img = document.createElement('img');
            img.className = 'song-list-img';
            img.src = songObj.image;
            img.alt = '';
            wrapper.appendChild(img);
        }

        const songDiv = document.createElement('div');
        songDiv.className = 'song';
        songDiv.innerText = songObj.song;
        songDiv.onclick = () => {
            currentQueueIndex = index;
            playSong(songObj.song, songObj.urls, songObj.image);
        };

        wrapper.appendChild(songDiv);

        const dotsBtn = document.createElement('button');
        dotsBtn.className = 'song-dots';
        dotsBtn.innerHTML = '⋮';
        dotsBtn.onclick = (e) => {
            e.stopPropagation();
            pendingSongForPlaylist = songObj;
            currentPlaylistName = playlistName;
            showSongMenu(songObj, dotsBtn);
        };
        wrapper.appendChild(dotsBtn);

        songList.appendChild(wrapper);
    });

    document.getElementById('playlistSection').style.display = 'none';
    document.getElementById('songsSection').style.display = 'block';
    document.getElementById('favoritesSection').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
}

let pendingSongForPlaylist = null;

function populatePlaylistList(container, songObj) {
    container.innerHTML = '';
    const allNames = Object.keys(playlists);
    let hasCustom = false;
    allNames.forEach(name => {
        if (playlistMeta[name]?.isBuiltIn || playlistMeta[name]?.isGlobal) return;
        hasCustom = true;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = name;
        item.onclick = () => addSongToPlaylist(songObj, name);
        container.appendChild(item);
    });
    if (!hasCustom) {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = 'No custom playlists';
        item.style.opacity = '0.5';
        item.style.cursor = 'default';
        container.appendChild(item);
    }
}

function showPlayerMenu(e) {
    e.stopPropagation();
    const songObj = currentQueue[currentQueueIndex];
    if (!songObj) return;
    pendingSongForPlaylist = songObj;
    const dropdown = document.getElementById('playerDropdown');
    const rect = e.currentTarget.getBoundingClientRect();
    dropdown.style.display = 'block';
    dropdown.style.animation = 'none';
    const height = dropdown.offsetHeight;
    dropdown.style.top = (rect.top - height - 6) + 'px';
    dropdown.style.left = (rect.right - 180) + 'px';
    void dropdown.offsetWidth;
    dropdown.style.animation = 'fadeSlideIn 0.2s ease-out';
    closeSongMenu();
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('playerDropdown');
    if (dropdown.style.display !== 'none' && !dropdown.contains(e.target) && e.target.id !== 'playerDotsBtn') {
        dropdown.style.display = 'none';
    }
});

function openPlaylistPicker() {
    document.getElementById('playerDropdown').style.display = 'none';
    const modal = document.getElementById('playlistPickerModal');
    modal.style.display = 'flex';
    renderPlaylistPicker();
}

function closePlaylistPicker(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('playlistPickerModal').style.display = 'none';
}

function renderPlaylistPicker() {
    const container = document.getElementById('playlistPickerList');
    container.innerHTML = '';
    let hasCustom = false;
    Object.keys(playlists).forEach(name => {
        if (playlistMeta[name]?.isBuiltIn || playlistMeta[name]?.isGlobal) return;
        hasCustom = true;
        const item = document.createElement('div');
        item.className = 'playlist-picker-item';
        item.innerText = name;
        item.onclick = () => addCurrentSongToPlaylist(name);
        container.appendChild(item);
    });
    if (!hasCustom) {
        const item = document.createElement('div');
        item.className = 'playlist-picker-item';
        item.innerText = 'No custom playlists yet';
        item.style.opacity = '0.5';
        item.style.cursor = 'default';
        container.appendChild(item);
    }
}

function addCurrentSongToPlaylist(playlistName) {
    const songObj = pendingSongForPlaylist;
    if (!songObj) return;
    const exists = playlists[playlistName].some(s => s.song === songObj.song);
    if (exists) {
        showToast('Song already exists in this playlist.');
    } else {
        playlists[playlistName].push({ song: songObj.song, urls: songObj.urls });
        savePlaylists();
        showToast('Song added to playlist successfully.');
    }
    closePlaylistPicker();
}

function handleCreatePlaylist() {
    const input = document.getElementById('newPlaylistInput');
    const name = input.value.trim();
    if (!name) return;
    if (playlists[name]) {
        showToast('A playlist with that name already exists.');
        return;
    }
    playlists[name] = [];
    playlistMeta[name] = {
        coverImage: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBuiltIn: false
    };
    savePlaylists();
    renderPlaylists();
    renderPlaylistPicker();
    const songObj = pendingSongForPlaylist;
    if (songObj) {
        playlists[name].push({ song: songObj.song, urls: songObj.urls });
        savePlaylists();
        showToast('Song added to playlist successfully.');
    }
    closePlaylistPicker();
    input.value = '';
}

function handleCreatePlaylistKey(e) {
    if (e.key === 'Enter') {
        handleCreatePlaylist();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastIn 0.3s ease-out, toastOut 0.3s ease-in 2.2s forwards';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

function toggleFavoriteFromMenu() {
    const songObj = pendingSongForPlaylist;
    if (!songObj) return;
    const songName = typeof songObj === 'string' ? songObj : songObj.song;
    if (!songName) return;
    const favs = getFavorites();
    const idx = favs.indexOf(songName);
    if (idx === -1) {
        favs.push(songName);
        showToast('Added to favourites.');
    } else {
        favs.splice(idx, 1);
        showToast('Removed from favourites.');
    }
    saveFavorites(favs);
    updateHeartButton();
    document.getElementById('songMenuDropdown').style.display = 'none';
}

function showSongMenu(songObj, anchorBtn) {
    pendingSongForPlaylist = songObj;

    // Update favourites menu item text
    const songName = typeof songObj === 'string' ? songObj : songObj.song;
    const favItem = document.getElementById('favMenuItem');
    if (isFavorite(songName)) {
        favItem.innerHTML = '❤️ Remove from Favourites';
    } else {
        favItem.innerHTML = '❤️ Add to Favourites';
    }

    document.getElementById('speedSubmenu').style.display = 'none';
    document.getElementById('songSubPlaylistList').style.display = 'none';

    // Populate the "Add to Playlist" submenu
    populateSongPlaylistList(document.getElementById('songSubPlaylistList'));

    // Show "Delete Song" for custom playlists, and for global playlists if admin
    const adminEmail = localStorage.getItem('email');
    const isAdmin = adminEmail && (localStorage.getItem('adminStatus') === 'approved' || localStorage.getItem('adminStatus') === 'leader');
    const removeBtn = document.getElementById('removeFromPlaylistBtn');
    const isCustom = currentPlaylistName && !playlistMeta[currentPlaylistName]?.isBuiltIn && !playlistMeta[currentPlaylistName]?.isGlobal;
    const isGlobal = currentPlaylistName && playlistMeta[currentPlaylistName]?.isGlobal;
    const isBuiltIn = currentPlaylistName && playlistMeta[currentPlaylistName]?.isBuiltIn;
    removeBtn.style.display = (isCustom || (isGlobal && isAdmin) || (isBuiltIn && isAdmin)) ? 'block' : 'none';

    const dropdown = document.getElementById('songMenuDropdown');
    const rect = anchorBtn.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.display = 'block';
    const height = dropdown.offsetHeight;
    dropdown.style.top = (rect.top - height - 4) + 'px';
    dropdown.style.left = (rect.right - 160) + 'px';
}

function toggleSongPlaylistSubmenu() {
    const sub = document.getElementById('songSubPlaylistList');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function populateSongPlaylistList(container) {
    container.innerHTML = '';
    const allNames = Object.keys(playlists);
    let hasCustom = false;
    allNames.forEach(name => {
        if (playlistMeta[name]?.isBuiltIn || playlistMeta[name]?.isGlobal) return;
        hasCustom = true;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = name;
        item.onclick = () => {
            addSongToPlaylist(pendingSongForPlaylist, name);
            closeSongMenu();
        };
        container.appendChild(item);
    });
    if (!hasCustom) {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = 'No custom playlists';
        item.style.opacity = '0.5';
        item.style.cursor = 'default';
        container.appendChild(item);
    }
}

function closeSongMenu(e) {
    const dropdown = document.getElementById('songMenuDropdown');
    if (!dropdown || dropdown.style.display === 'none') return;
    if (e && dropdown.contains(e.target)) return;
    dropdown.style.display = 'none';
    document.getElementById('speedSubmenu').style.display = 'none';
    document.getElementById('songSubPlaylistList').style.display = 'none';
}

// Fullscreen player dropdown
function toggleFullscreenMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('fsMenuDropdown');
    const isOpen = dropdown.style.display === 'block';
    closeSongMenu();
    closeFullscreenMenu();
    if (!isOpen) {
        dropdown.style.display = 'block';
        populateFsPlaylistList(document.getElementById('fsSubPlaylistList'));
    }
}

function closeFullscreenMenu(e) {
    const dropdown = document.getElementById('fsMenuDropdown');
    if (!dropdown || dropdown.style.display === 'none') return;
    if (e && dropdown.contains(e.target)) return;
    dropdown.style.display = 'none';
    document.getElementById('fsSpeedSubmenu').style.display = 'none';
    document.getElementById('fsSubPlaylistList').style.display = 'none';
}

function toggleFsPlaylistSubmenu() {
    const sub = document.getElementById('fsSubPlaylistList');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function populateFsPlaylistList(container) {
    container.innerHTML = '';
    const allNames = Object.keys(playlists);
    let hasCustom = false;
    allNames.forEach(name => {
        if (playlistMeta[name]?.isBuiltIn || playlistMeta[name]?.isGlobal) return;
        hasCustom = true;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = name;
        item.onclick = () => {
            addSongToPlaylist(pendingSongForPlaylist || currentQueue[currentQueueIndex], name);
            closeFullscreenMenu();
        };
        container.appendChild(item);
    });
    if (!hasCustom) {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = 'No custom playlists';
        item.style.opacity = '0.5';
        item.style.cursor = 'default';
        container.appendChild(item);
    }
}

function toggleFsSpeedSubmenu() {
    const sub = document.getElementById('fsSpeedSubmenu');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function setPlaySpeedFromFs(speed) {
    if (localAudio) {
        localAudio.playbackRate = speed;
    }
    closeFullscreenMenu();
    showToast('Speed set to ' + speed + 'x');
}

async function fsDownloadCurrentSong() {
    const songObj = pendingSongForPlaylist || currentQueue[currentQueueIndex];
    if (!songObj) return;
    closeFullscreenMenu();
    try {
        const url = songObj.urls[0];
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        const fullUrl = url.startsWith('http') ? url : base + '/' + url;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = songObj.song.replace(/[^\w\s-]/g, '') + '.mp3';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 2000);
        showToast('Downloaded ' + songObj.song);
    } catch (e) {
        showToast('Download failed: ' + e.message);
    }
}

document.addEventListener('click', closeSongMenu);
document.addEventListener('click', closeFullscreenMenu);
document.addEventListener('click', function(e) {
    if (!e.target.closest('.playlist-dots') && !e.target.closest('#playlistCardDropdown')) {
        closePlaylistCardMenu();
    }
});

function toggleMiniMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('miniMenuDropdown');
    const isOpen = dropdown.style.display === 'block';
    closeMiniMenu();
    if (!isOpen) {
        const btn = document.getElementById('miniDotsBtn');
        const rect = btn.getBoundingClientRect();
        dropdown.style.display = 'block';
        dropdown.style.position = 'fixed';
        dropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right + 40) + 'px';
        populateMiniPlaylistList(document.getElementById('miniSubPlaylistList'));
    }
}

function closeMiniMenu(e) {
    const dropdown = document.getElementById('miniMenuDropdown');
    if (!dropdown || dropdown.style.display === 'none') return;
    if (e && dropdown.contains(e.target)) return;
    dropdown.style.display = 'none';
    document.getElementById('miniSpeedSubmenu').style.display = 'none';
    document.getElementById('miniSubPlaylistList').style.display = 'none';
}

function toggleMiniPlaylistSubmenu() {
    const sub = document.getElementById('miniSubPlaylistList');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function populateMiniPlaylistList(container) {
    container.innerHTML = '';
    const allNames = Object.keys(playlists);
    let hasCustom = false;
    allNames.forEach(name => {
        if (playlistMeta[name]?.isBuiltIn || playlistMeta[name]?.isGlobal) return;
        hasCustom = true;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = name;
        item.onclick = () => {
            const songObj = pendingSongForPlaylist || currentQueue[currentQueueIndex];
            if (songObj) {
                const exists = playlists[name].some(s => s.song === songObj.song);
                if (exists) {
                    showToast('Song already exists in this playlist.');
                } else {
                    playlists[name].push({ song: songObj.song, urls: songObj.urls });
                    savePlaylists();
                    showToast('Song added to playlist.');
                }
            }
            closeMiniMenu();
        };
        container.appendChild(item);
    });
    if (!hasCustom) {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerText = 'No custom playlists';
        item.style.opacity = '0.5';
        item.style.cursor = 'default';
        container.appendChild(item);
    }
}

function toggleMiniSpeedSubmenu() {
    const sub = document.getElementById('miniSpeedSubmenu');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', closeMiniMenu);

function togglePlaylistSubmenu() {
    const sub = document.getElementById('subPlaylistList');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function addSongToPlaylist(songObj, playlistName) {
    const exists = playlists[playlistName].some(s => s.song === songObj.song);
    if (exists) {
        alert('Song already exists in this playlist.');
    } else {
        playlists[playlistName].push({ song: songObj.song, urls: songObj.urls, image: songObj.image || '' });
        savePlaylists();
        // Sync to server for user playlists
        const meta = playlistMeta[playlistName];
        const userId = localStorage.getItem('userId');
        if (meta?.globalId && !meta?.isGlobal && !meta?.isBuiltIn && userId) {
            const url = songObj.urls?.[0];
            if (!url || !url.trim()) return;
            fetch(`${API_ROOT}/api/playlist/user-add-song`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId: meta.globalId, songName: songObj.song, songUrl: url, songImage: songObj.image || '' })
            }).catch(() => {});
        }
    }
    closeSongMenu();
}

function showDeleteSongConfirmation() {
    if (!pendingSongForPlaylist || !currentPlaylistName) return;
    if (playlistMeta[currentPlaylistName]?.isBuiltIn) {
        const adminStatus = localStorage.getItem('adminStatus');
        const isAdmin = adminStatus === 'approved' || adminStatus === 'leader';
        if (!isAdmin) {
            showToast('Cannot edit a built-in playlist.');
            return;
        }
    }
    const songName = pendingSongForPlaylist.song;
    const modal = document.getElementById('playlistActionModal');
    document.getElementById('playlistActionTitle').textContent = '🗑️ Delete Song';
    document.getElementById('playlistActionBody').innerHTML = `
        <div style="text-align:center;padding:8px 0;">
            <div style="font-size:3em;margin-bottom:12px;">⚠️</div>
            <p style="color:#fff;font-size:1.1em;margin-bottom:4px;">Are you sure you want to delete</p>
            <p style="color:#ff4444;font-weight:700;font-size:1.2em;margin-bottom:16px;">"${songName}"?</p>
            <p style="color:#b3b3b3;font-size:0.85em;margin-bottom:20px;">This song will be removed from the playlist "${currentPlaylistName}".</p>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button class="timer-btn" onclick="cancelDelete()" style="flex:1;">Cancel</button>
                <button class="timer-btn" onclick="confirmDeleteSong()" style="flex:1;background:#ff4444;color:#fff;border-color:#ff4444;">Delete</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    closeSongMenu();
}

async function confirmDeleteSong() {
    if (!pendingSongForPlaylist || !currentPlaylistName) return;
    const songName = pendingSongForPlaylist.song;
    const meta = playlistMeta[currentPlaylistName];
    const adminEmail = localStorage.getItem('email');
    const adminStatus = localStorage.getItem('adminStatus');
    const isAdmin = adminEmail && (adminStatus === 'approved' || adminStatus === 'leader');
    const userId = localStorage.getItem('userId');

    console.log('[DELETE SONG] confirmDeleteSong called', {
        songName,
        currentPlaylistName,
        adminEmail,
        isAdmin,
        userId,
        meta
    });

    // For built-in playlists, sync to server first if admin
    if (meta?.isBuiltIn && isAdmin) {
        console.log('[DELETE SONG] Syncing built-in playlist to server');
        try {
            const glResp = await fetch(`${API_ROOT}/api/playlist/global`);
            if (glResp.ok) {
                const glData = await glResp.json();
                let glEntry = glData.find(p => p.playlistName === currentPlaylistName);
                if (!glEntry) {
                    console.log('[DELETE SONG] Creating global playlist for built-in:', currentPlaylistName);
                    const crResp = await fetch(`${API_ROOT}/api/playlist/admin-create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminEmail, playlistName: currentPlaylistName, coverImage: meta.coverImage || '' })
                    });
                    const crData = await crResp.json();
                    if (crResp.ok && crData.playlist) {
                        glEntry = crData.playlist;
                        const existingSongs = playlists[currentPlaylistName] || [];
                        for (const s of existingSongs) {
                            const url = s.urls?.[0];
                            if (!url || !url.trim()) continue;
                            await fetch(`${API_ROOT}/api/playlist/admin-add-song-url`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminEmail, playlistId: glEntry._id, songName: s.song, songUrl: url, songImage: s.image || '' })
                            }).catch(() => {});
                        }
                    }
                }
                if (glEntry) {
                    playlistMeta[currentPlaylistName].globalId = glEntry._id;
                    playlistMeta[currentPlaylistName].isGlobal = true;
                    playlistMeta[currentPlaylistName].isBuiltIn = false;
                }
            }
        } catch (e) {
            console.error('[DELETE SONG] Built-in sync error:', e);
        }
    }

    const updatedMeta = playlistMeta[currentPlaylistName];
    let success = false;

    if (updatedMeta?.isGlobal) {
        const playlistId = updatedMeta.globalId;
        const url = `${API_ROOT}/api/playlist/admin-remove-song`;
        const body = { adminEmail, playlistId, songName };
        console.log('[DELETE SONG] Sending request to:', url, 'method: POST', 'body:', body);

        if (adminEmail && playlistId) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                console.log('[DELETE SONG] Response status:', resp.status);
                const data = await resp.json();
                console.log('[DELETE SONG] Response body:', data);
                if (data.success) {
                    success = true;
                } else {
                    console.warn('[DELETE SONG] Backend returned error:', data.message);
                    success = true;
                }
            } catch (e) {
                console.error('[DELETE SONG] Request failed (deleting locally anyway):', e);
                success = true;
            }
                } else {
                    console.warn('[DELETE SONG] Backend returned error:', data.message);
                    success = true;
                }

    } else if (updatedMeta?.globalId && !updatedMeta?.isBuiltIn) {
        const playlistId = updatedMeta.globalId;
        const url = `${API_ROOT}/api/playlist/user-remove-song`;
        const body = { userId, playlistId, songName };
        console.log('[DELETE SONG] Sending request to:', url, 'method: POST', 'body:', body);

        if (userId && playlistId) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                console.log('[DELETE SONG] Response status:', resp.status);
                const data = await resp.json();
                console.log('[DELETE SONG] Response body:', data);
                if (data.success) {
                    success = true;
                } else {
                    console.warn('[DELETE SONG] Backend returned error:', data.message);
                    success = true;
                }
            } catch (e) {
                console.error('[DELETE SONG] Request failed (deleting locally anyway):', e);
                success = true;
            }
        } else {
            console.warn('[DELETE SONG] Missing userId or playlistId for user playlist, deleting locally');
            success = true;
        }
    } else {
        console.log('[DELETE SONG] Local-only playlist, removing locally');
        success = true;
    }

    if (success) {
        console.log('[DELETE SONG] Delete succeeded, updating local state');
        const arr = playlists[currentPlaylistName];
        if (arr) {
            const idx = arr.findIndex(s => s.song === songName);
            if (idx !== -1) {
                arr.splice(idx, 1);
                savePlaylists();
                console.log('[DELETE SONG] Song removed from local array');
            }
        }

        cancelDelete();

        // If the deleted song is currently playing, stop and reset player
        if (currentSongTitle === songName) {
            console.log('[DELETE SONG] Deleted song was playing, stopping playback');
            stopPlayback();
            currentSongTitle = '';
            currentQueue = [];
            currentQueueIndex = -1;
            document.getElementById('miniPlayer').style.display = 'none';
            document.querySelector('.main-container').style.paddingBottom = '';
            updateHeartButton();
        }

        // Immediately remove from the displayed song list
        if (document.getElementById('songsSection').style.display === 'block') {
            openPlaylist(currentPlaylistName);
            console.log('[DELETE SONG] Playlist view refreshed');
        }

        showToast('Song deleted successfully.');
        console.log('[DELETE SONG] Done');
    }
}

function toggleSpeedSubmenu() {
    const sub = document.getElementById('speedSubmenu');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

function setPlaySpeed(speed) {
    if (localAudio) {
        localAudio.playbackRate = speed;
    }
    document.getElementById('songMenuDropdown').style.display = 'none';
    document.getElementById('speedSubmenu').style.display = 'none';
}

async function downloadCurrentSong() {
    const songObj = pendingSongForPlaylist || currentQueue[currentQueueIndex];
    if (!songObj) return;
    document.getElementById('songMenuDropdown').style.display = 'none';
    closeMiniMenu();
    try {
        const url = songObj.urls[0];
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        const fullUrl = url.startsWith('http') ? url : base + '/' + url;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = songObj.song.replace(/[^\w\s-]/g, '') + '.mp3';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 2000);
        showToast('Downloaded ' + songObj.song);
    } catch (e) {
        showToast('Download failed: ' + e.message);
    }
}

let soundCloudWidget = null;
let currentQueue = [];
let currentQueueIndex = -1;
let localAudio = null;
let isPlaying = false;
let isShuffled = false;
let repeatMode = 0; // 0 = none, 1 = all, 2 = one
let currentVolume = 0.7;
let isMuted = false;
let savedVolume = 0.7;
let progressInterval = null;

const hiddenAudio = document.getElementById('hiddenAudio');

function playSong(songTitle, songUrls, songImage) {
    currentSongTitle = songTitle || '';
    updateHeartButton();

    const url = songUrls[0];

    if (url.startsWith('/') || url.startsWith('music/') || url.match(/\.(mp3|mpeg|wav|ogg|aac|flac|webm)$/i)) {
        const soundCloudPlayer = document.getElementById('soundCloudPlayer');
        soundCloudPlayer.innerHTML = '';
        hiddenAudio.src = url;
        hiddenAudio.load();
        hiddenAudio.volume = currentVolume;
        localAudio = hiddenAudio;
        isPlaying = true;
        hiddenAudio.play();
        updateMiniPlayer(songTitle, songImage);
        showMiniPlayer();
        updatePlayPauseButtons();

        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(updateProgress, 250);

        hiddenAudio.onended = () => {
            isPlaying = false;
            updatePlayPauseButtons();
            if (repeatMode === 2) {
                hiddenAudio.currentTime = 0;
                hiddenAudio.play();
                isPlaying = true;
                updatePlayPauseButtons();
            } else {
                playNextInQueue();
            }
        };

        hiddenAudio.onloadedmetadata = () => {
            updateProgress();
        };

        hiddenAudio.onerror = () => {
            isPlaying = false;
            updatePlayPauseButtons();
            showToast(`Failed to play "${songTitle}". Check that the file or link is accessible.`);
        };

        hiddenAudio.play().catch(() => {
            isPlaying = false;
            updatePlayPauseButtons();
            showToast(`Cannot play "${songTitle}". The file may be missing or the link may not support direct playback.`);
        });
    } else if (!soundCloudWidget) {
        document.getElementById('soundCloudPlayer').innerHTML = `<iframe id="scWidget" scrolling="no" frameborder="no"
                src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&amp;auto_play=true&amp;hide_related=true&amp;visual=false&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false&amp;show_teaser=false&amp;liking=false&amp;sharing=false">
        </iframe>`;
        const iframe = document.getElementById('scWidget');
        iframe.onload = () => {
            soundCloudWidget = SC.Widget(iframe);
            soundCloudWidget.bind(SC.Widget.Events.READY, () => {
                soundCloudWidget.play();
                isPlaying = true;
                updatePlayPauseButtons();
            });
            soundCloudWidget.bind(SC.Widget.Events.FINISH, () => {
                isPlaying = false;
                updatePlayPauseButtons();
                playNextInQueue();
            });
        };
        updateMiniPlayer(songTitle, songImage);
        showMiniPlayer();
    } else {
        soundCloudWidget.load(url, {
            auto_play: true,
            show_comments: false,
            show_user: false,
            show_reposts: false,
            show_teaser: false,
            liking: false,
            sharing: false,
            visual: false,
            hide_related: true
        });
        isPlaying = true;
        updatePlayPauseButtons();
        updateMiniPlayer(songTitle, songImage);
        showMiniPlayer();
    }

    const songName = songTitle || 'Unknown song';
    recentSongsHistory = recentSongsHistory.filter(s => s !== songName);
    recentSongsHistory.unshift(songName);
    if (recentSongsHistory.length > 5) {
        recentSongsHistory.pop();
    }

    const storageKey = getRecentSongsStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(recentSongsHistory));
    renderRecentSongs();
}

function togglePlayPause() {
    if (localAudio && localAudio.src) {
        if (isPlaying) {
            localAudio.pause();
            isPlaying = false;
        } else {
            localAudio.play();
            isPlaying = true;
        }
        updatePlayPauseButtons();
    } else if (soundCloudWidget) {
        soundCloudWidget.getPaused((paused) => {
            if (paused) {
                soundCloudWidget.play();
                isPlaying = true;
            } else {
                soundCloudWidget.pause();
                isPlaying = false;
            }
            updatePlayPauseButtons();
        });
    }
}

function updatePlayPauseButtons() {
    const btn = document.getElementById('playPauseBtn');
    const fsBtn = document.getElementById('fsPlayPauseBtn');
    const icon = isPlaying ? '⏸' : '▶️';
    if (btn) btn.textContent = icon;
    if (fsBtn) fsBtn.textContent = icon;
}

function showMiniPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    miniPlayer.style.display = 'flex';
    document.querySelector('.main-container').style.paddingBottom = '90px';
}

function updateMiniPlayer(songTitle, songImage) {
    const titleEl = document.getElementById('miniPlayerTitle');
    const artistEl = document.getElementById('miniPlayerArtist');
    const imgEl = document.getElementById('miniPlayerImg');
    const fsTitle = document.getElementById('fullscreenTitle');
    const fsArtist = document.getElementById('fullscreenArtist');
    const fsArt = document.getElementById('fullscreenArt');

    titleEl.textContent = songTitle || 'No song playing';
    fsTitle.textContent = songTitle || 'No song playing';
    artistEl.textContent = 'My Music';
    fsArtist.textContent = 'My Music';

    if (songImage) {
        imgEl.innerHTML = '<img src="' + songImage + '" alt="cover">';
        fsArt.innerHTML = '<img src="' + songImage + '" alt="cover">';
    } else {
        imgEl.textContent = '🎵';
        fsArt.textContent = '🎵';
    }
}

function updateProgress() {
    if (!localAudio || !localAudio.duration) return;
    const current = localAudio.currentTime;
    const duration = localAudio.duration;
    const pct = (current / duration) * 100 || 0;

    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('fsProgressFill').style.width = pct + '%';
    document.getElementById('currentTimeDisplay').textContent = formatTime(current);
    document.getElementById('durationDisplay').textContent = formatTime(duration);
    document.getElementById('fsCurrentTime').textContent = formatTime(current);
    document.getElementById('fsDuration').textContent = formatTime(duration);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function seekTo(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (localAudio && localAudio.duration) {
        localAudio.currentTime = pct * localAudio.duration;
        updateProgress();
    } else if (soundCloudWidget) {
        soundCloudWidget.getDuration((dur) => {
            soundCloudWidget.seekTo(pct * dur);
        });
    }
}

function setVolumeFromClick(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    currentVolume = pct;
    isMuted = false;
    if (localAudio) localAudio.volume = pct;
    updateVolumeUI();
}

function toggleMute() {
    if (isMuted) {
        currentVolume = savedVolume || 0.7;
        isMuted = false;
    } else {
        savedVolume = currentVolume;
        currentVolume = 0;
        isMuted = true;
    }
    if (localAudio) localAudio.volume = currentVolume;
    updateVolumeUI();
}

function updateVolumeUI() {
    const pct = (currentVolume * 100) || 0;
    document.getElementById('volumeFill').style.width = pct + '%';
    document.getElementById('fsVolumeFill').style.width = pct + '%';
    const muteBtn = document.getElementById('muteBtn');
    const fsMuteBtn = document.getElementById('fsMuteBtn');
    const icon = isMuted || currentVolume === 0 ? '🔇' : currentVolume < 0.5 ? '🔉' : '🔊';
    muteBtn.textContent = icon;
    fsMuteBtn.textContent = icon;
    muteBtn.classList.toggle('muted', isMuted);
    fsMuteBtn.classList.toggle('muted', isMuted);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    document.getElementById('shuffleBtn').classList.toggle('shuffle-active', isShuffled);
    document.getElementById('fsShuffleBtn').classList.toggle('shuffle-active', isShuffled);
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const modes = ['🔁', '🔁', '🔂'];
    const labels = ['Repeat off', 'Repeat all', 'Repeat one'];
    const rptBtn = document.getElementById('repeatBtn');
    const fsRptBtn = document.getElementById('fsRepeatBtn');
    rptBtn.textContent = modes[repeatMode];
    fsRptBtn.textContent = modes[repeatMode];
    rptBtn.title = labels[repeatMode];
    fsRptBtn.title = labels[repeatMode];
    rptBtn.classList.toggle('repeat-active', repeatMode > 0);
    fsRptBtn.classList.toggle('repeat-active', repeatMode > 0);
    rptBtn.classList.toggle('repeat-one', repeatMode === 2);
    fsRptBtn.classList.toggle('repeat-one', repeatMode === 2);
}

function openFullscreenPlayer() {
    const overlay = document.getElementById('fullscreenPlayer');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateProgress();
}

function closeFullscreenPlayer(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('fullscreenPlayer');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function skipBack10() {
    if (localAudio && localAudio.duration) {
        localAudio.currentTime = Math.max(0, localAudio.currentTime - 10);
        updateProgress();
    } else if (soundCloudWidget) {
        soundCloudWidget.getPosition((pos) => {
            soundCloudWidget.seekTo(Math.max(0, pos - 10000));
        });
    }
}

function skipForward10() {
    if (localAudio && localAudio.duration) {
        localAudio.currentTime = Math.min(localAudio.duration, localAudio.currentTime + 10);
        updateProgress();
    } else if (soundCloudWidget) {
        soundCloudWidget.getPosition((pos) => {
            soundCloudWidget.getDuration((dur) => {
                soundCloudWidget.seekTo(Math.min(dur, pos + 10000));
            });
        });
    }
}

function playNextInQueue() {
    if (currentQueue.length === 0) return;
    let nextIndex;
    if (isShuffled) {
        nextIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
        nextIndex = currentQueueIndex + 1;
        if (nextIndex >= currentQueue.length) {
            if (repeatMode === 1) {
                nextIndex = 0;
            } else {
                return;
            }
        }
    }
    currentQueueIndex = nextIndex;
    const next = currentQueue[nextIndex];
    playSong(next.song, next.urls, next.image);
}

function playNext() {
    playNextInQueue();
}

function playPrevious() {
    if (recentSongsHistory.length < 2) return;
    const lastSongName = recentSongsHistory[1];
    for (const playlistName in playlists) {
        const songObj = playlists[playlistName].find(s => s.song === lastSongName);
        if (songObj) {
            const idx = playlists[playlistName].indexOf(songObj);
            currentQueue = playlists[playlistName];
            currentQueueIndex = idx;
            playSong(songObj.song, songObj.urls, songObj.image);
            return;
        }
    }
}

function stopPlayback() {
    if (localAudio) {
        localAudio.pause();
        isPlaying = false;
        updatePlayPauseButtons();
    }
    if (soundCloudWidget) {
        soundCloudWidget.pause();
        isPlaying = false;
        updatePlayPauseButtons();
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function renderRecentSongs() {
    const recentSection = document.getElementById('recentSection');
    const recentSongsQueue = document.getElementById('recentSongsQueue');

    if (recentSongsHistory.length === 0) {
        recentSection.style.display = 'none';
        return;
    }

    recentSection.style.display = 'block';
    recentSongsQueue.innerHTML = '';

    recentSongsHistory.forEach((song, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';

        const songBox = document.createElement('div');
        songBox.className = 'recent-song-box';
        songBox.innerText = song;
        songBox.title = song;
        songBox.style.cursor = 'pointer';
        songBox.style.flex = '1';
        songBox.style.borderRadius = '8px 0 0 8px';
        
        // Find the song in playlists
        let foundSong = null;
        let foundPlaylist = null;
        for (const playlistName in playlists) {
            const songObj = playlists[playlistName].find(s => s.song === song);
            if (songObj) {
                foundSong = songObj;
                foundPlaylist = playlistName;
                break;
            }
        }
        
        songBox.onclick = () => {
            if (foundSong) {
                currentQueue = playlists[foundPlaylist];
                currentQueueIndex = playlists[foundPlaylist].indexOf(foundSong);
                playSong(foundSong.song, foundSong.urls, foundSong.image);
            }
        };
        
        wrapper.appendChild(songBox);

        recentSongsQueue.appendChild(wrapper);
    });
}

// ==================== ACCOUNT & PRIVACY ====================

function showAccountPrivacyView() {
    document.getElementById('settingsMainView').style.display = 'none';
    document.getElementById('accountPrivacyView').style.display = 'block';
    closeAllAccordions();
}

function closeAllAccordions() {
    document.querySelectorAll('.acc-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('active'));
}

function toggleAccordion(panelId, headerEl) {
    const panel = document.getElementById(panelId);
    const isOpen = panel.style.display === 'block';

    closeAllAccordions();

    if (!isOpen) {
        panel.style.display = 'block';
        headerEl.classList.add('active');

        if (panelId === 'accUsernamePanel') {
            const name = localStorage.getItem('fullName') || '';
            document.getElementById('currentUsernameDisplay').textContent = name;
            document.getElementById('newUsernameInput').value = name;
        } else if (panelId === 'accPasswordPanel') {
            document.getElementById('currentPasswordInput').value = '';
            document.getElementById('newPasswordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
        } else if (panelId === 'accEmailPanel') {
            document.getElementById('currentEmailDisplay').textContent = localStorage.getItem('email') || '';
            document.getElementById('newEmailInput').value = '';
            document.getElementById('emailPasswordInput').value = '';
            document.getElementById('otpInput').value = '';
            document.getElementById('otpHint').style.display = 'none';
        }
    }
}

async function saveUsername() {
    const userId = localStorage.getItem('userId');
    const newName = document.getElementById('newUsernameInput').value.trim();
    if (!newName) {
        showToast('Please enter a username.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/update-username`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fullName: newName })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('fullName', newName);
            document.getElementById('userFullName').textContent = newName;
            document.getElementById('currentUsernameDisplay').textContent = newName;
            showToast(data.message);
        } else {
            showToast(data.message);
        }
    } catch (error) {
        showToast('Failed to update username.');
    }
}

async function savePassword() {
    const userId = localStorage.getItem('userId');
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('All fields are required.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPassword, newPassword, confirmPassword })
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message);
            document.getElementById('currentPasswordInput').value = '';
            document.getElementById('newPasswordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
        } else {
            showToast(data.message);
        }
    } catch (error) {
        showToast('Failed to change password.');
    }
}

async function saveEmail() {
    const userId = localStorage.getItem('userId');
    const newEmail = document.getElementById('newEmailInput').value.trim();
    const password = document.getElementById('emailPasswordInput').value;
    if (!newEmail || !password) {
        showToast('Please fill in all fields.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/change-email`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newEmail, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('email', data.email);
            showToast(data.message);
            document.getElementById('currentEmailDisplay').textContent = data.email;
            document.getElementById('newEmailInput').value = '';
            document.getElementById('emailPasswordInput').value = '';
        } else {
            showToast(data.message);
        }
    } catch (error) {
        showToast('Failed to change email.');
    }
}

async function saveDeleteAccount() {
    const userId = localStorage.getItem('userId');
    const password = document.getElementById('deletePasswordInput').value;
    if (!password) {
        showToast('Please enter your password to confirm.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/delete-account`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });
        const data = await response.json();
        if (response.ok) {
            clearUserData();
            showToast('Account deleted successfully.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            showToast(data.message);
        }
    } catch (error) {
        showToast('Failed to delete account.');
    }
}

// Search songs
function searchSongs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const songList = document.getElementById('songList');
    const searchResults = document.getElementById('searchResults');
    const playlistSection = document.getElementById('playlistSection');
    
    if (!searchTerm.trim()) {
        songList.innerHTML = '';
        searchResults.style.display = 'none';
        document.getElementById('songsSection').style.display = 'none';
        playlistSection.style.display = 'block';
        return;
    }

    songList.innerHTML = '';
    currentQueue = [];
    let found = false;

    // Search through all playlists
    Object.keys(playlists).forEach(playlistName => {
        playlists[playlistName].forEach(songObj => {
            if (songObj.song.toLowerCase().includes(searchTerm)) {
                found = true;
                currentQueue.push(songObj);
                const index = currentQueue.length - 1;
                const wrapper = document.createElement('div');
                wrapper.className = 'song-wrapper';
                if (songObj.image) {
                    const img = document.createElement('img');
                    img.className = 'song-list-img';
                    img.src = songObj.image;
                    img.alt = '';
                    wrapper.appendChild(img);
                }
                const songDiv = document.createElement('div');
                songDiv.className = 'song';
                songDiv.innerText = songObj.song;
                songDiv.onclick = () => {
                    currentQueueIndex = index;
                    playSong(songObj.song, songObj.urls, songObj.image);
                };
                const dotsBtn = document.createElement('button');
                dotsBtn.className = 'song-dots';
                dotsBtn.innerHTML = '⋮';
                dotsBtn.onclick = (e) => {
                    e.stopPropagation();
                    showSongMenu(songObj, dotsBtn);
                };
                wrapper.appendChild(songDiv);
                wrapper.appendChild(dotsBtn);
                songList.appendChild(wrapper);
            }
        });
    });

    if (found) {
        searchResults.style.display = 'none';
        document.getElementById('songsSection').style.display = 'block';
        playlistSection.style.display = 'none';
    } else {
        searchResults.style.display = 'block';
        searchResults.innerText = 'No Results Found';
        document.getElementById('songsSection').style.display = 'none';
        playlistSection.style.display = 'none';
    }
}
