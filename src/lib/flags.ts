const REGION_ENTRIES = [
  {
    code: "HK",
    keywords: ["香港", "hong kong"],
    label: "香港",
  },
  {
    code: "TW",
    keywords: ["台湾", "taiwan"],
    label: "台湾",
  },
  {
    code: "JP",
    keywords: ["日本", "japan", "东京", "osaka"],
    label: "日本",
  },
  {
    code: "SG",
    keywords: ["新加坡", "singapore"],
    label: "新加坡",
  },
  {
    code: "US",
    keywords: ["美国", "united states", "usa", "洛杉矶", "硅谷", "new york"],
    label: "美国",
  },
  {
    code: "KR",
    keywords: ["韩国", "korea", "首尔"],
    label: "韩国",
  },
  {
    code: "GB",
    keywords: ["英国", "united kingdom", "london"],
    label: "英国",
  },
  {
    code: "DE",
    keywords: ["德国", "germany", "frankfurt"],
    label: "德国",
  },
  {
    code: "FR",
    keywords: ["法国", "france", "paris"],
    label: "法国",
  },
  {
    code: "CA",
    keywords: ["加拿大", "canada", "toronto", "vancouver"],
    label: "加拿大",
  },
  {
    code: "AU",
    keywords: ["澳大利亚", "australia", "悉尼", "sydney"],
    label: "澳大利亚",
  },
  {
    code: "NL",
    keywords: ["荷兰", "netherlands", "amsterdam"],
    label: "荷兰",
  },
];

function toFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function getRegionMeta(name: string) {
  const text = name.toLowerCase();
  const match = REGION_ENTRIES.find((entry) => entry.keywords.some((keyword) => text.includes(keyword)));
  if (!match) return null;

  return {
    ...match,
    emoji: toFlagEmoji(match.code),
  };
}
