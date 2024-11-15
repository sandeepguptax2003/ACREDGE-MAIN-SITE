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
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  createdAt: {
    type: admin.firestore.Timestamp,
    default: admin.firestore.FieldValue.serverTimestamp()
  }
};

module.exports = UserSchema;