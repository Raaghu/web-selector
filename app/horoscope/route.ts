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

const fetchHoroscope = async (zodSign: string) => {
  const {
    HS_PAGE,
    HS_SELECTOR,
    HS_TEXT_CONTENT,
    HS_REPLACE_FROM,
    HS_REPLACE_TO
  } = process.env;
  const ZOD_PAGE = HS_PAGE?.replace("ZOD_SIGN", zodSign);

  let h = ZOD_PAGE
    ? await selector(ZOD_PAGE, HS_SELECTOR, !!HS_TEXT_CONTENT)
    : "";
  if (HS_REPLACE_FROM && HS_REPLACE_TO) {
    h = h.replaceAll(HS_REPLACE_FROM, HS_REPLACE_TO);
  }

  return h;
};

const cache = {};

const cachedFetch = async (zodSign: string) => {
  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata"
  });
  if (!(cache[zodSign] && cache[zodSign].date == today)) {
    cache[zodSign] = {
      date: today,
      content: await fetchHoroscope(zodSign)
    };
  }
  return cache[zodSign].content;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zodSign = searchParams.get("zod-sign");

  if (zodSign == null) {
    return new Response("searchParam zod-sign is required", { status: 400 });
  }

  const data = await cachedFetch(zodSign);

  return new Response(data, {
    status: 200
  });
}
