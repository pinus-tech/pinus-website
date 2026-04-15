import { deleteObject, ref } from "firebase/storage";
import { getFirebaseStorage } from "./client";
import { MARKETPLACE_STORAGE_ROOT } from "./storage-paths";

function isMarketplaceStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "firebasestorage.googleapis.com") return false;
    const encodedRoot = encodeURIComponent(`${MARKETPLACE_STORAGE_ROOT}/`);
    return parsed.pathname.includes(`/o/${encodedRoot}`);
  } catch {
    return false;
  }
}

/** Deletes one marketplace image from Firebase Storage, if it is a marketplace URL. */
export async function deleteMarketplaceImageByUrl(url: string): Promise<boolean> {
  if (!isMarketplaceStorageUrl(url)) {
    return false;
  }
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
  return true;
}
