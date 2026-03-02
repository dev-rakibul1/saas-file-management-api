import crypto from 'crypto'
import { v2 as cloudinary } from 'cloudinary'
import env from '../../config/env'

type UploadToCloudinaryPayload = {
  userId: string
  mimeType: string
  contentBase64: string
}

type CloudinaryUploadResult = {
  publicId: string
  secureUrl: string
}

type BuildCloudinaryDownloadUrlPayload = {
  publicId: string
  extension: string
  mimeType: string
}

let cloudinaryConfigured = false

const ensureCloudinaryConfig = (): void => {
  if (cloudinaryConfigured) {
    return
  }

  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    )
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  cloudinaryConfigured = true
}

const buildUploadDataUri = (mimeType: string, contentBase64: string): string => {
  return `data:${mimeType};base64,${contentBase64}`
}

const uploadToCloudinary = async (
  payload: UploadToCloudinaryPayload
): Promise<CloudinaryUploadResult> => {
  ensureCloudinaryConfig()

  const uploadResult = await cloudinary.uploader.upload(
    buildUploadDataUri(payload.mimeType, payload.contentBase64),
    {
      resource_type: 'auto',
      folder: `${env.CLOUDINARY_FOLDER}/${payload.userId}`,
      public_id: `${Date.now()}-${crypto.randomUUID()}`,
      overwrite: false,
      unique_filename: false,
      use_filename: false,
    }
  )

  return {
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
  }
}

const deleteCloudinaryAsset = async (publicId: string): Promise<void> => {
  ensureCloudinaryConfig()

  const resourceTypes: Array<'image' | 'video' | 'raw'> = ['image', 'video', 'raw']

  for (const resourceType of resourceTypes) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      })

      if (result.result === 'ok' || result.result === 'not found') {
        return
      }
    } catch {
      // Try the next resource type for assets uploaded with auto mode.
    }
  }
}

const deleteCloudinaryAssets = async (publicIds: string[]): Promise<void> => {
  await Promise.all(publicIds.map(async (publicId) => deleteCloudinaryAsset(publicId)))
}

const resolveResourceType = (mimeType: string): 'image' | 'video' | 'raw' => {
  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'video'
  }

  return 'raw'
}

const buildPrivateDownloadUrl = (payload: BuildCloudinaryDownloadUrlPayload): string => {
  ensureCloudinaryConfig()

  return cloudinary.utils.private_download_url(payload.publicId, payload.extension, {
    resource_type: resolveResourceType(payload.mimeType),
    type: 'upload',
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  })
}

const isCloudinaryUrl = (fileUrl: string): boolean => {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return false
  }

  return fileUrl.includes(`res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}`)
}

export const CloudinaryStorage = {
  uploadToCloudinary,
  deleteCloudinaryAsset,
  deleteCloudinaryAssets,
  buildPrivateDownloadUrl,
  isCloudinaryUrl,
}
