var { readdirSync, readFileSync } = require('fs');

const filenames = readdirSync(__dirname + 'src');
filenames.forEach(filename => {
  const fileContent = readFileSync(__dirname + filename, 'utf-8');
  console.log(fileContent);
});
