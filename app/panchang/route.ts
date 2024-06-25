import { JSDOM } from "jsdom";
import { NextRequest } from "next/server";

const timeFormatTo12Hours = (timeIn24Hour: string) => {
  const [hour, minute] = timeIn24Hour
    .split(":")
    .map(t => (t as unknown as number) * 1);

  const ampm = hour > 11 ? "PM" : "AM";

  return (
    ("" + (hour > 12 ? hour - 12 : hour)).padStart(2, "0") +
    ":" +
    ("" + minute).padStart(2, "0") +
    " " +
    ampm
  );
};

const selector = async (page: string) => {
  const res = await fetch(page);
  const result = await res.text();

  // eslint-disable-next-line no-console
  console.info(page, result);

  let data = {};

  if (selector) {
    const { document } = new JSDOM(result).window;
    const panchangaDiv = document.querySelector(
      "div.panchang-detail div.two-columns"
    );
    const sunRise = panchangaDiv.querySelector("span.sunrise").textContent;
    const sunSet = panchangaDiv.querySelector("span.sunset").textContent;
    const tithi = panchangaDiv.querySelector(
      "div:nth-child(4) > span"
    ).textContent;
    const yoga = panchangaDiv.querySelector("span.yoga").textContent;
    const yamaghantaKaal =
      panchangaDiv.querySelector("span.yamaghanta").textContent;
    const paksha = panchangaDiv.querySelector(
      "span.pakshafirstword"
    ).textContent;
    const nakshatra = panchangaDiv.querySelector("span.nakshatra").textContent;
    const karana = panchangaDiv.querySelector("span.karana").textContent;
    const moonsign = panchangaDiv.querySelector("span.moonsign").textContent;
    const rahuKaal = panchangaDiv.querySelector("span.rahukal").textContent;

    data = {
      sunRise: timeFormatTo12Hours(sunRise),
      sunSet: timeFormatTo12Hours(sunSet),
      tithi,
      yoga,
      yamaghantaKaal: yamaghantaKaal
        .split("to")
        .map(t => t.trim())
        .map(timeFormatTo12Hours)
        .join(" to "),
      paksha,
      nakshatra,
      karana,
      moonsign,
      rahuKaal: rahuKaal
        .split("to")
        .map(t => t.trim())
        .map(timeFormatTo12Hours)
        .join(" to ")
    };
  }
  return JSON.stringify(data);
};

const fetchPanchang = async (date: string) => {
  return await selector(process.env.P_PAGE + "&date=" + date);
};

const cache = {} as Record<string, { date: string; content: string }>;

const cachedFetch = async (date: string) => {
  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata"
  });
  if (!(cache[date] && cache[date].date == today)) {
    cache[date] = { date: today, content: await fetchPanchang(date) };
  }
  return cache[date].content;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let date = searchParams.get("date");
  if (!date) {
    const today = new Date();
    date =
      today.getDate().toString().padStart(2, "0") +
      "-" +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      today.getFullYear();
  }

  const data = await cachedFetch(date);

  return new Response(data, {
    status: 200
  });
}
