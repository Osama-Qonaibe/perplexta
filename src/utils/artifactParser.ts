export function removeArtifactTags(content: string): string {
  return content.replace(/<antArtifact[\s\S]*?<\/antArtifact>/g, '').trim();
}
