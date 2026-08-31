import "@testing-library/jest-dom/vitest";

// jsdom does not implement Blob/File.arrayBuffer() (as of jsdom 25). Real
// browsers all support it natively, so this is a test-environment-only
// polyfill, never shipped in the app bundle.
if (typeof File !== "undefined" && typeof File.prototype.arrayBuffer !== "function") {
  File.prototype.arrayBuffer = function (this: File) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
