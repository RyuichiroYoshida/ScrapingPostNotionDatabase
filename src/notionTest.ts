import { Config } from "./config";
import {
  APIErrorCode,
  Client,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

type NotionPostData = {
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
 *
 * @since 2024-12-17
 */
class NotionTest {
  private readonly notionToken: string;
  private readonly databaseId: string;

  // 設定ファイルからパラメータを取得
  constructor() {
    this.notionToken = Config.NOTION_TOKEN;
    this.databaseId = Config.DATABASE_ID;

    this.initialize();
  }

  /**
   * Description
   * @returns {void}
   */
  async initialize() {
    const client = new Client({
      auth: this.notionToken,
    });

    //await this.getDatabase(client);
    await this.createDatabase(client);
  }

  /**
   * @summary データベースを取得する
   * @param {any} client - Notionのクライアント
   * @returns void
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
   * Description データベースを作成する
   * @param {any} client:any - Notionのクライアント
   * @param {NotionPostData} content:NotionPostData - データベースの内容
   * @returns {Promise<any>} response:any - レスポンス
   */
  async createDatabase(client: any, content: NotionPostData): Promise<any> {
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
      return response;
    } catch (error) {
      console.error("Failed Create Database:", error);
    }
  }
}

const params = new Config();
const notionTest = new NotionTest();
