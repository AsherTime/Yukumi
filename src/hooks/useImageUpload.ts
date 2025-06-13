import { useState } from 'react';

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface UseImageUploadOptions {
  folder: string;
  maxSizeMB?: number;
  quality?: number;
  width?: number;
  height?: number;
}

export function useImageUpload({
  folder,
  maxSizeMB = 5,
  quality = 80,
  width = 1920,
  height = 1080
}: UseImageUploadOptions) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0
  });

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      setUploadProgress({ status: 'uploading', progress: 0 });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('quality', quality.toString());
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      // Upload to our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      setUploadProgress({ status: 'processing', progress: 50 });

      const data = await response.json();
      
      setUploadProgress({ status: 'done', progress: 100 });
      
      return data.url;
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      });
      throw error;
    }
  };

  return { uploadImage, uploadProgress };
} 