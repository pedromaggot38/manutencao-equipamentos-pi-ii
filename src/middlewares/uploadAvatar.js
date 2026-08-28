import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import AppError from '../utils/appError.js';

export const uploadAvatar = async (request, reply) => {
  if (!request.isMultipart()) {
    return;
  }

  const data = await request.file({
    limits: { fileSize: 2 * 1024 * 1024 },
  });

  if (!data) return;

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    throw new AppError(
      'Formato de arquivo inválido. Envie apenas JPEG, PNG ou WEBP.',
      400,
    );
  }

  const segments = request.url.split('?')[0].split('/').filter(Boolean);
  const routeSegment = segments.includes('me')
    ? 'me'
    : segments[segments.length - 1];
  const subFolder = routeSegment === 'me' ? 'avatars' : routeSegment || 'misc';

  const targetFolder = path.join(process.cwd(), 'uploads', subFolder);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const userId = request.user?.id || 'anonymous';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(data.filename);

  const finalFilename = `${data.fieldname}-${userId}-${uniqueSuffix}${ext}`;
  const targetPath = path.join(targetFolder, finalFilename);

  await pipeline(data.file, fs.createWriteStream(targetPath));

  if (data.file.truncated) {
    fs.unlinkSync(targetPath);
    throw new AppError('O arquivo excede o limite de 2MB.', 400);
  }

  request.file = {
    filename: finalFilename,
    path: targetPath,
    mimetype: data.mimetype,
  };
};
