import { Scraping } from "./scraping";
import { Config } from "./config";

type DelayHandle = {
  cancel: () => void;
};

// エントリーポイント
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

  private async delay(ms: number, handle: DelayHandle) {
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
