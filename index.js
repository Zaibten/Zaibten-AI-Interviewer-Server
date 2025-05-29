import express from "express";
import cors from "cors";
import { ApifyClient } from "apify-client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

app.get("/api/jobs", async (req, res) => {
  const {
    position = "web developer",
    country = "PK",
    location = "Karachi",
  } = req.query;

  try {
    const input = {
      position,
      country,
      location,
      maxItems: 10,
      parseCompanyDetails: true,
      saveOnlyUniqueItems: true,
      followApplyRedirects: true,
    };

    const run = await client.actor("hMvNSpz3JnHgl5jkh").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const formattedJobs = items.map((item) => ({
      title: item.positionName || "No Title",
      companyName: item.company || "Unknown Company",
      location: item.location || "No Location",
      url: item.url,
      description:
        item.companyInfo?.companyDescription || item.description || "No description available",
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to fetch data from Apify" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
