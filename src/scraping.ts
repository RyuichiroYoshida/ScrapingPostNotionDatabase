import superagent from "superagent";
import * as cheerio from "cheerio";
import { NotionManager, CompanyData, CompanyMessage } from "./notionManager";
import { Config } from "./config";

/**
 * @summary URLからHTMLを取得し、スクレイピングする
 *
 * @method fetchPageUrls - 指定されたURLにアクセスし、HTMLからそれぞれのページURLとタイトルを取得する
 * @method runScraping - 指定されたURLからHTMLを取得し、コンテンツを抽出する
 * @method extractContent - HTMLからキャプション、メインタイトル、本文を抽出する
 * @method extractCompanyData - HTMLから会社データを抽出する
 */
export class Scraping {
  private readonly notionManager: NotionManager;
  public pageUrls: { url: string; pageName: string }[] = [];

  constructor() {
    this.notionManager = new NotionManager();
    this.fetchPageUrls(Config.WEB_URL);
  }

  /**
   * @summary 指定されたURLにアクセスし、HTMLからそれぞれのページURLを取得する
   * @param {string} webUrl - 取得対象のURL
   */
  public async fetchPageUrls(webUrl: string) {
    try {
      const html = await superagent.get(webUrl);

      // CheerioでHTMLをパース
      const $ = cheerio.load(html.text);

      $("a.js-add-examination-list-text").each((_, element) => {
        const href = $(element).attr("href") || "";
        const text = $(element).text().trim();

        // outline.htmlを含むリンクだけを対象にする
        if (href.includes("outline.html")) {
          this.pageUrls.push({ url: href, pageName: text });
        }
      });
    } catch (error) {
      console.error("Error fetching the HTML:", error);
    }
  }

  /**
   * @summary メンバ変数にあるURLからHTMLを取得し、コンテンツを抽出しNotion操作クラスに送信する
   */
  public async runScraping(pageData: { url: string; pageName: string }) {
    // TODO: try-catchのエラーハンドリングを追加
    try {
      const html = await superagent.get(pageData.url);

      // キャプション、メインタイトル、本文を抽出する
      const extractedMsg = this.extractContent(html.text);

      // 会社データを抽出する
      const extractedData = this.extractCompanyData(
        html.text,
        pageData.pageName
      );

      this.notionManager.createDatabase(extractedData, extractedMsg);
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
   * @param {string} name - 会社名
   * @returns {CompanyData} - 抽出した会社データ
   */
  private extractCompanyData(html: string, name: string): CompanyData {
    const $ = cheerio.load(html);
    const result: Record<string, string | string[]> = {};

    let results: CompanyData = {
      CompanyName: "",
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

    // TODO: Validation失敗時の処理を追加
    // validation
    try {
      results.CompanyName = name;
      results.Establishment = result["設立"] as string;
      results.CapitalStock = result["資本金"] as string;
      results.Location = result["本社所在地"] as string;
      results.Worker = result["従業員"]
        ? (result["従業員"] as string)
        : (result["従業員数"] as string);
    } catch (error) {
      console.error("Failed to Validation:", error);
    }
    return results;
  }
}

const scraping = new Scraping();
const config = new Config();
