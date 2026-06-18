import { MongoClient } from "mongodb";

const legacySlugToArticleId = new Map(
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
    ];
  })
);

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "dsy_blog";

if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const database = client.db(dbName);
  const comments = database.collection("comments");
  const likes = database.collection("likes");

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: dbName,
    comments: await cleanComments(comments),
    likes: await cleanLikes(likes),
    indexes: apply ? await dropLegacySlugIndexes(comments, likes) : { dropped: [] }
  };

  if (apply) {
    await Promise.all([
      comments.createIndex({ articleId: 1, status: 1, createdAt: -1 }),
      comments.createIndex({ articleId: 1, visitorHash: 1, createdAt: -1 }),
      likes.createIndex({ articleId: 1, visitorHash: 1 }, { unique: true })
    ]);
  }

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await client.close();
}

async function cleanComments(collection) {
  const legacyComments = await collection.find({
    articleId: { $exists: false },
    slug: { $exists: true }
  }).toArray();
  const stats = { inspected: legacyComments.length, migrated: 0, deleted: 0, skipped: 0 };

  for (const comment of legacyComments) {
    const articleId = getArticleId(comment.slug);
    if (!articleId) {
      stats.deleted += 1;
      if (apply) {
        await collection.deleteOne({ _id: comment._id });
      }
      continue;
    }

    stats.migrated += 1;
    if (apply) {
      await collection.updateOne({ _id: comment._id }, { $set: { articleId }, $unset: { slug: "" } });
    }
  }

  return stats;
}

async function cleanLikes(collection) {
  const legacyLikes = await collection.find({
    articleId: { $exists: false },
    slug: { $exists: true }
  }).toArray();
  const stats = { inspected: legacyLikes.length, migrated: 0, deleted: 0, deduped: 0 };

  for (const like of legacyLikes) {
    const articleId = getArticleId(like.slug);
    if (!articleId || typeof like.visitorHash !== "string") {
      stats.deleted += 1;
      if (apply) {
        await collection.deleteOne({ _id: like._id });
      }
      continue;
    }

    const duplicate = await collection.findOne({
      _id: { $ne: like._id },
      articleId,
      visitorHash: like.visitorHash
    });

    if (duplicate) {
      stats.deduped += 1;
      if (apply) {
        await collection.deleteOne({ _id: like._id });
      }
      continue;
    }

    stats.migrated += 1;
    if (apply) {
      await collection.updateOne({ _id: like._id }, { $set: { articleId }, $unset: { slug: "" } });
    }
  }

  return stats;
}

async function dropLegacySlugIndexes(...collections) {
  const dropped = [];

  for (const collection of collections) {
    for (const index of await collection.listIndexes().toArray()) {
      if (index.name !== "_id_" && Object.hasOwn(index.key ?? {}, "slug")) {
        await collection.dropIndex(index.name);
        dropped.push(`${collection.collectionName}.${index.name}`);
      }
    }
  }

  return { dropped };
}

function getArticleId(slug) {
  const normalized = normalizeLegacySlug(slug);
  return legacySlugToArticleId.get(normalized) ?? legacySlugToArticleId.get(encodeURI(normalized));
}

function normalizeLegacySlug(value) {
  const raw = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
