import { Directory, File, Paths } from "expo-file-system";

const STORAGE_DIR_NAME = "safescan-store";

function getStorageDir() {
  const dir = new Directory(Paths.document, STORAGE_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function fileForKey(key: string) {
  const safe = key.replace(/[^a-z0-9._-]/gi, "_");
  return new File(getStorageDir(), `${safe}.json`);
}

export const fileSystemStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const file = fileForKey(key);
      if (!file.exists) return null;
      return await file.text();
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const file = fileForKey(key);
      if (!file.exists) file.create({ overwrite: true });
      file.write(value);
    } catch {
      // best-effort persistence; surface a warning in dev only
      if (__DEV__) console.warn("[storage] failed to write", key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const file = fileForKey(key);
      if (file.exists) file.delete();
    } catch {
      // ignore
    }
  }
};
