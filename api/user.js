import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../libs/prisma.js";

const router = Router();
const SECRET = process.env.TOKEN;

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
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err, user, info) => {
    if (err || !user) {
      return res
        .status(401)
        .json({ message: "Falha na autenticação com o Google." });
    }

    try {
      const { displayName, emails } = user;
      const email = emails[0].value;

      let existingUser = await prisma.user.findFirst({ where: { email } });

      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            username: displayName,
            email,
            password: sha256(crypto.randomBytes(16).toString("hex")),
          },
        });
      }

      const token = jwt.sign(
        { id: existingUser.id, username: existingUser.username },
        SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Login realizado com sucesso!",
        username: existingUser.username,
        email: existingUser.email,
        token,
      });
    } catch (error) {
      console.error("Erro durante o login com Google:", error);
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    return res.status(200).json({ message: "Conta deslogada com sucesso!" });
  });
});

// Registro
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Todos os campos precisam ser preenchidos!" });
  }

  const findUser = await prisma.user.findFirst({ where: { email } });

  if (findUser) {
    return res
      .status(400)
      .json({ message: "Já existe uma conta com este email!" });
  }

  if (verifySpecialCharacters.test(username)) {
    return res
      .status(400)
      .json({ message: "O nome não pode conter caracteres especiais!" });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({ message: "E-mail precisa ser válido!" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "A senha precisa conter pelo menos 8 caracteres!" });
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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const passwordHashed = sha256(password);

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Todos os campos precisam ser preenchidos!" });
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

  const token = jwt.sign(
    { id: findUser.id, username: findUser.username },
    SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({
    message: "Login realizado com sucesso!",
    token,
  });
});

export default router;
