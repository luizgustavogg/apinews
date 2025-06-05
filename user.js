import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import serverless from "serverless-http";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

const SECRET = process.env.TOKEN;

app.use(
  session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

const verifySpecialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
const verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Rotas Google
app.get("/auth/google", passport.authenticate("google", {
  scope: ["email", "profile"],
}));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), async (req, res) => {
  const { displayName, emails } = req.user;
  const email = emails[0].value;

  let user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: displayName,
        email,
        password: sha256(crypto.randomBytes(16).toString("hex")),
      },
    });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1h" });

  res.status(200).json({
    message: "Login realizado com sucesso!",
    username: displayName,
    email,
    token,
  });
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    return res.status(200).json({ message: "Conta deslogada com sucesso!" });
  });
});

// Registro
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Todos os campos precisam ser preenchidos!" });
  }

  const findUser = await prisma.user.findFirst({ where: { email } });

  if (findUser) {
    return res.status(400).json({ message: "Já existe uma conta com este email!" });
  }

  if (verifySpecialCharacters.test(username)) {
    return res.status(400).json({ message: "O nome não pode conter caracteres especiais!" });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({ message: "E-mail precisa ser válido!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "A senha precisa conter pelo menos 8 caracteres!" });
  }

  await prisma.user.create({
    data: {
      username,
      email,
      password: passwordHashed,
    },
  });

  return res.status(200).json({ message: "Conta registrada com sucesso!" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!email || !password) {
    return res.status(400).json({ message: "Todos os campos precisam ser preenchidos!" });
  }

  const findUser = await prisma.user.findFirst({
    where: {
      email,
      password: passwordHashed,
    },
  });

  if (!findUser) {
    return res.status(400).json({ message: "Credenciais não conferem!" });
  }

  const token = jwt.sign({ id: findUser.id, username: findUser.username }, SECRET, { expiresIn: "1h" });

  return res.status(200).json({
    message: "Login realizado com sucesso!",
    token,
  });
});

// Exporta handler pra Vercel
export const handler = serverless(app);
