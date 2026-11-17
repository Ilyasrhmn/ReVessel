import { depositPhotoAssets } from "./deposit-photo-assets";

const imageType = /^image\/(jpeg|png|webp|avif|heic|heif|gif|bmp)$/i;
const maxFileBytes = 12 * 1024 * 1024;
const maxPhotoLength = 100 * 1024;

export function depositPhotoError(file: File | null) {
  if (!file?.size) return "Tambahkan foto setoran.";
  if (!imageType.test(file.type)) return "Pilih berkas foto seperti JPG, PNG, atau WebP.";
  if (file.size > maxFileBytes) return "Pilih foto dengan ukuran maksimal 12 MB.";
  return "";
}

export function isDepositPhoto(value: unknown): value is string {
  return typeof value === "string" && (Object.values(depositPhotoAssets).includes(value) || (value.length <= maxPhotoLength && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value)));
}

export async function prepareDepositPhoto(value: FormDataEntryValue | null) {
  const file = value instanceof File ? value : null;
  const error = depositPhotoError(file);
  if (!file || error) return { error };

  const url = URL.createObjectURL(file);
  try {
    const photo = new Image();
    photo.src = url;
    await photo.decode();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context || !photo.naturalWidth || !photo.naturalHeight) throw new Error("Unreadable image");

    for (const [size, quality] of [[840, 0.78], [720, 0.65], [560, 0.52], [420, 0.42]]) {
      const scale = Math.min(1, size / Math.max(photo.naturalWidth, photo.naturalHeight));
      canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(photo, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg", quality);
      if (isDepositPhoto(result)) return result;
    }
    return { error: "Foto terlalu besar setelah diproses. Pilih foto lain." };
  } catch {
    return { error: "Foto tidak bisa dibuka. Pilih berkas JPG, PNG, atau WebP." };
  } finally {
    URL.revokeObjectURL(url);
  }
}
