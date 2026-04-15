import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";
import { FORMS_STORAGE_ROOT } from "./storage-paths";

export async function uploadFormHeaderImage(
  blob: Blob,
  filename: string,
  contentType: string,
  formId: string,
  userId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${FORMS_STORAGE_ROOT}/headers/${formId}/${userId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: contentType || "image/jpeg",
  });

  return getDownloadURL(storageRef);
}
