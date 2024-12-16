import { Config } from "./config";
import {
  APIErrorCode,
  Client,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

class NotionTest {
  private readonly notionToken: string;
  private readonly databaseId: string;

  constructor() {
    this.notionToken = Config.NOTION_TOKEN;
    this.databaseId = Config.DATABASE_ID;

    this.initialize();
  }

  async initialize() {
    const client = new Client({
      auth: this.notionToken,
    });

    //await this.getDatabase(client);
    await this.createDatabase(client);
  }

  async getDatabase(client: any) {
    try {
      const response = await client.databases.retrieve({
        database_id: this.databaseId,
      });
      console.log(response);
      console.log(response.results[0].properties);
    } catch (error: unknown) {
      if (isNotionClientError(error)) {
        switch (error.code) {
          case ClientErrorCode.RequestTimeout:
            console.error("Request timed out");
            break;
          case APIErrorCode.ObjectNotFound:
            console.error("Object not found");
            break;
          case APIErrorCode.Unauthorized:
            console.error("Unauthorized");
            break;
          default:
            console.error("Failed Get Database:", error);
        }
      }
    }
  }

  async createDatabase(client: any) {
    try {
      const response = await client.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          会社HP: {
            url: null,
          },
          クライアント: {
            multi_select: [
              {
                name: "C#",
              },
            ],
          },
          会社がやってる事: {
            rich_text: [
              {
                text: {
                  content: "Hoge",
                },
              },
            ],
          },
          サーバー: {
            multi_select: [
              {
                name: "C#",
              },
            ],
          },
          面接対策ページ: {
            url: null,
          },
          採用ページ: {
            url: null,
          },
          所在地: {
            rich_text: [
              {
                text: {
                  content: "Hoge",
                },
              },
            ],
          },
          企業名: {
            title: [
              {
                text: {
                  content: "Hoge",
                },
              },
            ],
          },
        },
      });
      console.log(response);
    } catch (error) {
      console.error("Failed Create Database:", error);
    }
  }
}

const params = new Config();
const notionTest = new NotionTest();
