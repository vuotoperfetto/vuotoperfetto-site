const { parse } = require('node-html-parser');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/materiale");

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
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answer
          }
        });
      }
    }

    if (mainEntity.length === 0) return '';

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
