function toUrlArray(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (value == null) {
    return [];
  }

  const text = String(value).trim();

  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    // ignore malformed JSON-like strings
  }

  return text
    .split(",")
    .map((item) => item.trim().replace(/^(\[)?"+|"+(\])?$/g, ""))
    .filter(Boolean);
}

function toTagsArray(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeProjectRow(row) {
  const projectFiles = toUrlArray(row.project_files);
  const tagsArray = toTagsArray(row.tags);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    skills: row.skills,
    github_link: row.github_link,
    web_app_url: row.web_app_url,
    thumbnail: row.thumbnail,
    project_files: projectFiles,
    project_index_url: row.project_index_url,
    code_file: row.code_file,
    tags: row.tags,
    time: row.time,

    githubLink: row.github_link,
    websiteUrl: row.web_app_url,
    projectFiles,
    projectIndexUrl: row.project_index_url,
    codeFile: row.code_file,
    created_at: row.time,
    tagsArray,
  };
}

export function normalizeProjectRows(rows = []) {
  return rows.map(normalizeProjectRow);
}