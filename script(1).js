// All interactivity for the Notes App and Feedback form lives here.
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // ----- Constants -----
  const STORAGE_KEY = "notesApp.notes.v1";
  const FEEDBACK_API_URL = "https://your-serverless-api-url/feedback";

  // ----- State -----
  let notes = [];
  let currentEditingNoteId = null;

  // ----- DOM Elements -----
  const notesContainer = document.getElementById("notesContainer");
  const emptyStateEl = document.getElementById("emptyState");

  const addNoteBtn = document.getElementById("addNoteBtn");

  const noteModal = document.getElementById("noteModal");
  const noteModalTitle = document.getElementById("noteModalTitle");
  const noteForm = document.getElementById("noteForm");
  const noteTitleInput = document.getElementById("noteTitleInput");
  const noteContentInput = document.getElementById("noteContentInput");
  const closeNoteModalBtn = document.getElementById("closeNoteModalBtn");
  const cancelNoteBtn = document.getElementById("cancelNoteBtn");

  const feedbackBtn = document.getElementById("feedbackBtn");
  const feedbackModal = document.getElementById("feedbackModal");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackNameInput = document.getElementById("feedbackNameInput");
  const feedbackEmailInput = document.getElementById("feedbackEmailInput");
  const feedbackMessageInput = document.getElementById("feedbackMessageInput");
  const feedbackStatusEl = document.getElementById("feedbackStatus");
  const closeFeedbackModalBtn = document.getElementById("closeFeedbackModalBtn");
  const cancelFeedbackBtn = document.getElementById("cancelFeedbackBtn");
  const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");

  // ----- Utility Functions -----

  function loadNotesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        notes = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        notes = parsed;
      } else {
        notes = [];
      }
    } catch (err) {
      console.warn("Failed to read notes from localStorage:", err);
      notes = [];
    }
  }

  function saveNotesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.warn("Failed to save notes to localStorage:", err);
    }
  }

  function formatDateTime(isoString) {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  }

  function createNoteId() {
    // Simple unique ID using timestamp and random value
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    // Good enough for a local browser app
  }

  // ----- Rendering -----

  function renderNotes() {
    // Clear existing cards
    notesContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
      emptyStateEl.style.display = "block";
      return;
    }
    emptyStateEl.style.display = "none";

    // Create and append cards
    notes.forEach(function (note) {
      const card = document.createElement("article");
      card.className = "note-card";
      card.dataset.id = note.id;

      const header = document.createElement("div");
      header.className = "note-card-header";

      const titleEl = document.createElement("h3");
      titleEl.className = "note-title";
      titleEl.textContent = note.title || "Untitled";

      const actions = document.createElement("div");
      actions.className = "note-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-button edit-btn";
      editBtn.title = "Edit note";
      editBtn.textContent = "Edit";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-button delete-btn";
      deleteBtn.title = "Delete note";
      deleteBtn.textContent = "Delete";

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      header.appendChild(titleEl);
      header.appendChild(actions);

      const contentEl = document.createElement("p");
      contentEl.className = "note-content";
      contentEl.textContent = note.content || "";

      const meta = document.createElement("div");
      meta.className = "note-meta";

      const label = document.createElement("span");
      label.className = "note-meta-label";
      label.textContent = "Saved";

      const dateEl = document.createElement("span");
      dateEl.textContent = formatDateTime(note.updatedAt || note.createdAt);

      meta.appendChild(label);
      meta.appendChild(dateEl);

      card.appendChild(header);
      card.appendChild(contentEl);
      card.appendChild(meta);

      notesContainer.appendChild(card);
    });
  }

  // ----- Note Modal Handlers -----

  function openNoteModalForCreate() {
    currentEditingNoteId = null;
    noteModalTitle.textContent = "Add Note";
    noteTitleInput.value = "";
    noteContentInput.value = "";
    showModal(noteModal);
    noteTitleInput.focus();
  }

  function openNoteModalForEdit(noteId) {
    const note = notes.find(function (n) {
      return n.id === noteId;
    });
    if (!note) return;

    currentEditingNoteId = noteId;
    noteModalTitle.textContent = "Edit Note";
    noteTitleInput.value = note.title || "";
    noteContentInput.value = note.content || "";
    showModal(noteModal);
    noteTitleInput.focus();
  }

  function closeNoteModal() {
    hideModal(noteModal);
    noteForm.reset();
    currentEditingNoteId = null;
  }

  function handleNoteFormSubmit(event) {
    event.preventDefault();

    if (!noteForm.checkValidity()) {
      // Trigger native browser validation UI
      noteForm.reportValidity();
      return;
    }

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title && !content) {
      // At least one of them should have content
      alert("Please enter a title or some content for the note.");
      return;
    }

    if (currentEditingNoteId) {
      // Update existing note
      const idx = notes.findIndex(function (n) {
        return n.id === currentEditingNoteId;
      });
      if (idx !== -1) {
        notes[idx].title = title || "Untitled";
        notes[idx].content = content;
        notes[idx].updatedAt = new Date().toISOString();
      }
    } else {
      // Create new note
      const now = new Date().toISOString();
      const newNote = {
        id: createNoteId(),
        title: title || "Untitled",
        content: content,
        createdAt: now,
        updatedAt: now,
      };
      // Add newest notes first
      notes.unshift(newNote);
    }

    saveNotesToStorage();
    renderNotes();
    closeNoteModal();
  }

  // ----- CRUD operations -----

  function deleteNoteById(noteId) {
    const confirmed = confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    notes = notes.filter(function (n) {
      return n.id !== noteId;
    });
    saveNotesToStorage();
    renderNotes();
  }

  // ----- Generic Modal Helpers -----

  function showModal(modalEl) {
    modalEl.classList.remove("hidden");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function hideModal(modalEl) {
    modalEl.classList.add("hidden");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  // ----- Feedback Form Handlers -----

  function setFeedbackStatus(message, type) {
    // type: "success" | "error" | ""
    feedbackStatusEl.textContent = message || "";
    feedbackStatusEl.classList.remove("success", "error");
    if (type === "success") {
      feedbackStatusEl.classList.add("success");
    } else if (type === "error") {
      feedbackStatusEl.classList.add("error");
    }
  }

  function resetFeedbackForm() {
    feedbackForm.reset();
    setFeedbackStatus("", "");
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    // Minimal validation
    if (!feedbackForm.checkValidity()) {
      feedbackForm.reportValidity();
      return;
    }

    const name = feedbackNameInput.value.trim();
    const email = feedbackEmailInput.value.trim();
    const message = feedbackMessageInput.value.trim();

    if (!name || !email || !message) {
      setFeedbackStatus("Please fill in all fields.", "error");
      return;
    }

    setFeedbackStatus("Sending...", "");
    submitFeedbackBtn.disabled = true;

    try {
      const response = await fetch(FEEDBACK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message }),
      });

      if (!response.ok) {
        throw new Error("Server responded with status " + response.status);
      }

      setFeedbackStatus("Thank you! Your feedback has been sent.", "success");
      // Clear the form after a short delay
      setTimeout(function () {
        resetFeedbackForm();
        hideModal(feedbackModal);
      }, 900);
    } catch (error) {
      console.error("Failed to send feedback:", error);
      setFeedbackStatus(
        "Could not send feedback. Please try again later.",
        "error"
      );
    } finally {
      submitFeedbackBtn.disabled = false;
    }
  }

  function openFeedbackModal() {
    resetFeedbackForm();
    showModal(feedbackModal);
    feedbackNameInput.focus();
  }

  function closeFeedbackModal() {
    hideModal(feedbackModal);
  }

  // ----- Event Listeners -----

  // Add note button
  addNoteBtn.addEventListener("click", openNoteModalForCreate);

  // Note modal controls
  closeNoteModalBtn.addEventListener("click", closeNoteModal);
  cancelNoteBtn.addEventListener("click", closeNoteModal);
  noteModal.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-backdrop")) {
      closeNoteModal();
    }
  });
  noteForm.addEventListener("submit", handleNoteFormSubmit);

  // Notes grid: handle edit/delete via event delegation
  notesContainer.addEventListener("click", function (event) {
    const card = event.target.closest(".note-card");
    if (!card) return;
    const noteId = card.dataset.id;
    if (!noteId) return;

    if (event.target.classList.contains("edit-btn")) {
      openNoteModalForEdit(noteId);
    } else if (event.target.classList.contains("delete-btn")) {
      deleteNoteById(noteId);
    }
  });

  // Feedback modal controls
  feedbackBtn.addEventListener("click", openFeedbackModal);
  closeFeedbackModalBtn.addEventListener("click", closeFeedbackModal);
  cancelFeedbackBtn.addEventListener("click", closeFeedbackModal);
  feedbackModal.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-backdrop")) {
      closeFeedbackModal();
    }
  });
  feedbackForm.addEventListener("submit", handleFeedbackSubmit);

  // ----- Initial Load -----
  loadNotesFromStorage();
  renderNotes();
});