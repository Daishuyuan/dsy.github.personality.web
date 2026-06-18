import { execFileSync } from "node:child_process";

const output = execFileSync("git", ["diff", "--name-only", "--", "src/content/blog"], {
  encoding: "utf8"
}).trim();

if (output) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        changedArticleFiles: output.split("\n")
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(JSON.stringify({ status: "ok", changedArticleFiles: [] }, null, 2));
