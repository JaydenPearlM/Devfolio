import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/AddProjectForm.css";

const MAX_SKILLS = 5;
const MAX_SOFTWARE = 5;

const initialState = {
  title: "",
  description: "",
  skills: "",
  software: "",
  githubLink: "",
  websiteUrl: "",
  tags: "",
  time: "",
  existingThumbUrl: "",
  existing_project_files: [],
  existingCodeFileName: "",
};

function fileNameFromPathOrUrl(str = "") {
  try {
    const noQuery = String(str).split("?")[0];
    const last = noQuery.split("/").pop() || "";
    return decodeURIComponent(last) || String(str);
  } catch {
    return String(str);
  }
}

function splitCommaText(input) {
  return String(input || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function clampCommaSeparated(input, maxCount) {
  return splitCommaText(input).slice(0, maxCount).join(", ");
}

function toTagsArray(input) {
  if (Array.isArray(input)) {
    const arr = input.map(String).map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }

  const s = String(input || "").trim();
  if (!s) return null;

  const arr = s
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  return arr.length ? arr : null;
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function uploadProjectPreviewToServer({ files, projectTitle }) {
  if (!Array.isArray(files) || files.length === 0) {
    return { project_index_url: null, project_files: [] };
  }

  const token = await getAuthToken();

  const form = new FormData();
  form.append("title", projectTitle || "project");
  form.append(
    "project_files_paths",
    JSON.stringify(files.map((f) => f.webkitRelativePath || f.name))
  );
  files.forEach((file) => form.append("projectFiles", file));

  const response = await fetch("/api/projects/demo-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Project preview upload failed on the server.");
  }

  return {
    project_index_url: data?.project_index_url || null,
    project_files: Array.isArray(data?.project_files) ? data.project_files : [],
  };
}

async function saveProjectToServer({ isEditing, editingId, payload, thumbFile, codeFile }) {
  const token = await getAuthToken();

  const form = new FormData();

  form.append("title", payload.title || "");
  form.append("description", payload.description || "");
  form.append("skills", payload.skills || "");
  form.append("github_link", payload.githubLink || "");
  form.append("tags", JSON.stringify(payload.tags || []));

  // project_index_url takes priority over a manually typed websiteUrl.
  // Only one value ever gets appended to web_app_url -- never both.
  const effectiveUrl = payload.project_index_url || payload.websiteUrl || "";
  form.append("web_app_url", effectiveUrl);

  if (payload.project_index_url) {
    form.append("project_index_url", payload.project_index_url);
  }

  if (thumbFile) {
    form.append("thumnail_file", thumbFile);
  }

  if (codeFile) {
    form.append("code_file_zip", codeFile);
  }

  const url = isEditing && editingId != null
    ? `/api/projects/${editingId}`
    : "/api/projects";

  const method = isEditing && editingId != null ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Project save failed.");
  }

  return data;
}

function StoredFilesSummary({ formData }) {
  const thumbName = formData.existingThumbUrl
    ? fileNameFromPathOrUrl(formData.existingThumbUrl)
    : "-";

  const projFiles = Array.isArray(formData.existing_project_files)
    ? formData.existing_project_files
        .map((f) =>
          typeof f === "string"
            ? fileNameFromPathOrUrl(f)
            : f?.name || fileNameFromPathOrUrl(f?.url || "")
        )
        .filter(Boolean)
    : [];

  const projFilesLine = projFiles.length > 0 ? projFiles.join(", ") : "-";
  const codeFileName = (formData.existingCodeFileName || "").trim() || "-";

  return (
    <div className="add-project-summary">
      <div className="add-project-summary__title">Stored Files</div>

      <div className="add-project-summary__grid">
        <div className="add-project-summary__row">
          <span className="add-project-summary__label">Thumbnail:</span>
          <span className="add-project-summary__value">{thumbName}</span>
        </div>

        <div className="add-project-summary__row">
          <span className="add-project-summary__label">Project Files:</span>
          <span className="add-project-summary__value">{projFilesLine}</span>
        </div>

        <div className="add-project-summary__row">
          <span className="add-project-summary__label">Code File:</span>
          <span className="add-project-summary__value">{codeFileName}</span>
        </div>
      </div>
    </div>
  );
}

export default function AddProjectForm({
  formData,
  setFormData,
  isEditing = false,
  editingId = null,
  onSave,
  onCancelEdit,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const thumbRef = useRef(null);
  const projRef = useRef(null);
  const codeRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);

  const [pickedProjectFiles, setPickedProjectFiles] = useState([]);

  const hasProjectFiles = pickedProjectFiles.length > 0;
  const hasWebsite = (formData.websiteUrl || "").trim().length > 0;

  useEffect(() => {
    titleRef.current?.focus();
  }, [isEditing]);

  const submitLabel = useMemo(() => {
    if (submitting) return isEditing ? "Saving changes..." : "Submitting...";
    return isEditing ? "Save Changes" : "Submit Project";
  }, [submitting, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "websiteUrl") {
      setFormData((s) => ({ ...s, websiteUrl: value }));
      if (value.trim()) {
        if (projRef.current) projRef.current.value = "";
        setPickedProjectFiles([]);
      }
      return;
    }

    if (name === "skills") {
      setFormData((s) => ({ ...s, skills: clampCommaSeparated(value, MAX_SKILLS) }));
      return;
    }

    if (name === "software") {
      setFormData((s) => ({ ...s, software: clampCommaSeparated(value, MAX_SOFTWARE) }));
      return;
    }

    setFormData((s) => ({ ...s, [name]: value }));
  };

  const clearAllFiles = () => {
    if (thumbRef.current) thumbRef.current.value = "";
    if (projRef.current) projRef.current.value = "";
    if (codeRef.current) codeRef.current.value = "";
    setPickedProjectFiles([]);
  };

  const clearEverything = () => {
    setFormData({ ...initialState });
    clearAllFiles();
    if (formRef.current?.reset) formRef.current.reset();
    titleRef.current?.focus();
  };

  useEffect(() => {
    const allCleared = Object.keys(initialState).every((k) => {
      const value = formData?.[k];
      if (Array.isArray(value)) return value.length === 0;
      return String(value ?? "").trim() === "";
    });
    if (allCleared) clearAllFiles();
  }, [formData]);

  const handleProjectFilesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setPickedProjectFiles([]);
      return;
    }

    const zipFiles = files.filter((f) => /\.zip$/i.test(f.name || ""));

    if (zipFiles.length > 1) {
      setErrMsg("Choose one zip file only for Project Files.");
      if (projRef.current) projRef.current.value = "";
      setPickedProjectFiles([]);
      return;
    }

    if (zipFiles.length === 1 && files.length > 1) {
      setErrMsg("Choose either one zip file or a group of normal files, not both.");
      if (projRef.current) projRef.current.value = "";
      setPickedProjectFiles([]);
      return;
    }

    setErrMsg("");
    setPickedProjectFiles(files);

    if (files.length > 0) {
      setFormData((s) => ({ ...s, websiteUrl: "" }));
    }
  };

  const openProjectFilePicker = () => {
    if (hasWebsite || submitting) return;
    projRef.current?.click();
  };

  const getProjectFilesDisplayName = () => {
    if (!pickedProjectFiles.length) return "No file chosen";
    if (pickedProjectFiles.length === 1) return pickedProjectFiles[0].name;
    return `${pickedProjectFiles.length} files selected`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrMsg("");

    try {
      const title = (formData.title || "").trim();
      const hasWebsiteNow = (formData.websiteUrl || "").trim().length > 0;
      const files = pickedProjectFiles.length > 0 ? pickedProjectFiles : [];
      const hasLocalSite = !hasWebsiteNow && files.length > 0;

      const effectiveTags = toTagsArray(formData.tags || formData.skills);

      const payload = {
        title,
        description: (formData.description || "").trim(),
        skills: clampCommaSeparated(formData.skills || "", MAX_SKILLS),
        tags: effectiveTags,
        githubLink: (formData.githubLink || "").trim(),
        websiteUrl: hasWebsiteNow ? (formData.websiteUrl || "").trim() : "",
        project_index_url: null,
        project_files: [],
      };

      // Step 1 -- upload project preview files to backend if provided
      if (hasLocalSite) {
        const previewResult = await uploadProjectPreviewToServer({
          files,
          projectTitle: title,
        });

        payload.project_index_url = previewResult.project_index_url;
        payload.project_files = previewResult.project_files;
      }

      // Step 2 -- save project row + thumbnail + code file through backend
      const thumbFile = thumbRef.current?.files?.[0] || null;
      const codeFile = codeRef.current?.files?.[0] || null;

      await saveProjectToServer({
        isEditing,
        editingId,
        payload,
        thumbFile,
        codeFile,
      });

      clearEverything();
      onSave?.();
      onCancelEdit?.();
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetClick = () => {
    clearEverything();
    onCancelEdit?.();
  };

  const skillCount = splitCommaText(formData.skills || "").length;
  const softwareCount = splitCommaText(formData.software || "").length;

  return (
    <section className="add-project-form-shell">
      <div className="add-project-form-card">
        <h2 className="add-project-form-title">Upload Projects</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="add-project-form">
          {errMsg && <div className="add-project-form-error">{errMsg}</div>}

          {isEditing && <StoredFilesSummary formData={formData} />}

          <div className="add-project-field">
            <label className="add-project-label">Title</label>
            <input
              ref={titleRef}
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="add-project-input"
              placeholder="Project title"
              autoFocus
              required
            />
          </div>

          <div className="add-project-field">
            <label className="add-project-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="add-project-textarea"
              rows={4}
              placeholder="Short summary"
            />
          </div>

          <div className="add-project-grid add-project-grid--two">
            <div className="add-project-field">
              <label className="add-project-label">Skills</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="add-project-input"
                placeholder="e.g. React, Node, Express"
              />
              <p className="add-project-help">
                Up to {MAX_SKILLS} comma separated. Currently {skillCount}/{MAX_SKILLS}.
              </p>
            </div>

            <div className="add-project-field">
              <label className="add-project-label">Software</label>
              <input
                name="software"
                value={formData.software || ""}
                onChange={handleChange}
                className="add-project-input"
                placeholder="e.g. VS Code, Figma, Blender"
              />
              <p className="add-project-help">
                Up to {MAX_SOFTWARE} comma separated. Currently {softwareCount}/{MAX_SOFTWARE}.
              </p>
            </div>
          </div>

          <div className="add-project-grid add-project-grid--two">
            <div className="add-project-field">
              <label className="add-project-label">GitHub Link</label>
              <input
                name="githubLink"
                value={formData.githubLink}
                onChange={handleChange}
                className="add-project-input"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="add-project-field">
              <label className="add-project-label">Website</label>
              <input
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                disabled={hasProjectFiles}
                className="add-project-input"
                placeholder="https://example.com/..."
              />
              <p className="add-project-help">
                If you provide a Website, Project Files will be disabled.
              </p>
            </div>
          </div>

          <div className="add-project-field">
            <label className="add-project-label">Tags (optional)</label>
            <input
              name="tags"
              value={formData.tags || ""}
              onChange={handleChange}
              className="add-project-input"
              placeholder="comma separated (optional - skills will be used if left blank)"
            />
          </div>

          {isEditing && (
            <div className="add-project-field">
              <label className="add-project-label">Time (read-only)</label>
              <input
                name="time"
                value={formData.time || ""}
                readOnly
                disabled
                className="add-project-input add-project-input--disabled"
                placeholder="(auto-set; shown on edit)"
              />
            </div>
          )}

          <div className="add-project-grid add-project-grid--three">
            <div className="add-project-field">
              <label className="add-project-label">Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                ref={thumbRef}
                className="add-project-file"
              />
              <p className="add-project-help">
                Best results: square image, around 200 x 200.
              </p>
            </div>

            <div className="add-project-field">
              <label className="add-project-label">Project Files</label>

              <input
                type="file"
                ref={projRef}
                multiple
                accept=".zip,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt,.py,.ipynb,.r,.java,.kt,.cs,.cpp,.c,.h,.rs,.go,.php,.sql,.csv,.tsv,.parquet,.pkl,.joblib,.onnx,.pt,.pth,.yaml,.yml,.toml,.xml,.pdf,image/*,audio/*,video/*"
                onChange={handleProjectFilesChange}
                disabled={hasWebsite || submitting}
                style={{ display: "none" }}
              />

              <div className="add-project-file">
                <button
                  type="button"
                  onClick={openProjectFilePicker}
                  disabled={hasWebsite || submitting}
                  className="add-project-file-trigger"
                >
                  Choose Files
                </button>

                <span className="add-project-file-name">
                  {getProjectFilesDisplayName()}
                </span>
              </div>

              <p className="add-project-help">
                Upload one zip with index.html, or a built/static folder.
                Raw TSX/JSX/TS needs to be built first before it can be previewed.
              </p>
            </div>

            <div className="add-project-field">
              <label className="add-project-label">Code File (optional)</label>
              <input
                type="file"
                ref={codeRef}
                accept=".zip,.py,.ipynb,.html,.htm,.js,.ts,.tsx,.jsx,.json,.md,.txt,.capp"
                className="add-project-file"
              />
              <p className="add-project-help">
                Feeds the Code viewer. If you upload a demo zip it can double as the code file too.
              </p>
            </div>
          </div>

          <div className="add-project-actions">
            <button
              type="submit"
              className="add-project-btn add-project-btn--primary"
              disabled={submitting}
            >
              {submitLabel}
            </button>

            <button
              type="button"
              className="add-project-btn add-project-btn--secondary"
              onClick={handleResetClick}
              disabled={submitting}
            >
              {isEditing ? "Cancel Edit" : "Reset"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
