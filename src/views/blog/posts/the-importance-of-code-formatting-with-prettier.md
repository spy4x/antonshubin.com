Are you tired of your developers spending valuable time and energy debating code style preferences? Does messy, poorly formatted code hinder their productivity and efficiency? Are you frustrated with constantly having to review pull requests that contain simple formatting errors?

These issues can have a significant impact on your bottom line, as they can waste valuable time and resources that could be better spent on more important tasks. Fortunately, there is a simple solution: using a code formatting tool like Prettier. With Prettier, you can easily ensure that your code is consistently formatted and easy to read, helping your team work more efficiently and effectively.

## What is Prettier?
Prettier is a code formatting tool that helps to ensure consistency and readability in your code. It does this by automatically formatting your code according to a set of customizable rules. Prettier supports a wide range of languages, including Typescript, HTML, and CSS, so you can use it to ensure consistent formatting across your entire project.

Here is an example of Prettier in action. This is a Typescript file that has not been formatted with Prettier:  

```typescript
class   User {
  name:string;
  age:   number; constructor(name:string,age:number){
    this.name=name;this.age = age;
  } sayHello(){console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);}
}

const user=new User("John",30);user.sayHello()
```

And here is the same file after running it through Prettier:

```typescript
class User {
  name: string;
  age: number;
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  sayHello() {
    console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
  }
}

const user = new User('John', 30);
user.sayHello();
```

## Why is Code Formatting Important?
Having a consistent code style across a project or codebase is crucial for readability and maintainability. It's much easier to understand and work with code when it's formatted in a predictable, consistent way. Code formatting can also help to prevent style-related issues from becoming a bottleneck in code reviews, allowing reviewers to focus on the more important aspects of the code.

## How Can I Use Prettier in My Workflow?
There are a few different ways to integrate Prettier into your workflow.  
But first, let's add it to our project:
```bash
npm install --save-dev prettier
```

### Run it manually
 You can run Prettier manually by running the Prettier in your terminal. This will format all files in the current directory and subdirectories according to the rules you've set in your `.prettierrc` file. Note that this section is just for example purposes. In real-world projects, you'll probably want to integrate Prettier to your IDE to automatically format your code as you write it. More about it in next section.

Here is an example of how you can make an alias for it in `package.json` file:
```json
{
  "scripts": {
    "format": "prettier --write '**/*.{ts,html,css,json,md}'"
  }
}
```
And then run it with:
```bash
npm run format
```

### Integrate it with your IDE
Prettier has plugins for most popular IDEs, so you can integrate it with your workflow and have it automatically format your code as you write it.  
Here are some of the most popular IDEs and their plugins:
- <a href="https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode" target="_blank">VS Code</a>
- <a href="https://plugins.jetbrains.com/plugin/10456-prettier" target="_blank">WebStorm</a>
- <a href="https://atom.io/packages/prettier-atom" target="_blank">Atom</a>

**Note**: Just make sure you configure the plugin to run on file save!

### Pre-commit Hook
One option is to use a pre-commit hook, which will automatically run Prettier on your code before you commit it. This ensures that your code is always properly formatted before it's committed to version control.

One tool that can help with this is Husky, which is a tool that allows you to easily set up pre-commit hooks in your project. To use Prettier with Husky, you'll first need to install both Husky, Prettier, and Lint-staged as dev dependencies in your project:

```bash
npm install --save-dev husky lint-staged
```

Next, you'll need to add the following configuration to your package.json file:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,html,css,json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

This will tell Husky to run the `lint-staged` tool as a pre-commit hook. The lint-staged tool is then configured to run Prettier on all staged `.ts`, `.html`, `.css`, `.json`, and `.md` files, and then add the formatted files back to the staging area using `git add`.

### CI/CD Check
Another option is to set up a CI/CD check to run Prettier as part of your build process. This ensures that your code is always properly formatted in production as well.

To do this, you'll need to add a script to your package.json file that runs Prettier during the CI/CD process. For example:
```json
{
  "scripts": {
    "format:check": "prettier --check '**/*.{ts,html,css,json,md}'"
  }
}
```
You can then configure your CI/CD pipeline to run the `format:check` script as part of the build process. If the script fails, the build will fail, and you'll know that your code is not properly formatted.

## Worth to mention
There are several other ways that Prettier can be used, in addition to formatting code for readability and consistency. Some of these include:

1. **Automating code formatting in pull requests**: Prettier can be used to automatically format code in pull requests, ensuring that all code submitted to the project meets the project's formatting standards.

2. **Converting code between different formatting styles**: Prettier can be used to convert code from one formatting style to another, making it easier to migrate code between projects or teams that use different formatting conventions.

3. **Enforcing coding standards in code reviews**: Prettier can be used to automatically enforce coding standards in code reviews, allowing reviewers to focus on more important aspects of the code.


## Conclusion
In summary, formatting code with Prettier is important because it helps to ensure that your code is readable, maintainable, and consistent across your entire project. Whether you're working on a small personal project or a large team project, Prettier can help make your code better. So give it a try, and see the difference it can make for you!

## Bonus - My Prettier Config
Here is my `.prettierrc` file:
```json
{
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```


Here is a description of what each line in the .prettierrc file does:

1. `"singleQuote": true`: This tells Prettier to use single quotes instead of double quotes for strings.
2. `"printWidth": 120`: This sets the maximum line length to 120 characters. Prettier will automatically wrap lines that exceed this length.
3. `"tabWidth": 2`: This sets the number of spaces per indentation level when Prettier is formatting code that uses spaces for indentation.
4. `"useTabs": false`: This tells Prettier to use spaces instead of tabs for indentation.
5. `"semi": true`: This tells Prettier to include semicolons at the end of statements.
6. `"trailingComma": "all"`: This tells Prettier to add a trailing comma to the end of arrays and objects.
7. `"bracketSpacing": true`: This tells Prettier to add a space between the brackets of arrays and objects and the elements or properties within them.
8. `"arrowParens": "avoid"`: This tells Prettier to avoid adding parentheses around the parameters of arrow functions when they are unnecessary.

These options can be customized to suit your preferences and the style guidelines of your project. You can find more information about the configuration options in the <a href="https://prettier.io/docs/en/options.html" target="_blank">Prettier documentation</a>.
