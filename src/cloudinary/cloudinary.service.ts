import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {

  async uploadImage(
    file: Express.Multer.File,
    folder = 'products',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed'));
          resolve(result);
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(upload);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) return;

      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  }

  private extractPublicId(imageUrl: string): string | null {
    if (!imageUrl) return null;

    const parts = imageUrl.split('/');
    const filename = parts.pop();
    if (!filename) return null;

    const folder = parts.pop();
    const publicId = filename.split('.')[0];

    return folder ? `${folder}/${publicId}` : publicId;
  }
}

