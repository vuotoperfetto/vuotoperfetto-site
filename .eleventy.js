module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/materiale");

  // Copia src/static includendo i file e le cartelle che iniziano con un punto (.well-known)
  eleventyConfig.addPassthroughCopy("src/static", {
    copyOptions: {
      dot: true
    }
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
