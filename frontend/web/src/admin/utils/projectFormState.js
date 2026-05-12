export const initialProjectFormState = {
  title: "",
  description: "",
  skills: "",
  githubLink: "",
  websiteUrl: "",
  tags: "",
  time: "",
  existingThumbUrl: "",
  existingProjectFiles: [],
  existingCodeFileName: "",
};

export function createEmptyProjectFormState() {
  return {
    ...initialProjectFormState,
    existingProjectFiles: [],
  };
}