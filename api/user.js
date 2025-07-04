// api/user.js

import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../libs/prisma.js";

const router = Router();
const SECRET = process.env.TOKEN;

const verifySpecialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
const verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
