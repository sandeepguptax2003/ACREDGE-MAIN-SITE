const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FOLDER_PATHS = {
  profileImage: 'UserProfileImage'
};

const generateFileName = (file, phoneNumber) => {
    const ext = path.extname(file.originalname);
    return `${FOLDER_PATHS.profileImage}/${phoneNumber}/profile${ext}`;
  };

const uploadToFirebase = async (file, phoneNumber) => {
    if (!file) return null;
  
    const fileName = generateFileName(file, phoneNumber);
    const fileUpload = bucket.file(fileName);
  
    // Create directory structure first
    const dirPath = `${FOLDER_PATHS.profileImage}/${phoneNumber}`;
    await bucket.file(dirPath + '/.placeholder').save('');
  
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadTimestamp: new Date().toISOString(),
          phoneNumber,
          directory: dirPath
        }
      },
      resumable: false
    });
  
    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => reject(error));
      blobStream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      });
      blobStream.end(file.buffer);
    });
  };

const deleteFromFirebase = async (fileUrl) => {
    if (!fileUrl) return;
    
    try {
      const fileName = fileUrl.split(`${bucket.name}/`)[1];
      const file = bucket.file(fileName);
      await file.delete();
  
      // Clean up empty directory after deletion
      const dirPath = fileName.substring(0, fileName.lastIndexOf('/'));
      const [files] = await bucket.getFiles({ prefix: dirPath });
      if (files.length === 0) {
        await bucket.file(dirPath + '/.placeholder').delete().catch(() => {});
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  FOLDER_PATHS
};