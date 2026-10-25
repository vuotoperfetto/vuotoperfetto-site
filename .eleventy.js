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

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/materiale");

  // Filtro per generare il JSON-LD FAQPage dal frontmatter
  eleventyConfig.addFilter("faqSchema", function(faqs) {
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      return '';
    }

    const mainEntity = faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": mainEntity
    };

    return JSON.stringify(schema, null, 2);
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
