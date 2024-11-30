const { db } = require('../config/firebase');
const Property = require('../models/PropertyModel');

exports.getUserStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('UserProfile').get();
    const totalUsers = usersSnapshot.size;

    res.status(200).json({
      totalUsers
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: "Error fetching user statistics" });
  }
};

exports.getPropertyStats = async (req, res) => {
  try {
    const propertiesSnapshot = await db.collection(Property.collectionName).get();
    const totalProperties = propertiesSnapshot.size;

    res.status(200).json({
      totalProperties
    });
  } catch (error) {
    console.error('Property stats error:', error);
    res.status(500).json({ message: "Error fetching property statistics" });
  }
};