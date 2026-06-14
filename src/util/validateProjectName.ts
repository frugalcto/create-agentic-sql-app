const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function validateProjectName(projectName: string): string {
  const trimmed = projectName.trim();

  if (!trimmed) {
    throw new Error("Project name is required.");
  }

  if (trimmed === "." || trimmed === "..") {
    throw new Error("Invalid project name: path traversal is not allowed.");
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    throw new Error("Invalid project name: path separators are not allowed.");
  }

  if (trimmed.includes("..")) {
    throw new Error("Invalid project name: path traversal is not allowed.");
  }

  if (!PROJECT_NAME_PATTERN.test(trimmed)) {
    throw new Error(
      "Invalid project name: use letters, numbers, hyphens, underscores, or dots; must start with a letter or number.",
    );
  }

  return trimmed;
}
