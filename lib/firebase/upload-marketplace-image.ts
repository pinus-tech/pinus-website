import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadMarketplaceImage(
  file: File,
  userId: string
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 8 MB or smaller");
  }

  const storage = getFirebaseStorage();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `marketplace/${userId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });

  return getDownloadURL(storageRef);
}
