import { getAccessToken } from "@/lib/auth/storage";

export function mediaUrl(address: string) {
  return /^https?:\/\//i.test(address) ? address : `/uploads/${address}`;
}

export async function adminUploadMedia(
  file: File,
  target: { driverId?: string; driverDocumentRowId?: string },
) {
  const fd = new FormData();
  if (target.driverId) fd.append("driverId", target.driverId);
  if (target.driverDocumentRowId) fd.append("driverDocumentRowId", target.driverDocumentRowId);
  fd.append("file", file);
  const token = getAccessToken();
  const res = await fetch(import.meta.env.VITE_UPLOAD_URL ?? "/api/admin_upload_media", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return (await res.json()) as { id: string; address: string };
}
