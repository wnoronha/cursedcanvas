export const ANNOTATE_EVENT = "cursedcanvas:annotate";

export function requestAnnotate(): void {
  window.dispatchEvent(new CustomEvent(ANNOTATE_EVENT));
}
