// backend/lib/imagekit.js
import ImageKit from "imagekit";

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
  console.warn("[ImageKit] Missing env (IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT). Uploads will fail.");
}

export const imagekitClient = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY || "",
  privateKey: IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: IMAGEKIT_URL_ENDPOINT || "",
});

export async function uploadImage(fileBase64OrBuffer, folder = "products") {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("ImageKit env missing (IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT).");
  }
  const res = await imagekitClient.upload({
    file: fileBase64OrBuffer, // Base64 data URL or Buffer
    fileName: `${Date.now()}.jpg`,
    folder,
  });
  return { url: res.url, fileId: res.fileId };
}

export async function deleteImage(fileId) {
  if (!fileId) return;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    console.warn("[ImageKit] Missing env, skip delete.");
    return;
  }
  await imagekitClient.deleteFile(fileId);
}
