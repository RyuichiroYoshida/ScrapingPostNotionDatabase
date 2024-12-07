import superagent from "superagent";
import * as cheerio from "cheerio";
import { prop } from "cheerio/dist/commonjs/api/attributes";

class Crowllwe {
  private url =
    "https://job.mynavi.jp/26/pc/search/corp266630/outline.html";
  constructor() {
    this.getRawHtml();
  }

  async getRawHtml() {
    try {
      const result = await superagent.get(this.url);
      //console.log(result.text);
      this.getJobInfo(result.text);
    } catch (error) {
      console.error("Error fetching the HTML:", error);
    }
  }

  getJobInfo(html: string) {
    if (!html) {
      console.error("No HTML content to process");
      return;
    }
    const $ = cheerio.load(html);
    const jobItems = $(".category");
    $(".companyInfo").each((index, element) => {
        console.log($(element).text());
    });
    // const companyInfo = $(".companyInfo");
    // companyInfo.map((index, element) => {
    //     console.log($(element).find("#corpCatch"));
    // });

    //console.log($("#stuCorpHeaderFooterDto").attr("action"));

    jobItems.map((index, element) => {
      const companyName = $(element).find("li").each((i, el) => {
        console.log($(el).text());
      });
    });
  }
}

const crowllwe = new Crowllwe();
