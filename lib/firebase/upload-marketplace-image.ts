import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";
import { MARKETPLACE_STORAGE_ROOT } from "./storage-paths";

export async function uploadMarketplaceImage(
  blob: Blob,
  filename: string,
  contentType: string,
  userId: string
): Promise<string> {
  if (!contentType.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  const storage = getFirebaseStorage();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${MARKETPLACE_STORAGE_ROOT}/${userId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: contentType || "image/jpeg",
  });

  return getDownloadURL(storageRef);
}
