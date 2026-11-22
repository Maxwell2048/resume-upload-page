/**
 * FileDropzone: a small, reusable wrapper around <input type="file">.
 *
 * - click / Enter / Space on the area opens the native file picker (via <label for>)
 * - drag-and-drop with a visual "drag over" state
 * - validates extension and size, shows the chosen file name and size, and lets the user remove it
 * - emits a `dropzone:change` CustomEvent with { file } so pages stay decoupled from the widget
 */
class FileDropzone {
  constructor(root) {
    this.root = root;
    this.input = root.querySelector(".dropzone__input");
    this.fileRow = root.querySelector(".dropzone__file");
    this.fileName = root.querySelector(".dropzone__file-name");
    this.fileSize = root.querySelector(".dropzone__file-size");
    this.removeBtn = root.querySelector(".dropzone__remove");
    this.error = root.querySelector(".dropzone__error");
    this.maxBytes = Number(root.dataset.maxMb || 10) * 1024 * 1024;
    this.accept = (root.dataset.accept || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    this.file = null;
    this.dragDepth = 0; // dragenter/dragleave fire for child elements too
    this.bind();
  }

  bind() {
    this.input.addEventListener("change", () => this.take(this.input.files[0]));
    this.removeBtn.addEventListener("click", () => this.clear());

    this.root.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.dragDepth += 1;
      this.root.classList.add("is-dragover");
    });
    this.root.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    this.root.addEventListener("dragleave", () => {
      this.dragDepth = Math.max(0, this.dragDepth - 1);
      if (this.dragDepth === 0) this.root.classList.remove("is-dragover");
    });
    this.root.addEventListener("drop", (e) => {
      e.preventDefault();
      this.dragDepth = 0;
      this.root.classList.remove("is-dragover");
      const files = e.dataTransfer.files;
      if (files.length > 1) return this.showError("Please drop a single file.");
      this.take(files[0]);
    });
    // A file dropped next to the zone should not make the browser navigate away.
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());
  }

  validate(file) {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (this.accept.length && !this.accept.includes(ext)) {
      return `Unsupported file type. Please upload ${this.accept.join(", ").toUpperCase()}.`;
    }
    if (file.size > this.maxBytes) {
      return `File is too large (${FileDropzone.formatSize(file.size)}). The limit is ${FileDropzone.formatSize(this.maxBytes)}.`;
    }
    if (file.size === 0) return "The file is empty.";
    return "";
  }

  take(file) {
    if (!file) return;
    const problem = this.validate(file);
    if (problem) {
      this.input.value = "";
      return this.showError(problem);
    }
    this.file = file;
    this.showError("");
    this.fileName.textContent = file.name;
    this.fileName.title = file.name;
    this.fileSize.textContent = FileDropzone.formatSize(file.size);
    this.fileRow.hidden = false;
    this.root.classList.add("has-file");
    this.emit();
  }

  clear() {
    this.file = null;
    this.input.value = "";
    this.fileRow.hidden = true;
    this.root.classList.remove("has-file");
    this.showError("");
    this.input.focus();
    this.emit();
  }

  showError(message) {
    this.error.textContent = message;
  }

  emit() {
    this.root.dispatchEvent(new CustomEvent("dropzone:change", { detail: { file: this.file }, bubbles: true }));
  }

  static formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

/* ---------------------------------------------------------------- page wiring */
document.addEventListener("DOMContentLoaded", () => {
  const dropzone = new FileDropzone(document.getElementById("dropzone"));
  const form = document.getElementById("upload-form");
  const status = document.getElementById("status");
  const finish = document.getElementById("btn-finish");

  document.getElementById("dropzone").addEventListener("dropzone:change", () => {
    status.textContent = "";
  });

  document.getElementById("btn-back").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else status.textContent = "This is the first page of the demo.";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (finish.getAttribute("aria-busy") === "true") return;
    finish.setAttribute("aria-busy", "true");
    // No backend in this exercise: simulate the request so the UI states are visible.
    setTimeout(() => {
      finish.removeAttribute("aria-busy");
      status.textContent = dropzone.file
        ? `“${dropzone.file.name}” uploaded. We will parse it for you.`
        : "Skipped. You can upload a resume later from your profile.";
    }, 600);
  });
});
