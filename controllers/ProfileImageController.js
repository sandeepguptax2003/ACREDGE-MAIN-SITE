const { db } = require('../config/firebase');
const { uploadToFirebase, deleteFromFirebase } = require('../utils/FilesUpload');

exports.uploadProfileImage = async (req, res) => {
  try {
    const { phoneNumber } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Get current user profile
    const userDoc = await db.collection('UserProfile').doc(phoneNumber).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Delete old profile image if exists
    const currentData = userDoc.data();
    if (currentData.profileImage) {
      await deleteFromFirebase(currentData.profileImage);
    }

    // Upload new image
    const profileImageUrl = await uploadToFirebase(req.file, phoneNumber);

    // Update profile with new image URL
    await db.collection('UserProfile').doc(phoneNumber).update({
      profileImage: profileImageUrl,
      updatedAt: new Date()
    });

    res.status(200).json({
      message: "Profile image updated successfully",
      profileImage: profileImageUrl
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: "Error updating profile image" });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const { phoneNumber } = req.user;

    const userDoc = await db.collection('UserProfile').doc(phoneNumber).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const userData = userDoc.data();
    if (!userData.profileImage) {
      return res.status(400).json({ message: "No profile image exists" });
    }

    // Delete image from storage
    await deleteFromFirebase(userData.profileImage);

    // Update profile to remove image URL
    await db.collection('UserProfile').doc(phoneNumber).update({
      profileImage: null,
      updatedAt: new Date()
    });

    res.status(200).json({ message: "Profile image deleted successfully" });
  } catch (error) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({ message: "Error deleting profile image" });
  }
};