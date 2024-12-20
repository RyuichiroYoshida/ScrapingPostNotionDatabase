import { Config } from "./config";
import {
  APIErrorCode,
  Client,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

export type NotionPostData = {
  CompanyName: string;
  CompanyMessage: string;
  Business: string;
  CompanyUrl: string;
  Location: string;
};

/**
 * @summary Notionのデータベースにアクセスする
 *
 * @method getDatabase - データベースを取得する
 * @method createDatabase - データベースを作成する
 */
export class NotionManager {
  private readonly notionToken: string;
  private readonly databaseId: string;

  private client: Client;

  // 設定ファイルからパラメータを取得
  constructor() {
    this.notionToken = Config.NOTION_TOKEN;
    this.databaseId = Config.DATABASE_ID;

    this.client = new Client({
      auth: this.notionToken,
    });
  }

  /**
   * @summary データベースを取得する
   * @param {any} client - Notionのクライアント
   */
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

  /**
   * @summary データベースを作成する
   * @param {any} client:any - Notionのクライアント
   * @param {NotionPostData} content:NotionPostData - データベースの内容
   */
  async createDatabase(client: any, content: NotionPostData) {
    try {
      const response = await client.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          会社HP: {
            url: content.CompanyUrl,
          },
          事業内容: {
            rich_text: [
              {
                text: {
                  content: content.Business,
                },
              },
            ],
          },
          所在地: {
            rich_text: [
              {
                text: {
                  content: content.Location,
                },
              },
            ],
          },
          テキスト: {
            rich_text: [
              {
                text: {
                  content: content.CompanyMessage,
                },
              },
            ],
          },
          企業名: {
            title: [
              {
                text: {
                  content: content.CompanyName,
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
const notionTest = new NotionManager();
