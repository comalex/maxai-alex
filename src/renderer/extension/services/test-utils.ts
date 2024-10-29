const fs = require("fs");
const path = require("path");

export const readHTMLFile = (filePath: string) => {
  const absolutePath = path.join(__dirname, filePath);
  return fs.readFileSync(absolutePath, "utf8");
};

export const emulateHTML = (htmlString: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(htmlString, "text/html");
};
