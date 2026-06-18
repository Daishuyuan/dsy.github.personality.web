export const articleIdsByContentId: Record<string, string> = {
  "dubbo的配置与使用手册": "post:20180301-dubbo-guide",
  "DUBBO的配置与使用手册": "post:20180301-dubbo-guide",
  "soa技术框架发展": "post:20180625-soa-framework",
  "SOA技术框架发展": "post:20180625-soa-framework",
  "zero-shot-learning": "post:20180312-zero-shot-learning",
  "Zero-Shot Learning": "post:20180312-zero-shot-learning",
  "强化学习": "post:20180311-reinforcement-learning",
  "算法导论-摊还分析": "post:20180227-clrs-amortized-analysis",
  "算法探究c之大杂烩1": "post:20180228-algorithm-c-misc-1",
  "算法探究(C)之大杂烩(1)": "post:20180228-algorithm-c-misc-1",
  "算法探究java之大杂烩1": "post:20180228-algorithm-java-misc-1",
  "算法探究(Java)之大杂烩(1)": "post:20180228-algorithm-java-misc-1",
  "算法探究javascript之大杂烩1": "post:20180301-algorithm-js-misc-1",
  "算法探究(Javascript)之大杂烩(1)": "post:20180301-algorithm-js-misc-1",
  "算法探究javascript之快速排序": "post:20180729-algorithm-js-quick-sort",
  "算法探究(Javascript)之快速排序": "post:20180729-algorithm-js-quick-sort",
  "算法探究javascript之线段树": "post:20180508-algorithm-js-segment-tree",
  "算法探究(Javascript)之线段树": "post:20180508-algorithm-js-segment-tree",
  "算法探究python之田螺旋棋": "post:20180426-algorithm-python-surakarta",
  "算法探究(Python)之田螺旋棋": "post:20180426-algorithm-python-surakarta"
};

export const articleIdsByLegacySlug = new Map<string, string>(
  [
    ["/2018/03/01/DUBBO的配置与使用手册/", "post:20180301-dubbo-guide"],
    ["/2018/06/25/SOA技术框架发展/", "post:20180625-soa-framework"],
    ["/2018/03/12/Zero-Shot Learning/", "post:20180312-zero-shot-learning"],
    ["/2018/03/11/强化学习/", "post:20180311-reinforcement-learning"],
    ["/2018/02/27/算法导论-摊还分析/", "post:20180227-clrs-amortized-analysis"],
    ["/2018/02/28/算法探究(C)之大杂烩(1)/", "post:20180228-algorithm-c-misc-1"],
    ["/2018/02/28/算法探究(Java)之大杂烩(1)/", "post:20180228-algorithm-java-misc-1"],
    ["/2018/03/01/算法探究(Javascript)之大杂烩(1)/", "post:20180301-algorithm-js-misc-1"],
    ["/2018/07/29/算法探究(Javascript)之快速排序/", "post:20180729-algorithm-js-quick-sort"],
    ["/2018/05/08/算法探究(Javascript)之线段树/", "post:20180508-algorithm-js-segment-tree"],
    ["/2018/04/26/算法探究(Python)之田螺旋棋/", "post:20180426-algorithm-python-surakarta"]
  ].flatMap(([legacyPath, articleId]) => {
    const slug = normalizeLegacySlug(legacyPath);
    return [
      [slug, articleId],
      [encodeURI(slug), articleId]
    ] as const;
  })
);

export function getArticleIdForContentId(contentId: string) {
  return articleIdsByContentId[contentId] ?? `post:${createStableId(contentId)}`;
}

export function getArticleIdForLegacySlug(slug: string) {
  const normalized = normalizeLegacySlug(slug);
  return articleIdsByLegacySlug.get(normalized) ?? articleIdsByLegacySlug.get(encodeURI(normalized));
}

export function normalizeLegacySlug(value: string) {
  const raw = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function createStableId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
