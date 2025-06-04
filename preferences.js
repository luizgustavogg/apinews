import express from "express";
import { PrismaClient } from "@prisma/client";

const App = express();
const prisma = new PrismaClient();

App.use(express.json());

var verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

App.post("/preferences", async (req, res) => {
  const { email, category } = req.body;
    
  if (!email || !category) {
    res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  const findUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!findUser) {
    return res.status(400).json({
      message: "Conta não encontrada!",
    });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({
      message: "E-mail precisa ser valido!",
    });
  }

  const createPreference = await prisma.preference.create({
    data: {
      category: category,
      userEmail: email,
    },
  });

  return res.status(200).json({
    message: "Preference criada com sucesso!",
  });
});

App.listen(3000);
