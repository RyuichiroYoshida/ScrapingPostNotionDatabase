import { Scraping } from "./scraping";
import { Config } from "./config";

// 遅延処理のキャンセル用ハンドル
type DelayHandle = {
  cancel: () => void;
};

/**
 * @summary メイン処理を行うクラス
 * @constructor ConfigとScrapingを初期化
 * @method run - スクレイピングを実行
 * @method delay - 遅延処理を行う
 */
class Main {
  private config: Config;

  private scraping: Scraping;

  private delayHandle: DelayHandle;

  constructor() {
    this.config = new Config();
    this.scraping = new Scraping();
    this.delayHandle = { cancel: () => {} };

    this.run();
  }

  /**
   * @summary スクレイピングを実行
   */
  public async run() {
    console.log("StartRun");

    for (let i = 0; i < 5; i++) {
      try {
        this.scraping.runScraping(
          this.config.URL_HEAD + this.config.SEARCH_DATA[i].url,
          this.config.SEARCH_DATA[i].pageName
        );
        await this.delay(1000, this.delayHandle);
      } catch (error) {}
    }

    console.log("EndRun");
  }

  /**
   * @summary 遅延処理を行う
   * @param {number} ms
   * @param {DelayHandle} handle
   */
  private delay(ms: number, handle: DelayHandle) {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve(), ms);

      // キャンセル関数を設定
      handle.cancel = () => {
        clearTimeout(timeoutId);
        reject(new Error("Delay canceled"));
      };
    });
  }
}

const main = new Main();
