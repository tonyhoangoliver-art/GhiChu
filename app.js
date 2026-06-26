let notes = [];
let currentNoteId = null;
let selectedColor = '#FFFFFF';
let currentSort = 'default';

const notesGrid = document.getElementById('notesGrid');
const noteEditor = document.getElementById('noteEditor');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const COLORS = {
  '#FFFFFF': '#fff',
  '#F28B82': '#fce8e6',
  '#FABF8F': '#fef7e3',
  '#FFF799': '#fef9dc',
  '#C2F5AF': '#edebd7',
  '#AECBFA': '#e8eaed',
  '#D9A8F7': '#eaf1fb',
  '#FDCFE8': '#fceede'
};

document.addEventListener('DOMContentLoaded', () => {
  loadSortPreference();
  loadNotes();
  renderNotes();
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadSortPreference() {
  const storedSort = localStorage.getItem('keep-sort');
  if (storedSort) {
    currentSort = storedSort;
  }
  sortSelect.value = currentSort;
}

function saveSortPreference() {
  localStorage.setItem('keep-sort', currentSort);
}

function changeSort() {
  currentSort = sortSelect.value;
  saveSortPreference();
  renderNotes(searchInput.value.toLowerCase().trim());
}

function loadNotes() {
  const stored = localStorage.getItem('keep-notes');
  if (stored) {
    notes = JSON.parse(stored);
  }
}

function saveNotes() {
  localStorage.setItem('keep-notes', JSON.stringify(notes));
}

function createNote() {
  currentNoteId = null;
  selectedColor = '#FFFFFF';
  noteTitle.value = '';
  noteContent.value = '';
  
  const editorContainer = noteEditor.querySelector('.editor-container');
  editorContainer.style.backgroundColor = COLORS[selectedColor];
  
  noteEditor.classList.remove('hidden');
  noteTitle.focus();
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  currentNoteId = id;
  selectedColor = note.color || '#FFFFFF';
  noteTitle.value = note.title || '';
  noteContent.value = note.content || '';
  
  const editorContainer = noteEditor.querySelector('.editor-container');
  editorContainer.style.backgroundColor = COLORS[selectedColor];
  
  noteEditor.classList.remove('hidden');
  noteTitle.focus();
}

function setNoteColor(color) {
  selectedColor = color;
  const editorContainer = noteEditor.querySelector('.editor-container');
  editorContainer.style.backgroundColor = COLORS[color];
}

function saveNote() {
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  
  if (!title && !content) {
    closeEditor();
    return;
  }
  
  if (currentNoteId) {
    const noteIndex = notes.findIndex(n => n.id === currentNoteId);
    if (noteIndex !== -1) {
      notes[noteIndex].title = title;
      notes[noteIndex].content = content;
      notes[noteIndex].color = selectedColor;
      notes[noteIndex].updatedAt = new Date().toISOString();
    }
  } else {
    const newNote = {
      id: generateId(),
      title,
      content,
      color: selectedColor,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
  }
  
  saveNotes();
  renderNotes();
  closeEditor();
}

function closeEditor() {
  noteEditor.classList.add('hidden');
  currentNoteId = null;
  noteTitle.value = '';
  noteContent.value = '';
  selectedColor = '#FFFFFF';
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderNotes();
}

function togglePin(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    saveNotes();
    renderNotes();
  }
}

function searchNotes() {
  changeSort();
  const query = searchInput.value.toLowerCase().trim();
  renderNotes(query);
}

function renderNotes(query = '') {
  let filteredNotes = [...notes];
  
  if (query) {
    filteredNotes = notes.filter(note => {
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      return title.includes(query) || content.includes(query);
    });
  }
  
  if (filteredNotes.length === 0) {
    notesGrid.innerHTML = `
      <div class="empty-state">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z"/>
        </svg>
        <p>Notes you add appear here</p>
      </div>
    `;
    return;
  }
  
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);
  
  const sortFn = (a, b) => {
    if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (currentSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (currentSort === 'title-asc') return (a.title || '').localeCompare(b.title || '');
    if (currentSort === 'title-desc') return (b.title || '').localeCompare(a.title || '');
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  };
  
  pinnedNotes.sort(sortFn);
  otherNotes.sort(sortFn);
  
  const sortedNotes = [...pinnedNotes, ...otherNotes];
  
  notesGrid.innerHTML = sortedNotes.map(note => `
    <div class="note-card ${note.pinned ? 'pinned' : ''}" 
         style="background-color: ${COLORS[note.color] || '#fff'};"
         onclick="editNote('${note.id}')">
      <div class="note-title">${escapeHtml(note.title) || ''}</div>
      <div class="note-content">${escapeHtml(note.content) || ''}</div>
      <div class="note-meta">
        <span>${formatDate(note.updatedAt)}</span>
        <div class="note-actions" onclick="event.stopPropagation()">
          <button class="note-action-btn" onclick="togglePin('${note.id}')" title="${note.pinned ? 'Unpin' : 'Pin'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${note.pinned ? '#202124' : 'currentColor'}">
              ${note.pinned 
                ? '<path d="M22 10L14 2L15.58 4.33L22 10zM17 13L13 9L10 12L4 6L2 8L10 16L17 13z"/>'
                : '<path d="M22 7L12 2L2 7L12 12L22 7ZM2 17L12 22L22 17V7L12 12L2 7V17Z"/>'
              }
            </svg>
          </button>
          <button class="note-action-btn" onclick="deleteNote('${note.id}')" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
