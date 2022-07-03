import express from "express";
import mongoose from "mongoose";
import registerUserTemplate from "./model/schema.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import middleWare from "./middleWare.js";
import dotenv from "dotenv";
const app = express();

mongoose.connect(
  "mongodb+srv://jwt:12345@cluster0.96rde.mongodb.net/jwt?retryWrites=true&w=majority",
  () => {
    console.log("DB Connected");
  }
);

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello");
});

//  Register

app.post("/register", async (req, res) => {
  try {
    const { userName, email, password, confirmPassword } = req.body;
    let exist = await registerUserTemplate.findOne({ email: email });
    if (exist) {
      return res.status(400).send("Email Already Exists");
    }
    if (password != confirmPassword) {
      return res.status(400).send("Password Mismatch");
    }

    const newUser = new registerUserTemplate({
      userName,
      email,
      password,
      confirmPassword,
    });

    newUser.save();
    return res.status(200).send("Registered Successfully");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Server Error");
  }
});

// login

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let exist = await registerUserTemplate.findOne({ email: email });
    if (!exist) {
      return res.status(400).send("Email does not exist in DB");
    }
    if (exist.password != password) {
      return res.status(400).send("Invalid Credentials");
    }

    let payload = {
      user: {
        id: exist.id,
      },
    };

    jwt.sign(payload, "jwtKey", { expiresIn: 3600000 }, (err, token) => {
      if (err) {
        throw err;
      }
      return res.json({ token });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Server Error");
  }
});

// myProfile Details

app.get("/myprofile", middleWare, async (req, res) => {
  try {
    let exist = await registerUserTemplate.findById(req.user.id);
    if (!exist) {
      return res.status(400).send("User Not Found");
    }
    return res.json(exist);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// Step for Heroku

if (process.env.NODE_ENV == "production") {
  app.use(express.static("client/build"));
}

app.listen(PORT, () => {
  console.log(`Server running at port http://localhost:${PORT} `);
});
