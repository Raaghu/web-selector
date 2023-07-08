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
    const selectedDom = document.querySelector(selector);
    if (selectedDom) {
      data = textContent
        ? selectedDom.textContent || ""
        : selectedDom.outerHTML;
    } else {
      data = "";
    }
  }
  return data;
};

const fetchHoroscope = async (zodSign: string) => {
  const { PAGE, SELECTOR, TEXT_CONTENT } = process.env;
  const ZOD_PAGE = PAGE?.replace("ZOD_SIGN", zodSign);

  return ZOD_PAGE ? await selector(ZOD_PAGE, SELECTOR, !!TEXT_CONTENT) : "";
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
