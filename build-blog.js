const pug = require('pug');
const pugJSON = require('./src/pug.json');
const fs = require('fs');
const marked = require('marked');

const blogArticleTemplate = pug.compileFile('./src/partials/blog-item.pug', { pretty: true });

for (let article of pugJSON.data.blogArticles) {
  article.content = marked(article.mdContent);
  const html = blogArticleTemplate(article);
  fs.writeFileSync(`dist/blog/${article.slug}.html`, html);
}
