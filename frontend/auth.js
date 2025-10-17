const API_URL = 'http://localhost:3000/api';

// Get user's encryption key from localStorage
function getUserEncryptionKey() {
    const key = localStorage.getItem('encryptionKey');
    if (!key) {
        console.error('No encryption key found. Please log in again.');
        logout();
        return null;
    }
    return key;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('encryptionKey');
    window.location.href = 'login.html';
}

// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

// Display username
document.getElementById('userName').textContent = localStorage.getItem('userName');

// AES encryption helper using user's encryption key
function encryptText(text) {
    const encryptionKey = getUserEncryptionKey();
    if (!encryptionKey) return text;
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

// AES decryption helper using user's encryption key
function decryptText(cipherText) {
    try {
        const encryptionKey = getUserEncryptionKey();
        if (!encryptionKey) return '[Encrypted]';
        const bytes = CryptoJS.AES.decrypt(cipherText, encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '[Encrypted]';
    }
}

// Fetch and display notes
async function fetchNotes() {
    try {
        const response = await fetch(`${API_URL}/notes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const notes = await response.json();

        // ✅ Decrypt notes before displaying
        const decryptedNotes = notes.map(note => ({
            ...note,
            title: decryptText(note.title),
            content: decryptText(note.content)
        }));

        displayNotes(decryptedNotes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        document.getElementById('notesTableBody').innerHTML = `
            <tr><td colspan="5" style="text-align: center;">Error loading notes. Please try again.</td></tr>
        `;
    }
}

// Display notes in table
function displayNotes(notes) {
    const notesTableBody = document.getElementById('notesTableBody');
    
    if (notes.length === 0) {
        notesTableBody.innerHTML = `
            <tr><td colspan="5" style="text-align: center;">No notes yet. Create your first note!</td></tr>
        `;
        return;
    }

    notesTableBody.innerHTML = notes.map((note, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${note.title}</td>
            <td>${note.content}</td>
            <td>${new Date(note.createdAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn-edit" onclick="editNote('${note._id}', '${note.title}', '${note.content}')">✏️</button>
                <button class="btn-delete" onclick="showDeleteModal('${note._id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Save new note
async function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    // ✅ Encrypt before sending
    const encryptedTitle = encryptText(title);
    const encryptedContent = encryptText(content);

    try {
        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                title: encryptedTitle, 
                content: encryptedContent 
            })
        });

        if (response.ok) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            fetchNotes();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || 'Failed to save note'}`);
        }
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Error saving note. Please try again.');
    }
}

// Show delete confirmation modal
let noteIdToDelete = null;

function showDeleteModal(id) {
    noteIdToDelete = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Close delete modal
function closeDeleteModal() {
    noteIdToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

// Confirm and delete note
async function confirmDelete() {
    if (!noteIdToDelete) return;

    try {
        const response = await fetch(`${API_URL}/notes/${noteIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            closeDeleteModal();
            fetchNotes();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || 'Failed to delete note'}`);
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note. Please try again.');
    }
}

// Edit note
function editNote(id, title, content) {
    document.getElementById('noteTitle').value = title;
    document.getElementById('noteContent').value = content;

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = '💾 Update Note';
    saveBtn.onclick = () => updateNote(id);
}

// Update existing note
async function updateNote(id) {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    // ✅ Encrypt before updating
    const encryptedTitle = encryptText(title);
    const encryptedContent = encryptText(content);

    try {
        const response = await fetch(`${API_URL}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                title: encryptedTitle, 
                content: encryptedContent 
            })
        });

        if (response.ok) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = '💾 Save Note';
            saveBtn.onclick = saveNote;
            fetchNotes();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || 'Failed to update note'}`);
        }
    } catch (error) {
        console.error('Error updating note:', error);
        alert('Error updating note. Please try again.');
    }
}

// Show logout modal
function showLogoutModal() {
    document.getElementById('logoutModal').style.display = 'flex';
}

// Close logout modal
function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

// Confirm logout
function confirmLogout() {
    logout();
}


// Initial fetch
fetchNotes();
