/* eslint-env jest */
// Silence the noisy Reanimated and Expo warnings during tests; mocks below
// provide the bits unit tests actually touch.

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" }
}));

jest.mock("expo-file-system", () => {
  const store = new Map();
  return {
    Paths: { document: { uri: "file:///doc" }, cache: { uri: "file:///cache" } },
    Directory: class {
      constructor() {}
      get exists() {
        return true;
      }
      create() {}
    },
    File: class {
      constructor(_dir, name) {
        this.key = String(name ?? "");
      }
      get exists() {
        return store.has(this.key);
      }
      create() {
        if (!store.has(this.key)) store.set(this.key, "");
      }
      async text() {
        return store.get(this.key) ?? "";
      }
      write(value) {
        store.set(this.key, value);
      }
      delete() {
        store.delete(this.key);
      }
    }
  };
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));
