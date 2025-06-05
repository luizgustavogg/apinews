import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import passport, { Passport } from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const App = express();
const prisma = new PrismaClient();
const router = express.Router();
App.use(express.json());
const SECRET = process.env.TOKEN;

App.use(
  session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

App.use(passport.initialize());
App.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALL_BACK_URL,
      scope: ["email", "profile"],
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

var verifySpecialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
var verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

App.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

App.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    const { displayName, emails } = req.user;
    const email = emails[0].value;

    let user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: displayName,
          email: email,
          password: sha256(crypto.randomBytes(16).toString("hex")),
        },
      });
    }

    const token = jwt.sign({ id: user.id, username: user.user }, SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login realizado com sucesso!",
      username: displayName,
      email: email,
      token: token,
    });
  }
);

App.get("/logout", (req, res) => {
  req.logOut(() => {
    return res.status(200).json({
      message: "Conta Deslogada com sucesso!",
    });
  });
});

App.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  const findUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (findUser) {
    return res.status(400).json({
      message: "Ja existe uma conta com este email!",
    });
  }

  if (verifySpecialCharacters.test(username)) {
    return res.status(400).json({
      message: "O Nome não pode conter caracteres especiais!",
    });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({
      message: "E-mail precisa ser valido!",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "A senha precisa conter pelo menos 8 caracteres!",
    });
  }

  const createUser = await prisma.user.create({
    data: {
      username: username,
      email: email,
      password: passwordHashed,
    },
  });

  return res.status(200).json({
    message: "Conta registrada com sucesso!",
  });
});

App.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!email || !password) {
    return res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  const findUser = await prisma.user.findFirst({
    where: {
      email: email,
      password: passwordHashed,
    },
  });

  if (!findUser) {
    return res.status(400).json({
      message: "Credenciais não conferem!",
    });
  }

  const token = jwt.sign(
    { id: findUser.id, username: findUser.username },
    SECRET,
    { expiresIn: "1h" }
  );
  return res.status(200).json({
    message: "Login realizado com sucesso!",
    token: token,
  });
});

App.listen(3000);
export default router;