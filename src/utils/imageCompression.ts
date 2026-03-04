/**
 * Image Compression Utility
 * Provides client-side image compression before upload to reduce storage costs
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

// Predefined compression presets for different use cases
export const CompressionPresets = {
  // For inspection photos - good balance of quality and size
  inspection: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.7,
    format: 'webp' as const,
  },
  // For receipt photos - smaller since they're mostly text
  receipt: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.6,
    format: 'webp' as const,
  },
  // For incident photos - higher quality for insurance/legal purposes
  incident: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.8,
    format: 'webp' as const,
  },
  // For company logos - smaller, optimized for display
  logo: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.9,
    format: 'png' as const,
  },
  // For thumbnails
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.6,
    format: 'webp' as const,
  },
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 string
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = CompressionPresets.inspection
): Promise<string> => {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.7, format = 'webp' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use better quality resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to desired format
        const mimeType = format === 'webp' ? 'image/webp' : 
                        format === 'png' ? 'image/png' : 'image/jpeg';
        
        // Check if WebP is supported, fallback to JPEG
        const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const actualMimeType = (format === 'webp' && !supportsWebP) ? 'image/jpeg' : mimeType;
        
        const compressedDataUrl = canvas.toDataURL(actualMimeType, quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress a base64 image string
 * @param base64 - The base64 image string
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 string
 */
export const compressBase64 = async (
  base64: string,
  options: CompressionOptions = CompressionPresets.inspection
): Promise<string> => {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.7, format = 'webp' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const mimeType = format === 'webp' ? 'image/webp' : 
                      format === 'png' ? 'image/png' : 'image/jpeg';
      
      const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
      const actualMimeType = (format === 'webp' && !supportsWebP) ? 'image/jpeg' : mimeType;
      
      resolve(canvas.toDataURL(actualMimeType, quality));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
};

/**
 * Get estimated file size from base64 string
 * @param base64 - The base64 string
 * @returns Size in bytes
 */
export const getBase64Size = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  // Calculate size (base64 is ~4/3 of original size)
  return Math.ceil((base64Data.length * 3) / 4);
};

/**
 * Format bytes to human readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Compress multiple images in parallel
 * @param files - Array of files to compress
 * @param options - Compression options
 * @returns Promise resolving to array of compressed base64 strings
 */
export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = CompressionPresets.inspection
): Promise<string[]> => {
  return Promise.all(files.map(file => compressImage(file, options)));
};

export default {
  compressImage,
  compressBase64,
  compressMultipleImages,
  getBase64Size,
  formatFileSize,
  CompressionPresets,
};
