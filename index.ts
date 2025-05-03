import axios from "axios";
import express from "express";
import fs from "fs";
import morgan from "morgan";
import cors from "cors";
import { Server } from "http";
import * as cheerio from "cheerio";
import path from "path";
import "dotenv/config";

const startUrls: string[] = JSON.parse(process.env.startUrl || "[]");

let urlsToVisit: string[] = [...startUrls];
let visitedUrls: Set<string> = new Set();

const maxCrawlLength: number = parseInt(process.env.maxCrawl || "10", 10);

interface CrawledData {
  url: string;
  title: string;
  description: string;
}

const stringHas = (str: string, arr: string[]): boolean => {
  for (let x of arr) {
    if (str.includes(x)) {
      return true;
    }
  }
  return false;
}

const crawler = async (): Promise<CrawledData[]> => {
  let crawledCount = 0;
  let crawledData: CrawledData[] = []; // Array to store title and description

  while (urlsToVisit.length > 0 && crawledCount < maxCrawlLength) {
    const currentUrl = urlsToVisit.shift() as string;

    if (visitedUrls.has(currentUrl)) {
      continue;
    }

    visitedUrls.add(currentUrl);

    try {
      const response = await axios.get(currentUrl);

      const $ = cheerio.load(response.data);

      const linkElements = $("a[href]");
      let title: string = $("title").text().trim() || "";
      let metaDescription: string = $('meta[name="description"]').attr("content") || "";

      // Sanitize title and description
      
      title = title
      .replace(/[\r\n]+/g, " ")
      .replace(/["']/g, "")
      .replace(/\\/g, "");

      metaDescription = metaDescription
      .replace(/[\r\n]+/g, " ")
      .replace(/["']/g, "")
      .replace(/\\/g, "");

      // Save the title and description for the current URL
      crawledData.push({ url: currentUrl, title, description: metaDescription });

      linkElements.each((_: number, element: cheerio.Element) => {
        let url = $(element).attr("href") || "";

        if (!url.startsWith("http")) {
          url = new URL(url, currentUrl).href;
        }
        if (url.includes("#")) {
          return;
        }

        if (
          startUrls.some((startUrl) => url.startsWith(startUrl)) &&
          !visitedUrls.has(url) &&
          !urlsToVisit.includes(url) &&
          !stringHas(url, JSON.parse(process.env.blockList || "[]"))
        ) {
          crawledCount++;
          urlsToVisit.push(url);
          console.log(`Indexed URL: ${url}`);
        }
      });
    } catch (error: any) {
      console.error(`Error fetching ${currentUrl}: ${error.message}`);
    }
  }
  return crawledData; // Return the crawled data
};

const urls = crawler();

let crawled_data: CrawledData[] = []

urls
  .then((crawledData) => {
    // Write the crawled data to a JSON file
    fs.writeFileSync("crawledData.json", JSON.stringify(crawledData, null, 2));
    crawled_data = crawledData;
    console.log("Crawled data saved to crawledData.json");
  })
  .catch((error) => {
    console.error(`Error during crawling: ${error.message}`);
  });

const app = express();

app.use(cors());
app.use(morgan(":method :url :status"));
app.use(express.json());

app.get("/api/AllData", async (req, res) => {
  if (crawled_data.length < 1) await urls;
  res.send(crawled_data);
})

app.get("/api/crawledData/:count", async (req, res) => {
  if (crawled_data.length < 1) await urls;
  let tmp = crawled_data
    if (tmp.length > Number(req.params.count)) {
      tmp.length = Number(req.params.count)
    };
    res.send(tmp);
});

app.get("/api/search/:query", async (req, res) => {
  if (crawled_data.length < 1) await urls;
  let query = decodeURIComponent(req.params.query.toLowerCase());
  let new_data: CrawledData[] = [];
  for (let a of crawled_data) {
    if (a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query) || a.url.toLowerCase().includes(query)) {
      new_data.push(a);
    }
    if (new_data.length > 40) {
      break;
    }
  }
  res.send(new_data);
});

app.use(express.static(path.join(__dirname, "web")));

let server: Server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

const shutdown = () => {
  server.close(() => {
    console.log('Server closed. Exiting process...');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGQUIT', shutdown);