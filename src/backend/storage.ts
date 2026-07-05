import supabase from './supabaseClient';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf'
];

/**
 * Storage Manager for managing uploads and retrieval of files/images.
 */
export const storageManager = {
  /**
   * Upload a file to a Supabase storage bucket.
   */
  async uploadFile(bucketName: string, path: string, file: File): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 5MB limit.`);
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported.`);
    }
    
    const { data, error } = await supabase.storage.from(bucketName).upload(path, file, {
      upsert: true,
      cacheControl: '3600'
    });
    
    if (error) {
      throw error;
    }
    
    return data.path;
  },

  /**
   * Get a signed URL for a file in a Supabase storage bucket.
   */
  async getUrl(bucketName: string, path: string, expiresIn = 3600): Promise<string> {
    if (!supabase) return '';
    
    // For private buckets, generate a signed URL
    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return '';
    }
    
    return data.signedUrl;
  },

  /**
   * Get the public URL for a file in a Supabase storage bucket.
   */
  getPublicUrl(bucketName: string, path: string): string {
    if (!supabase) return '';
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete a file from a bucket.
   */
  async deleteFile(bucketName: string, path: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }
    
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    
    if (error) {
      throw error;
    }
  }
};

export default storageManager;
