import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";

/**
 * Upload a prepared file blob (images/PDF) for a form response. Paths are scoped by form and user.
 */
export async function uploadFormAttachment(
  blob: Blob,
  filename: string,
  contentType: string,
  formId: string,
  userId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `form-uploads/${formId}/${userId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: contentType || "application/octet-stream",
  });

  return getDownloadURL(storageRef);
}
