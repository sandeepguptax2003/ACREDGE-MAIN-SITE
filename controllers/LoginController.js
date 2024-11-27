const { admin, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const NodeCache = new require('node-cache');
const tokenCache = new NodeCache({ stdTTL: 300 });

exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken, rememberMe, sameWhatsapp } = req.body;

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign({ phoneNumber }, process.env.JWT_SECRET, { expiresIn });

    const expirationDate = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    
    // Store token in Firestore
    await db.collection('tokens').doc(phoneNumber).set({
      token,
      expiresAt: admin.firestore.Timestamp.fromDate(expirationDate)
    });

    // Check and update user profile in Firestore
    const userProfile = await db
      .collection('UserProfile')
      .doc(phoneNumber)
      .get();

    if (!userProfile.exists) {
      await db.collection('UserProfile').doc(phoneNumber).set({
        phoneNumber,
        sameNumberOnWhatsapp: sameWhatsapp ? phoneNumber : '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: "Logged in successfully",
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: "Verification error occurred." });
  }
};

// The isAuthenticated and logout functions remain the same
exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const cachedToken = tokenCache.get(decoded.phoneNumber);
    if (cachedToken === token) {
      req.user = { phoneNumber: decoded.phoneNumber };
      return next();
    }

    const tokenDoc = await db
      .collection('tokens')
      .doc(decoded.phoneNumber)
      .get();

    if (!tokenDoc.exists || tokenDoc.data().token !== token || 
        tokenDoc.data().expiresAt.toDate() < new Date()) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    tokenCache.set(decoded.phoneNumber, token);
    req.user = { phoneNumber: decoded.phoneNumber };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Authentication failed." });
  }
};

// exports.isAuthenticated = async (req, res, next) => {
//   try {
//     const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

//     if (!token) {
//       return res.status(401).json({ message: "No token provided." });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (error) {
//       return res.status(401).json({ message: "Invalid token." });
//     }

//     // Handle both user and admin tokens
//     const cacheKey = decoded.phoneNumber || decoded.email;
//     if (!cacheKey) {
//       return res.status(401).json({ message: "Invalid token format." });
//     }

//     const cachedToken = tokenCache.get(cacheKey);
//     if (cachedToken === token) {
//       req.user = decoded.phoneNumber ? 
//         { phoneNumber: decoded.phoneNumber } : 
//         { email: decoded.email };
//       return next();
//     }

//     // Check token in database
//     const tokenDoc = await db
//       .collection('tokens')
//       .doc(cacheKey)
//       .get();

//     if (!tokenDoc.exists || tokenDoc.data().token !== token || 
//         tokenDoc.data().expiresAt.toDate() < new Date()) {
//       return res.status(401).json({ message: "Invalid or expired token." });
//     }

//     tokenCache.set(cacheKey, token);
//     req.user = decoded.phoneNumber ? 
//       { phoneNumber: decoded.phoneNumber } : 
//       { email: decoded.email };
//     next();
//   } catch (error) {
//     console.error('Auth error:', error);
//     res.status(401).json({ message: "Authentication failed." });
//   }
// };

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ 
        message: "Already Logged Out, Please login again to continue." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await db.collection('tokens').doc(decoded.phoneNumber).delete();
    tokenCache.del(decoded.phoneNumber);

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Logout error occurred." });
  }
};