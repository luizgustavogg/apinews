import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import serverless from "serverless-http";
import prisma from "../libs/prisma.js";

dotenv.config();

const app = express();

app.use(express.json());

const verifyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const expectedCategories = [
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "technology",
];

function validateCategories(categories) {
  return (
    Array.isArray(categories) &&
    categories.every((cat) => expectedCategories.includes(cat.toLowerCase()))
  );
}

app.post("/preferences", async (req, res) => {
  const { email, category } = req.body;

  if (!email || !category) {
    return res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  if (!validateCategories(category)) {
    return res.status(400).json({
      message: "Categoria inválida!",
    });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({
      message: "E-mail precisa ser válido!",
    });
  }

  try {
    const findUser = await prisma.user.findFirst({ where: { email } });
    if (!findUser) {
      return res.status(400).json({ message: "Conta não encontrada!" });
    }

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
      return res.status(400).json({
        message: "Todas as categorias já foram adicionadas.",
      });
    }

    await Promise.all(
      newCategories.map((cat) =>
        prisma.preference.create({
          data: { category: cat.toLowerCase(), userEmail: email },
        })
      )
    );

    return res.status(200).json({
      message: "Preferências criadas com sucesso!",
      adicionadas: newCategories,
    });
  } catch (error) {
    console.error("Erro ao criar categorias:", error);
    return res.status(500).json({ erro: "Deu ruim ao salvar categorias." });
  }
});

app.post("/preferences-remove", async (req, res) => {
  const { email, category } = req.body;

  if (!email || !category) {
    return res.status(400).json({
      message: "Todos os campos precisam ser preenchidos!",
    });
  }

  if (!validateCategories(category)) {
    return res.status(400).json({
      message: "Categoria não confere!",
    });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({
      message: "E-mail precisa ser válido!",
    });
  }

  try {
    const findUser = await prisma.user.findFirst({ where: { email } });
    if (!findUser) {
      return res.status(400).json({ message: "Conta não encontrada!" });
    }

    await Promise.all(
      category.map((cat) =>
        prisma.preference.deleteMany({
          where: { category: cat.toLowerCase(), userEmail: email },
        })
      )
    );

    return res.status(200).json({
      message: "Preferência(s) deletada(s) com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao deletar categorias:", error);
    return res.status(500).json({ erro: "Deu ruim ao deletar categorias." });
  }
});

app.get("/news-preferences", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  if (!verifyEmail.test(email)) {
    return res.status(400).json({ error: "E-mail precisa ser válido!" });
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

    const accessKey = process.env.accessKey;
    const url = `${process.env.API_BASE_URL}?access_key=${accessKey}&countries=br&categories=${preferencesUser}&limit=100`;
    console.log('url', url);

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

export default app;