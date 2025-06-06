// api/notices.js
import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import serverless from "serverless-http";
import redis from "../libs/redis.js";

dotenv.config();

const app = express();
app.use(express.json());

const API_URL = process.env.API_URL;

async function fetchAndCacheArticles(url, cacheKey, withImage = true) {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  console.time("fetchNews");
  const response = await axios.get(url, { timeout: 5000 });
  console.timeEnd("fetchNews");
  let articles = response.data.data;
  articles = articles.filter((article) =>
    withImage ? article.image !== null : article.image == null
  );

  await redis.set(cacheKey, JSON.stringify(articles), { ex: 3600 });
  return articles;
}

function categorize(articles) {
  return articles.reduce((acc, article) => {
    const cat = article.category || "uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {});
}

app.get("/news-recent-image", async (req, res) => {
  try {
    const articles = await fetchAndCacheArticles(
      API_URL,
      "news:recent:image",
      true
    );
    res.json(categorize(articles));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/news-recent", async (req, res) => {
  try {
    const articles = await fetchAndCacheArticles(
      API_URL,
      "news:recent:noimage",
      false
    );
    res.json(categorize(articles));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const categories = [
  {
    path: "/news-business",
    env: "API_URL_CATEGORY_BUSINESS",
    key: "category:business",
  },
  {
    path: "/news-entertainment",
    env: "API_URL_CATEGORY_ENTERTAINMENT",
    key: "category:entertainment",
  },
  {
    path: "/news-health",
    env: "API_URL_CATEGORY_HEALTH",
    key: "category:health",
  },
  {
    path: "/news-science",
    env: "API_URL_CATEGORY_SCIENCE",
    key: "category:science",
  },
  {
    path: "/news-sports",
    env: "API_URL_CATEGORY_SPORTS",
    key: "category:sports",
  },
  {
    path: "/news-technology",
    env: "API_URL_CATEGORY_TECHNOLOGY",
    key: "category:technology",
  },
];

categories.forEach(({ path, env, key }) => {
  app.get(path, async (req, res) => {
    try {
      const url = process.env[env];
      if (!url)
        return res
          .status(500)
          .json({ error: `Variável ${env} não configurada.` });

      const articles = await fetchAndCacheArticles(url, `news:${key}`, true);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

export const handler = serverless(app);
export default app;
