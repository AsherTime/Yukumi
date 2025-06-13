import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const quality = parseInt(formData.get('quality') as string) || 80;
    const width = parseInt(formData.get('width') as string) || 1920;
    const height = parseInt(formData.get('height') as string) || 1080;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    const processedImageBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    const filePath = join(uploadDir, filename);
    
    // Ensure upload directory exists
    await writeFile(filePath, processedImageBuffer);

    // Return the URL path that can be used to access the image
    const imageUrl = `/uploads/${folder}/${filename}`;
    
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 