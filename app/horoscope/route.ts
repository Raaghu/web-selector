import { NextRequest } from "next/server";
import { JSDOM } from "jsdom";

const selector = async (
  page: string,
  selector?: string,
  textContent?: boolean
) => {
  const res = await fetch(page);
  let data = await res.text();

  if (selector) {
    const { document } = new JSDOM(data).window;
    const selectedDom = document.querySelectorAll(selector);
    if (selectedDom.length > 0) {
      data = "";
      selectedDom.forEach(s => {
        data += "\n" + (textContent ? s.textContent : s.outerHTML);
      });
    } else {
      data = "";
    }
  }
  data = data.trim();
  return data;
};

const fetchHoroscope = async (zodSign: string, tomorrow?: string) => {
  const {
    HS_TOMO_PAGE,
    HS_PAGE,
    HS_SELECTOR,
    HS_TEXT_CONTENT,
    HS_REPLACE_FROM,
    HS_REPLACE_TO
  } = process.env;

  const page = tomorrow == "true" ? HS_TOMO_PAGE : HS_PAGE;

  const ZOD_PAGE = page?.replace("ZOD_SIGN", zodSign);

  let h = ZOD_PAGE
    ? await selector(ZOD_PAGE, HS_SELECTOR, !!HS_TEXT_CONTENT)
    : "";
  if (HS_REPLACE_FROM && HS_REPLACE_TO) {
    h = h.replaceAll(HS_REPLACE_FROM, HS_REPLACE_TO);
  }

  return h;
};

const cache = {};

const cachedFetch = async (zodSign: string, tomorrow?: string) => {
  let dateObj = new Date();
  if (tomorrow == "true") {
    dateObj = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const date = dateObj.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata"
  });
  if (!(cache[zodSign] && cache[zodSign].date == date)) {
    cache[zodSign] = {
      date: date,
      content: await fetchHoroscope(zodSign, tomorrow)
    };
  }
  return cache[zodSign].content;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zodSign = searchParams.get("zod-sign");
  const tomorrow = searchParams.get("tomorrow");

  if (zodSign == null) {
    return new Response("searchParam zod-sign is required", { status: 400 });
  }

  const data = await cachedFetch(zodSign, tomorrow);

  return new Response(data, {
    status: 200
  });
}
