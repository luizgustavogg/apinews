import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import serverless from "serverless-http";

dotenv.config();

const app = express();
app.use(express.json());

const API_URL = process.env.API_URL;

async function fetchAndFilterArticles(url, withImage = true) {
  try {
    const response = await axios.get(url);
    let articles = response.data.data;
    articles = articles.filter(article => withImage ? article.image !== null : article.image == null);
    return articles;
  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    throw new Error("Erro ao puxar notícias.");
  }
}

app.get("/news-recent-image", async (req, res) => {
  try {
    const articles = await fetchAndFilterArticles(API_URL, true);

    const categorized = articles.reduce((acc, article) => {
      const cat = article.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {});

    res.json(categorized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/news-recent", async (req, res) => {
  try {
    const articles = await fetchAndFilterArticles(API_URL, false);

    const categorized = articles.reduce((acc, article) => {
      const cat = article.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {});

    res.json(categorized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const categories = [
  { path: "/news-business", env: "API_URL_CATEGORY_BUSINESS" },
  { path: "/news-entertainment", env: "API_URL_CATEGORY_ENTERTAINMENT" },
  { path: "/news-health", env: "API_URL_CATEGORY_HEALTH" },
  { path: "/news-science", env: "API_URL_CATEGORY_SCIENCE" },
  { path: "/news-sports", env: "API_URL_CATEGORY_SPORTS" },
  { path: "/news-technology", env: "API_URL_CATEGORY_TECHNOLOGY" },
];

// Gera rotas dinâmicas pra cada categoria
categories.forEach(({ path, env }) => {
  app.get(path, async (req, res) => {
    try {
      const url = process.env[env];
      if (!url) {
        return res.status(500).json({ error: `Variável de ambiente ${env} não configurada.` });
      }

      let articles = await fetchAndFilterArticles(url, true);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

export const handler = serverless(app);
export default app;