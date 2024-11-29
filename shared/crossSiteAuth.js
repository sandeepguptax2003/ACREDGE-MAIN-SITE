// const jwt = require('jsonwebtoken');

// exports.verifyUserForAdminRoutes = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: "No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Only allow USER tokens to access admin routes
//     if (decoded.role !== 'USER') {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token." });
//   }
// };

// exports.verifyAdminForUserRoutes = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: "No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Only allow ADMIN tokens to access user routes
//     if (decoded.role !== 'ADMIN') {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token." });
//   }
// };