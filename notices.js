import express from "express";
import dotenv from "dotenv";
import axios from "axios";

const App = express();

const resultDotenv = dotenv.config();

if (resultDotenv.error) {
  throw resultDotenv.error;
}

const API_URL = process.env.API_URL

App.use(express.json());

App.get("/news-recent-image", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);
    
    // Separar por categoria

    const categorized = articles.reduce((acc, article) => {
      const cat = article.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {});

    res.json(categorized);
  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-recent", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image == null);
    
    // Separar por categoria

    const categorized = articles.reduce((acc, article) => {
      const cat = article.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {});

    res.json(categorized);
  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-business", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_BUSINESS);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-entertainment", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_ENTERTAINMENT);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-health", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_HEALTH);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-science", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_SCIENCE);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-sports", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_SPORTS);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.get("/news-technology", async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL_CATEGORY_TECHNOLOGY);
    let articles = response.data.data;
    articles = articles.filter((article) => article.image !== null);

    res.json(articles);

  } catch (error) {
    console.error("Erro ao puxar da API:", error.message);
    res.status(500).json({ error: "Erro ao puxar notícias." });
  }
});

App.listen(3000);
