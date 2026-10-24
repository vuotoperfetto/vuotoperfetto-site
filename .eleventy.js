const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')({ html: true });

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/materiale");

  // Filtro per includere il contenuto renderizzato di un file Markdown
  eleventyConfig.addFilter("markdownFile", function(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return '';
    const raw = fs.readFileSync(fullPath, 'utf8');
    // Rimuove il frontmatter (tutto ciò che sta tra i primi due ---)
    const parts = raw.split('---');
    const content = parts.length >= 3 ? parts.slice(2).join('---').trim() : raw;
    return markdownIt.render(content);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
