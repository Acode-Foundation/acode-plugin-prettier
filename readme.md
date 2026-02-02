# Acode Plugin: Prettier

![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Prettier is an opinionated code formatter that enforces a consistent style across your codebase. It automatically formats your code by parsing it and re-printing it with its own rules, taking the maximum line length into account and wrapping code when necessary.

This plugin brings the power of Prettier to [Acode](https://acode.foxdebug.com), the lightweight code editor for Android. With this plugin, you can format your code with just a tap or keyboard shortcut, ensuring clean and consistent formatting across all your projects.

**Repository:** [github.com/deadlyjack/acode-plugin-prettier](https://github.com/deadlyjack/acode-plugin-prettier)

## Requirements

- [Acode](https://acode.foxdebug.com) editor for Android
- Internet connection (for initial plugin installation)

## Installation

There are three ways to install this plugin:

### Method 1: Plugin Manager (Recommended)

This is the easiest way to install the plugin:

1. Open Acode and tap the menu icon (three horizontal lines) in the top-left corner
2. Go to **Settings** → **Plugins**
3. Browse the available plugins and find **Prettier**
4. Tap **Install** to add it to your editor
5. Restart Acode to activate the plugin

### Method 2: Remote Installation

If you have a direct URL to the plugin file:

1. Open Acode and go to **Settings** → **Plugins**
2. Tap the **'+'** icon
3. Select **REMOTE**
4. Enter the plugin file URL (e.g., a GitHub release URL)
5. Tap **Install**

### Method 3: Local Installation

If you have the plugin `.zip` file downloaded on your device:

1. Download the plugin file (`.zip`) to your Android device
2. Open Acode and navigate to **Settings** → **Plugins**
3. Tap the **'+'** icon
4. Select **LOCAL**
5. Choose the downloaded plugin file
6. Tap **Install**

For more details on installing plugins, visit the [Acode documentation](https://docs.acode.app/docs/getting-started/intro).

## Features

This plugin provides powerful formatting capabilities to help you maintain clean, consistent code:

- **Format Entire Document**: Quickly format your entire file using Acode's built-in formatter. This ensures your whole file follows consistent styling rules, making it easier to read and maintain.

- **Format Selection**: Need to format just a specific section? Select the lines you want to format and use the "Prettier: Format Selection" command. Perfect for cleaning up specific code blocks without affecting the rest of your file.
  - Keyboard shortcut: `Ctrl-Shift-F` (with external keyboard)
  - Smart behavior: Formats your selection when text is highlighted, or the entire document if nothing is selected
  - Automatically expands partial line selections to full lines for proper formatting

- **Configuration Support**: Respects `.prettierrc` and other Prettier configuration files in your project. This means your formatting preferences travel with your code, ensuring consistency across team members and devices.

- **Customizable Options**: Can't use config files? No problem! The plugin provides 24+ formatting options in its settings panel, including print width, tabs vs spaces, semicolons, quotes, trailing commas, and much more.

- **Advanced Error Handling**: When formatting issues occur, the plugin provides detailed error messages and logs to help you understand what went wrong. Access logs through the plugin settings for troubleshooting.

- **Web Worker Support**: Formatting runs asynchronously in the background, ensuring your editor remains responsive even when formatting large files.

## Supported Languages

Prettier can format files in multiple languages and frameworks. This plugin supports all of them:

### Web Languages
![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat&logo=sass&logoColor=white)
![Less](https://img.shields.io/badge/Less-1D365D?style=flat&logo=less&logoColor=white)

**Extensions:** `.html` `.htm` `.css` `.scss` `.less`

### JavaScript & TypeScript
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)

**Extensions:** `.js` `.cjs` `.es` `.mjs` `.jsx` `.ts` `.tsx`

### Frameworks & Libraries
![Vue](https://img.shields.io/badge/Vue.js-4FC08D?style=flat&logo=vuedotjs&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-E34F26?style=flat&logo=handlebarsdotjs&logoColor=white)

**Extensions:** `.vue` `.hbs` `.handlebars`

### Data & Markup
![JSON](https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white)
![YAML](https://img.shields.io/badge/YAML-CB171E?style=flat&logo=yaml&logoColor=white)

**Extensions:** `.json` `.md` `.yaml` `.yml`

## Usage

### Formatting the Entire Document

1. Open any supported file in Acode
2. Use Acode's built-in "Format Code" command or the format button in the UI

### Formatting Selection

1. Select the lines you want to format
2. Use one of these methods:
   - Press `Ctrl-Shift-F` if you have an external keyboard connected
   - Open the command palette and search for "Prettier: Format Selection"
   - Use Acode's QuickTools menu to access the format command

**Note**: If no text is selected, the entire document will be formatted.

## Configuration

The plugin supports multiple ways to configure Prettier's formatting behavior. You can use configuration files in your project, or customize settings directly in the plugin.

### Configuration Files

The plugin automatically looks for Prettier configuration files in your project root directory. Place one of these files at the root of your project:

- `.prettierrc` (JSON or YAML format)
- `.prettierrc.json`
- `.prettierrc.yaml` / `.prettierrc.yml`
- `.prettierrc.toml`
- `.prettierrc.js` / `prettier.config.js`
- `.prettierrc.mjs` / `.prettierrc.config.mjs`
- `.prettierrc.cjs` / `.prettierrc.config.cjs`

**Example 1: Basic `.prettierrc` with 2-space indentation**
```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "printWidth": 80
}
```

**Example 2: `.prettierrc` with no semicolons and single quotes**
```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

**Configuration Priority:**

When multiple configuration sources exist, Prettier uses this priority order (highest to lowest):
1. Configuration file in the project root (`.prettierrc`, `.prettierrc.json`, etc.)
2. `prettier` key in `package.json`
3. Plugin settings (configured in Acode's plugin settings)

If no configuration is found, Prettier uses its default settings.

### Available Settings

If you prefer not to use configuration files, you can customize all formatting options directly in the plugin settings. Available options include:

- **printWidth** - Maximum line length before wrapping (default: 80)
- **tabWidth** - Number of spaces per indentation level (default: 2)
- **useTabs** - Use tabs instead of spaces for indentation (default: false)
- **semi** - Add semicolons at the end of statements (default: true)
- **singleQuote** - Use single quotes instead of double quotes (default: false)
- **quoteProps** - When to quote object properties ("as-needed", "consistent", "preserve")
- **jsxSingleQuote** - Use single quotes in JSX (default: false)
- **trailingComma** - Add trailing commas where valid ("none", "es5", "all")
- **bracketSpacing** - Add spaces inside object brackets (default: true)
- **bracketSameLine** - Put closing bracket on same line in HTML/JSX (default: false)
- **arrowParens** - Include parentheses around arrow function parameters ("always", "avoid")
- **requirePragma** - Only format files with `@format` pragma (default: false)
- **insertPragma** - Insert `@format` pragma at top of formatted files (default: false)
- **proseWrap** - How to wrap prose in Markdown ("always", "never", "preserve")
- **htmlWhitespaceSensitivity** - HTML whitespace handling ("css", "strict", "ignore")
- **vueIndentScriptAndStyle** - Indent `<script>` and `<style>` in Vue files (default: false)
- **endOfLine** - Line ending style ("lf", "crlf", "cr", "auto")
- **embeddedLanguageFormatting** - Format embedded code ("auto", "off")
- **singleAttributePerLine** - Force single attribute per line in HTML/JSX (default: false)

And many more options for specific languages and plugins. Access these settings through **Settings** → **Plugins** → **Prettier** in Acode.

## Support

Need help or found a bug? We're here to assist!

### Reporting Issues

If you encounter any problems or have suggestions for improvements:

1. Check the [existing issues](https://github.com/deadlyjack/acode-plugin-prettier/issues) to see if it's already reported
2. If not, [create a new issue](https://github.com/deadlyjack/acode-plugin-prettier/issues/new) with:
   - A clear description of the problem
   - Steps to reproduce the issue
   - Your Acode version and Android version
   - Example code that demonstrates the issue (if applicable)

### Getting Help

- **Acode Documentation**: Visit [docs.acode.app](https://docs.acode.app) for general Acode help
- **Plugin Issues**: Use the [GitHub Issues](https://github.com/deadlyjack/acode-plugin-prettier/issues) page
- **Prettier Documentation**: For Prettier-specific questions, see [prettier.io/docs](https://prettier.io/docs)

Your feedback helps make this plugin better for everyone!

## Contributing

Contributions are welcome! Whether you want to fix a bug, add a feature, or improve documentation, your help is appreciated.

To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests if applicable.

**Repository:** [github.com/deadlyjack/acode-plugin-prettier](https://github.com/deadlyjack/acode-plugin-prettier)

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Ajit Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
