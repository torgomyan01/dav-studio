import path from 'path';

export function getUploadDir(folder: 'accessories' | 'repairs') {
  const uploadsRoot = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(process.cwd(), 'public', 'uploads');

  return path.join(uploadsRoot, folder);
}
