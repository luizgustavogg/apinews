import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const App = express();
const prisma = new PrismaClient();

App.use(express.json());

var verifySpecialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
var verifySpace = /\s/g;
var verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECRET = process.env.TOKEN;

export function sha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
