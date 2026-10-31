import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { auth } from '@/auth';
import { addJobLogPhoto } from '@/lib/job-log-service';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: jobLogId } = await params;
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }

  const photoId = randomUUID();
  const ext = file.name.split('.').pop() || 'jpg';
  const safeFileName = `${photoId}.${ext}`;
  const dirPath = join(UPLOAD_DIR, 'job-logs', jobLogId);
  const filePath = join(dirPath, safeFileName);
  const storageKey = `job-logs/${jobLogId}/${safeFileName}`;

  await mkdir(dirPath, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const photo = await addJobLogPhoto(
    {
      jobLogId,
      storageKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: session.user.name
    },
    {
      actorUserId: session.user.id,
      actorName: session.user.name,
      actorRole: session.user.role
    }
  );

  return NextResponse.json(photo);
}
