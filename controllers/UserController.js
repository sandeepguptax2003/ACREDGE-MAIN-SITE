const { db } = require('../config/firebase');

exports.updateProfile = async (req, res) => {
  try {
    const { phoneNumber } = req.user;
    const { email, firstName, lastName, address, aboutMe } = req.body;

    const updateData = {};
    
    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (address !== undefined) updateData.address = address;
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // email validation
    if (email !== undefined && !isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

    await db.collection('UserProfile')
      .doc(phoneNumber)
      .update(updateData);

    res.status(200).json({
      message: "Profile updated successfully",
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

exports.getProfile = async (req, res) => {
  try {
    const { phoneNumber } = req.user;
    
    const userDoc = await db.collection('UserProfile')
      .doc(phoneNumber)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};