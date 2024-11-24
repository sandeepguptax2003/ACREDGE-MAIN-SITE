const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FOLDER_PATHS = {
  profileImage: 'UserProfileImage',
  propertyImages: 'PropertyImages',
  propertyVideos: 'PropertyVideos'
};

const generateFileName = (file, folder, entityId = '') => {
  const timestamp = new Date().getTime();
  const uuid = uuidv4();
  const ext = path.extname(file.originalname);
  const folderPath = entityId 
    ? `${FOLDER_PATHS[folder]}/${entityId}` 
    : FOLDER_PATHS[folder];
  return `${folderPath}/${timestamp}-${uuid}${ext}`;
};

const uploadToFirebase = async (file, folder, entityId = '') => {
  if (!file) return null;

  const fileName = generateFileName(file, folder, entityId);
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        entityId,
        originalName: file.originalname,
        uploadTimestamp: new Date().toISOString(),
        folder: FOLDER_PATHS[folder]
      }
    },
    resumable: false
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        console.error('Make public error:', error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
};

const uploadMultipleFiles = async (files, folder, entityId = '') => {
  if (!files) return [];
  
  try {
    const uploadPromises = files.map(file => uploadToFirebase(file, folder, entityId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
    console.error('Invalid fileUrl provided:', fileUrl);
    return;
  }
  
  try {
    let fileName;
    if (fileUrl.startsWith('https://storage.googleapis.com/')) {
      const bucketAndPath = fileUrl.replace('https://storage.googleapis.com/', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift(); // Remove bucket name
      fileName = pathParts.join('/');
    } else if (fileUrl.startsWith('gs://')) {
      const bucketAndPath = fileUrl.replace('gs://', '');
      const pathParts = bucketAndPath.split('/');
      pathParts.shift(); // Remove bucket name
      fileName = pathParts.join('/');
    } else {
      fileName = fileUrl;
    }

    fileName = fileName.split('?')[0];
    fileName = decodeURIComponent(fileName);
    
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    
    if (exists) {
      await file.delete();
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls) return;
  
  const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
  try {
    const deletePromises = urls.map(url => deleteFromFirebase(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple files:', error);
    throw error;
  }
};

module.exports = {
  uploadToFirebase,
  uploadMultipleFiles,
  deleteFromFirebase,
  deleteMultipleFiles,
  FOLDER_PATHS
};