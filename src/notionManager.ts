import { Config } from "./config";
import {
  APIErrorCode,
  Client,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

// Notionのデータベースに送信するデータ
export type CompanyData = {
  CompanyName: string;
  CompanyMessage: string;
  Business: string;
  CompanyUrl: string;
  Location: string;
};

// Notionのデータベース内のページに書くデータ
export type CompanyMessage = {
  Captions: string[];
  MainTitle: string;
  BodyText: string;
};

/**
 * @summary NotionApiを操作するクラス
 * @constructor 環境変数の設定とNotionのクライアントを初期化
 * @method getDatabase - データベースを取得
 * @method createDatabase - データベースを作成
 */
export class NotionManager {
  private readonly notionToken: string;
  private readonly databaseId: string;

  private client: any;

  // 設定ファイルからパラメータを取得
  public constructor() {
    this.notionToken = Config.NOTION_TOKEN;
    this.databaseId = Config.DATABASE_ID;

    this.client = new Client({
      auth: this.notionToken,
    });
  }

  /**
   * @summary データベースを取得する (テスト用)
   */
  public async testGetDatabase() {
    try {
      const response = await this.client.databases.retrieve({
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
   * @param {CompanyData} content:NotionPostData - データベースの内容
   * @param {CompanyMessage} childContent:CompanyMessage - 子ページの内容
   */
  public async createDatabase(content: CompanyData, childContent: CompanyMessage) {
    try {
      const response = await this.client.pages.create({
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
      await this.createChildPage(childContent, response.id);

      console.log(response);
    } catch (error) {
      console.error("Failed Create Database:", error);
    }
  }

  /**
   * @summary データベース内に子ページを作成する
   * @param {CompanyMessage} messages - 子ページに書き込む内容
   * @param {any} pageId:string
   */
  private async createChildPage(messages: CompanyMessage, pageId: string) {
    try {
      const res = await this.client.blocks.children.append({
        block_id: pageId,
        children: [
          {
            heading_3: {
              rich_text: [
                {
                  text: {
                    content: "MainTitle",
                  },
                },
              ],
            },
          },
          {
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: messages.MainTitle,
                  },
                },
              ],
            },
          },
          {
            heading_3: {
              rich_text: [
                {
                  text: {
                    content: "Captions",
                  },
                },
              ],
            },
          },
          {
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: messages.Captions.join("\n"),
                  },
                },
              ],
            },
          },
          {
            heading_3: {
              rich_text: [
                {
                  text: {
                    content: "BodyText",
                  },
                },
              ],
            },
          },
          {
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: messages.BodyText,
                  },
                },
              ],
            },
          },
        ],
      });
    } catch (error) {
      console.error("Failed Create Page:", error);
      return "";
    }
  }
}

const params = new Config();
const notionTest = new NotionManager();
