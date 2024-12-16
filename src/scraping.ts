import superagent from "superagent";
import * as cheerio from "cheerio";
import { Config } from "./config";

/**
 * @summary URLからHTMLを取得し、スクレイピングする
 *
 * @method getRawHtml - 指定されたURLからHTMLを取得し、コンテンツを抽出する
 * @method extractContent - HTMLからキャプション、メインタイトル、本文を抽出する
 * @method extractCompanyData - HTMLから会社データを抽出する
 *
 * @since 2024-12-17
 */
class Scraping {
  private readonly webUrl: string;
  private readonly notionApiUrl: string;
  private readonly databaseId: string;
  private readonly viewId: string;

  // 設定ファイルからパラメータを取得
  constructor() {
    this.webUrl = Config.WEB_URL;
    this.notionApiUrl = Config.NOTION_API_URL;
    this.databaseId = Config.DATABASE_ID;
    this.viewId = Config.VIEW_ID;
    this.getRawHtml();
  }

  /**
   * @summary メンバ変数にあるURLからHTMLを取得し、コンテンツを抽出しログに出力する
   * @returns {void}
   */
  async getRawHtml() {
    try {
      const result = await superagent.get(this.webUrl);

      // キャプション、メインタイトル、本文を抽出する
      const extractedData = this.extractContent(result.text);
      console.log(extractedData);

      // 会社データを抽出する
      const extractedCompanyData = this.extractCompanyData(result.text);
      console.log(extractedCompanyData);
    } catch (error) {
      console.error("Error fetching the HTML:", error);
    }
  }

  /**
   * @summary HTMLからキャプション、メインタイトル、本文を抽出する
   * @param {string} html - 抽出対象のHTML
   * @returns {Record<string, string | string[]>} - 抽出したコンテンツ
   */
  extractContent(html: string): Record<string, string | string[]> {
    const $ = cheerio.load(html);
    const result: Record<string, string | string[]> = {};

    // キャプションの抽出 (画像の下にあるテキスト)
    const captions: string[] = [];
    $("#advanceInfoCaptionLeft, #advanceInfoCaptionRight").each(
      (_, element) => {
        captions.push($(element).text().trim());
      }
    );
    if (captions.length > 0) {
      result["captions"] = captions;
    }

    // メインタイトルの抽出
    const mainTitle = $("#advanceInfoTitle").text().trim();
    if (mainTitle) {
      result["mainTitle"] = mainTitle;
    }

    // セクション全体の本文を抽出
    const bodyText = $("#advanceInfoBody").text().trim();
    if (bodyText) {
      result["bodyText"] = bodyText.replace(/\s+/g, " "); // 改行や余分なスペースを除去
    }

    return result;
  }

  /**
   * @summary HTMLから会社データを抽出する
   * @param {string} html - 抽出対象のHTML
   * @returns {Record<string, string | string[]>} - 抽出した会社データ
   */
  extractCompanyData(html: string): Record<string, string | string[]> {
    const $ = cheerio.load(html);
    const result: Record<string, string | string[]> = {};

    // 上部のテーブルデータを抽出
    $(".dataTableTop .item").each((_, element) => {
      const heading = $(element).prev(".heading").text().trim();
      const content = $(element).text().trim();
      if (heading && content) {
        result[heading] = content.replace(/\s+/g, " "); // 余分なスペースを除去
      }
    });

    // 下部のテーブルデータを抽出
    $(".dataTableBottom tr").each((_, element) => {
      const key = $(element).find("th").text().trim();
      const value = $(element).find("td").text().trim();
      if (key && value) {
        result[key] = value.replace(/\s+/g, " "); // 余分なスペースを除去
      }
    });

    // 沿革データを抽出
    const history: string[] = [];
    $(".listHistory li").each((_, element) => {
      const year = $(element).find(".year").text().trim();
      const details = $(element).find("ul > li").text().trim();
      if (year && details) {
        history.push(`${year}: ${details.replace(/\s+/g, " ")}`);
      }
    });

    if (history.length > 0) {
      result["沿革"] = history;
    }

    return result;
  }
}

const params = new Config();
const scraping = new Scraping();
