import sharp from 'sharp';

interface ProcessImageOptions {
  quality?: number;
  width?: number;
  height?: number;
}

/**
 * Converts an image to WebP format and optimizes it
 * @param file - The image file to process
 * @param options - Processing options (quality, width, height)
 * @returns Promise<Buffer> - The processed image as a Buffer
 */
export async function processImageToWebP(
  file: File,
  options: ProcessImageOptions = {}
): Promise<Buffer> {
  // Default options
  const {
    quality = 80, // Default quality
    width,
    height,
  } = options;

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with sharp
  let sharpImage = sharp(buffer);

  // Resize if dimensions are provided
  if (width || height) {
    sharpImage = sharpImage.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to WebP and optimize
  const processedImage = await sharpImage
    .webp({ quality })
    .toBuffer();

  return processedImage;
}

/**
 * Validates if the file is an acceptable image type
 * @param file - The file to validate
 * @returns boolean
 */
export function isValidImageType(file: File): boolean {
  const acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp'
  ];
  return acceptedTypes.includes(file.type);
}

/**
 * Gets the file size in MB
 * @param file - The file to check
 * @returns number
 */
export function getFileSizeInMB(file: File): number {
  return file.size / (1024 * 1024);
} 