import superagent from "superagent";
import * as cheerio from "cheerio";
import { Config } from "./config";
import { NotionManager, CompanyData, CompanyMessage } from "./notionManager";

/**
 * @summary URLからHTMLを取得し、スクレイピングする
 *
 * @method getRawHtml - 指定されたURLからHTMLを取得し、コンテンツを抽出する
 * @method extractContent - HTMLからキャプション、メインタイトル、本文を抽出する
 * @method extractCompanyData - HTMLから会社データを抽出する
 */
class Scraping {
  private readonly webUrl: string;

  private readonly notionManager = new NotionManager();

  // 設定ファイルからパラメータを取得
  public constructor() {
    this.webUrl = Config.WEB_URL;
    this.getRawHtml();
  }

  /**
   * @summary メンバ変数にあるURLからHTMLを取得し、コンテンツを抽出しログに出力する
   */
  private async getRawHtml() {
    try {
      const result = await superagent.get(this.webUrl);

      // キャプション、メインタイトル、本文を抽出する
      const extractedData = this.extractContent(result.text);

      // 会社データを抽出する
      const extractedCompanyData = this.extractCompanyData(result.text);

      this.notionManager.createDatabase(extractedCompanyData, extractedData);
    } catch (error) {
      console.error("Error fetching the HTML:", error);
    }
  }

  /**
   * @summary HTMLからキャプション、メインタイトル、本文を抽出する
   * @param {string} html - 抽出対象のHTML
   * @returns {CompanyMessage} - 抽出したコンテンツを整形したデータ
   */
  private extractContent(html: string): CompanyMessage {
    const $ = cheerio.load(html);
    // Notion子ページに記述するデータ
    let results: CompanyMessage = {
      Captions: [],
      MainTitle: "",
      BodyText: "",
    };

    // キャプションの抽出 (画像の下にあるテキスト)
    const captions: string[] = [];
    $("#advanceInfoCaptionLeft, #advanceInfoCaptionRight").each(
      (_, element) => {
        captions.push($(element).text().trim());
      }
    );
    if (captions.length > 0) {
      results.Captions = captions;
    }

    // メインタイトルの抽出
    const mainTitle = $("#advanceInfoTitle").text().trim();
    if (mainTitle) {
      results.MainTitle = mainTitle;
    }

    // セクション全体の本文を抽出
    const bodyText = $("#advanceInfoBody").text().trim();
    if (bodyText) {
      results.BodyText = bodyText.replace(/\s+/g, " "); // 改行や余分なスペースを除去
    }

    return results;
  }

  /**
   * @summary HTMLから会社データを抽出する
   * @param {string} html - 抽出対象のHTML
   * @returns {Record<string, string | string[]>} - 抽出した会社データ
   */
  private extractCompanyData(html: string): CompanyData {
    const $ = cheerio.load(html);
    const result: Record<string, string | string[]> = {};

    let results: CompanyData = {
      Establishment: "",
      CapitalStock: "",
      Worker: "",
      Location: "",
    };

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

    results.Establishment = result["設立"] as string;
    results.CapitalStock = result["資本金"] as string;
    results.Worker = result["従業員"] as string;
    results.Location = result["事業所"] as string;

    return results;
  }
}

const params = new Config();
const scraping = new Scraping();
