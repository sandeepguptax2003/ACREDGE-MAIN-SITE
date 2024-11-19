const admin = require('firebase-admin');

const UserSchema = {
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  sameNumberOnWhatsapp: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  aboutMe: {
    type: String,
    default: ''
  },
  createdAt: {
    type: admin.firestore.Timestamp,
    default: admin.firestore.FieldValue.serverTimestamp()
  }
};

module.exports = UserSchema;