require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const LoginRoutes = require("./routes/LoginRoute");
const UserRoutes = require("./routes/UserRoutes");
const ProfileImageRoutes = require("./routes/ProfileImageRoutes");
const propertyRoutes = require('./routes/PropertyRoutes');

const app = express();

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(compression());

app.use(cookieParser());
app.use(bodyParser.json());

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   })
// );

app.use(
  cors({
    origin: [
      'https://acredge-web--acredge-app-252ab.asia-east1.hosted.app',
      'https://admin-acredge-a801b.web.app/',
      'http://localhost:8000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      true
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("/api/auth", LoginRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/profile-image", ProfileImageRoutes);
app.use('/api/properties', propertyRoutes);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});