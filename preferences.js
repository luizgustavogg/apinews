import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
const App = express();
const prisma = new PrismaClient();
import axios from 'axios';

App.use(express.json());
const router = express.Router();
const resultDotenv = dotenv.config();

if (resultDotenv.error) {
  throw resultDotenv.error;
}
var verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_URL = process.env.API_URL
const accessKey = process.env.accessKey
App.post("/preferences", async (req, res) => {
  const { email, category } = req.body;

  if (!email || !category) {
    return res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  if (!Array.isArray(category)) {
    return res
      .status(400)
      .json({ erro: "Formato inválido. Esperado um array de categorias." });
  }

  const expectedCategories = [
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology",
  ];

  const categoriasValidas = category.every((cat) =>
    expectedCategories.includes(cat.toLowerCase())
  );

  if (!categoriasValidas) {
    return res.status(400).json({
      message: "Categoria inválida!",
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
      message: "E-mail precisa ser válido!",
    });
  }

  try {
    const existingPreferences = await prisma.preference.findMany({
      where: { userEmail: email },
      select: { category: true },
    });

    const existingCategories = existingPreferences.map((pref) =>
      pref.category.toLowerCase()
    );

    const newCategories = category.filter(
      (cat) => !existingCategories.includes(cat.toLowerCase())
    );

    if (newCategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Todas as categorias já foram adicionadas." });
    }

    await Promise.all(
      newCategories.map(async (cat) => {
        await prisma.preference.create({
          data: {
            category: cat.toLowerCase(),
            userEmail: email,
          },
        });
      })
    );

    return res.status(200).json({
      message: "Preferências criadas com sucesso!",
      adicionadas: newCategories,
    });
  } catch (erro) {
    console.error("Erro ao criar categorias:", erro);
    return res
      .status(500)
      .json({ erro: "Deu ruim ao salvar categorias." });
  }
});


App.post("/preferences-remove", async (req, res) => {
  const { email, category } = req.body;

  if (!email || !category) {
    res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }
  if (!Array.isArray(category)) {
    return res
      .status(400)
      .json({ erro: "Formato inválido. Esperado um array de categorias." });
  }

  const expectedCategories = [
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology",
  ];

  const categoriasValidas = category.every((cat) =>
    expectedCategories.includes(cat.toLowerCase())
  );

  if (!categoriasValidas) {
    return res.status(400).json({
      message: "Categoria não confere!",
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

  try {
    await Promise.all(
      category.map(async (cat) => {
        return await prisma.preference.deleteMany({
          where: {
            category: cat,
            userEmail: email,
          },
        });
      })
    );
  } catch (erro) {
    console.error("Erro ao deletar categorias:", erro);
    res.status(500).json({ erro: "Deu ruim ao salvar categorias." });
  }

  return res.status(200).json({
    message: "Preference deletada com sucesso!",
  });
});

App.get("/news-preferences", async (req, res) => {
  const {email} = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  try {
    const findPreferences = await prisma.preference.findMany({
      where: { userEmail: email },
    });

    if (findPreferences.length === 0) {
      return res.status(404).json({ error: "Nenhuma preferência encontrada." });
    }

    const preferencesUser = findPreferences
      .map((pref) => pref.category.toLowerCase())
      .join(",");

    console.log("Preferências do usuário:", preferencesUser);

    const accessKey = process.env.accessKey;

    const url = `https://api.mediastack.com/v1/news?access_key=${accessKey}&countries=br&categories=${preferencesUser}&limit=100`;

    const response = await axios.get(url);

    let articles = response.data.data;

    articles = articles.filter((article) => article.image !== null);

    const categorized = articles.reduce((acc, article) => {
      const cat = article.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {});

    return res.json(categorized);
  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    return res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});


App.listen(3000);
export default router;