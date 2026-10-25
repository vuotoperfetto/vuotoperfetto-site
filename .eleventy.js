const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const markdownIt = require('markdown-it')({ html: true });

const sitemap = require("@nichoth/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  // ... altri passthrough copy e filtri ...

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://vuotoperfetto.it", // Sostituisci con il tuo dominio reale
    },
  });

  return { /* ... */ };
};

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/materiale");

  // Filtro per includere il contenuto renderizzato di un file Markdown
  eleventyConfig.addFilter("markdownFile", function(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return '';
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parts = raw.split('---');
    const content = parts.length >= 3 ? parts.slice(2).join('---').trim() : raw;
    return markdownIt.render(content);
  });

  // Filtro per generare il JSON-LD FAQPage dagli H4
  eleventyConfig.addFilter("faqSchemaFromH4", function(html) {
    if (!html || typeof html !== 'string') return '';
    const root = parse(html);
    const h4s = root.querySelectorAll('h4');
    if (h4s.length === 0) return '';
    const mainEntity = [];
    for (const h4 of h4s) {
      const question = h4.textContent.trim();
      const answerParts = [];
      let sibling = h4.nextElementSibling;
      while (sibling && !/^H[1-6]$/.test(sibling.tagName)) {
        const text = sibling.textContent.trim();
        if (text) answerParts.push(text);
        sibling = sibling.nextElementSibling;
      }
      const answer = answerParts.join(' ').trim();
      if (question && answer) {
        mainEntity.push({
          "@type": "Question",
          "name": question,
          "acceptedAnswer": { "@type": "Answer", "text": answer }
        });
      }
    }
    if (mainEntity.length === 0) return '';
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": mainEntity
    }, null, 2);
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
