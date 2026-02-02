import tag from 'html-tag-js';
import yaml from "js-yaml";
import prettier from "prettier/standalone";
import toml from "toml";
import plugin from "../plugin.json";
import prettierPlugins from './prettierPlugins';

const pluginId = plugin.id;
const appSettings = acode.require('settings');
const fs = acode.require('fs');
const url = acode.require('url');
const SideButton = acode.require('sideButton');
const helpers = acode.require('helpers');
const toast = acode.require('toast');
const actionStack = acode.require('actionStack');

class AcodePrettier {
    /**@type {Worker} */
    worker = null;
    workerInitialized = false;
    /**@type {HTMLScriptElement} */
    $vendorScript = null;
    #sideButton;
    /**@type {HTMLElement} */
    #page;

    prettierOptions = {
        printWidth: 80,
        tabWidth: 4,
        useTabs: false,
        semi: true,
        singleQuote: false,
        quoteProps: "as-needed",
        jsxSingleQuote: false,
        trailingComma: "none",
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: "avoid",
        rangeStart: 0,
        rangeEnd: Infinity,
        requirePragma: false,
        insertPragma: false,
        proseWrap: "preserve",
        htmlWhitespaceSensitivity: "css",
        vueIndentScriptAndStyle: false,
        endOfLine: "lf",
        embeddedLanguageFormatting: "auto",
        singleAttributePerLine: false,
        openErrorPageOnErrors: true,
        version: 3,
    };

    constructor() {
        this.run = this.run.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.removeErrorsByFile = this.removeErrorsByFile.bind(this);
        this.#sideButton = SideButton?.({
            text: plugin.name,
            icon: "warningreport_problem",
            backgroundColor: "var(--danger-color)",
            textColor: "var(--danger-text-color)",
            onclick: () => {
                this.#page.show();
                helpers.showAd();
            }
        });

        const prettierSettings = appSettings.value[plugin.id];
        if (!prettierSettings || prettierSettings?.version !== this.prettierOptions.version) {
            appSettings.value[plugin.id] = structuredClone(this.prettierOptions);
            appSettings.update();
        } else {
            Object.assign(this.prettierOptions, prettierSettings);
            this.prettierOptions.rangeEnd = prettierSettings.rangeEnd ?? Infinity;
        }
    }

    static inferParser(filename) {
        const ext = filename.slice(filename.lastIndexOf(".") + 1);
        switch (ext) {
            case "html":
            case "htm":
                return "html";

            case "js":
            case "cjs":
            case "es":
            case "mjs":
            case "jsx":
                return "babel";

            case "ts":
            case "tsx":
                return "typescript";

            case "hbs":
            case "handlebars":
                return "glimmer";

            case "md":
                return "markdown";

            case "yaml":
            case "yml":
                return "yaml";

            default:
                return ext;
        }
    }

    async init($page) {
        this.#page = $page;
        this.#page.settitle(`${plugin.name} logs`);

        this.#page.onhide = () => {
            helpers.hideAd();
            actionStack.remove(plugin.id);
        };

        this.commands.forEach(command => {
            editorManager.editor.commands.addCommand(command);
        });

        if (typeof Worker !== "undefined") {
            this.#initializeWorker();
        }

        const extensions = [
            "html",
            "htm",
            "css",
            "scss",
            "less",
            "js",
            "cjs",
            "es",
            "mjs",
            "jsx",
            "ts",
            "tsx",
            "vue",
            "json",
            "hbs",
            "handlebars",
            "md",
            "yaml",
            "yml",
        ];

        acode.registerFormatter(pluginId, extensions, this.run);
        editorManager.on('remove-file', this.removeErrorsByFile);
    }

    async run() {
        const { editor, activeFile } = editorManager;
        const code = editor.getValue();
        const cursorPos = editor.getCursorPosition();
        const parser = AcodePrettier.inferParser(activeFile.name);
        const configFile = await this.#getConfigFile(activeFile);
        const prettierOptions = configFile || this.prettierOptions;
        const cursorOptions = {
            parser,
            cursorOffset: this.#cursorPosToCursorOffset(cursorPos),
            filepath: activeFile.name,
            ...prettierOptions,
        };

        if (typeof Worker !== "undefined") {
            this.worker.postMessage({
                id: activeFile.id,
                code,
                cursorOptions,
            });
            return;
        }

        cursorOptions.plugins = prettierPlugins;
        try {
            const res = await prettier.formatWithCursor(code, cursorOptions);
            this.#setValue(activeFile, res);
        } catch (error) {
            this.#showError(activeFile.id, error);
        }
    }

    async runSelection() {
        const { editor, activeFile } = editorManager;
        const selection = editor.getSelection();
        const range = selection.getRange();

        // If no selection, format entire document
        if (selection.isEmpty() || (range.start.row === range.end.row && range.start.column === range.end.column)) {
            return this.run();
        }

        const parser = AcodePrettier.inferParser(activeFile.name);
        const configFile = await this.#getConfigFile(activeFile);
        const prettierOptions = configFile || this.prettierOptions;

        // Get full-line selection range
        const code = editor.getValue();
        const { selectionRange, selectedText } = this.#getSelectionText(selection, code);

        // Format only the selected text (not the entire document)
        const cursorOptions = {
            parser,
            filepath: activeFile.name,
            ...prettierOptions,
            // Don't use rangeStart/rangeEnd - format the selection as a standalone snippet
            rangeStart: 0,
            rangeEnd: Infinity,
        };

        if (typeof Worker !== "undefined") {
            this.worker.postMessage({
                id: activeFile.id,
                code: selectedText,
                cursorOptions,
                isSelection: true,
                selectionRange,
            });
            return;
        }

        cursorOptions.plugins = prettierPlugins;
        try {
            const res = await prettier.format(selectedText, cursorOptions);
            this.#setValueForSelection(activeFile, res, selectionRange);
        } catch (error) {
            this.#showError(activeFile.id, error);
        }
    }

    destroy() {
        this.#sideButton?.hide();
        this.#page?.hide();
        acode.unregisterFormatter(plugin.id);
        if (this.worker) {
            this.worker.terminate();
        }
        if (this.$vendorScript) {
            this.$vendorScript.remove();
        }

        this.commands.forEach(command => {
            editorManager.editor.commands.removeCommand(command);
        });
        editorManager.off('remove-file', this.removeErrorsByFile);
    }

    #cursorPosToCursorOffset(cursorPos) {
        return this.#positionToOffset(cursorPos);
    }

    #positionToOffset(position) {
        let { row, column } = position;
        const { editor } = editorManager;
        const lines = editor.getValue().split("\n");

        for (let i = 0; i < row; ++i) {
            column += lines[i].length + 1; // +1 for newline character
        }
        return column;
    }

    #getSelectionText(selection, code) {
        const range = selection.getRange();
        const lines = code.split("\n");

        // Expand to full lines
        const startRow = range.start.row;
        let endRow = range.end.row;

        // If selection ends at column 0, don't include that line
        if (range.end.column === 0 && endRow > startRow) {
            endRow--;
        }

        // Ensure endRow is within bounds
        endRow = Math.min(endRow, lines.length - 1);

        // Store the actual selection range for replacement
        const selectionRange = {
            start: { row: startRow, column: 0 },
            end: { row: endRow, column: lines[endRow]?.length ?? 0 }
        };

        // Extract the selected lines
        const selectedLines = lines.slice(startRow, endRow + 1);
        const selectedText = selectedLines.join("\n");

        return { selectionRange, selectedText };
    }

    #cursorOffsetToCursorPos(cursorOffset) {
        const { editor } = editorManager;
        const lines = editor.getValue().split("\n");
        const linesCount = lines.length;
        let row = 0;
        let column = 0;

        for (let i = 0; i < linesCount; i++) {
            if (column + lines[i].length + (i !== linesCount - 1 ? 1 : 0) > cursorOffset) { // +1 for newline, but not for the last line
                row = i;
                column = cursorOffset - column;
                break;
            }
            column += lines[i].length + 1; // +1 for newline character
        }

        return {
            row,
            column,
        };
    }

    #initializeWorker() {
        this.worker = new Worker(new URL("./worker.js", import.meta.url));
        this.worker.onmessage = (e) => {
            const { id, res, error, action, isSelection, selectionRange } = e.data;
            if (action === "script loaded") {
                this.workerInitialized = true;
                return;
            }

            if (action === "code format") {
                if (error) {
                    this.#showError(id, error);
                    return;
                }

                const file = editorManager.getFile(id, "id");
                if (!file) return;

                if (isSelection && selectionRange) {
                    this.#setValueForSelection(file, res, selectionRange);
                } else {
                    this.#setValue(file, res);
                }
            }
        };
    }

    #setValue(file, formattedCode) {
        const { session } = file;

        // Get the full document range
        const lastRow = session.getLength() - 1;
        const lastColumn = session.getLine(lastRow).length;
        const fullRange = {
            start: { row: 0, column: 0 },
            end: { row: lastRow, column: lastColumn }
        };

        // Replace the entire document content
        // This preserves editor state better than setValue()
        session.replace(fullRange, formattedCode.formatted);

        // Restore cursor position
        session.selection.moveCursorToPosition(this.#cursorOffsetToCursorPos(formattedCode.cursorOffset));
        this.#removeErrors(file.id);
    }

    #setValueForSelection(file, formattedText, selectionRange) {
        const { session } = file;

        // For selection formatting, the result is either a string (from prettier.format)
        // or an object with 'formatted' property (from formatWithCursor)
        let formatted = typeof formattedText === 'string' ? formattedText : formattedText.formatted;

        // Remove trailing newline added by Prettier
        if (formatted.endsWith('\n')) {
            formatted = formatted.slice(0, -1);
        }

        // Replace only the selected range
        session.replace(selectionRange, formatted);

        // Clear selection after formatting
        session.selection.clearSelection();
        this.#removeErrors(file.id);
    }

    /**
     * Creates and append error to #page
     * @param {string} fileId 
     * @param {Error} error 
     */
    #showError(fileId, error) {
        const message = error.message;
        const now = new Date();
        const localDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        const [line, column] = message.match(/\d+:\d+/)?.[0]?.split(':') || [];
        const file = editorManager.getFile(fileId, 'id');
        const $error = tag('div', {
            dataset: {
                file: fileId,
                type: 'error',
            },
            onclick: () => {
                if (!line || !column) return
                file.session.selection.moveCursorToPosition({
                    row: +line - 1,
                    column: +column - 1
                });
                this.#page.hide();
            },
            style: {
                borderBottom: '1px solid var(--border-color)',
                padding: '5px',
                marginBottom: '5px',
            },
            innerHTML: `<code style="overflow: auto; color: var(--danger-color)"><pre>${error.message}</pre></code>
<div style="display: flex; justify-content: space-between; align-items: center;">
    <span>${file.name} (${line}:${column})</span><span>${localDateTime}</span>
</div>`,
        });
        this.#sideButton?.show();
        this.#page.prepend($error);

        if (this.#page.childElementCount > 10) {
            this.#page.lastChild.remove();
        }

        if (this.prettierOptions.openErrorPageOnErrors) {
            this.#page.show();
        } else {
            toast(
                this.#sideButton && appSettings.value.showSideButtons
                    ? "Error occurred while formatting code. Click on the side button to view logs."
                    : "Error occurred while formatting code. Search for 'prettier logs' in the command palette to view logs."
            );
        }
    }

    removeErrorsByFile(file) {
        this.#removeErrors(file.id);
    }

    #removeErrors(fileId) {
        const $errors = this.#page.getAll(`[data-file="${fileId}"]`);
        for (const $error of $errors) {
            $error.remove();
        }
        if (!this.#page.get('[data-type=error')) {
            this.#sideButton?.hide();
        }
    }

    async #getConfigFile(activeFile) {
        const { uri } = activeFile;
        if (!uri) return;

        const { addedFolder } = window;
        let root = '';
        addedFolder.forEach((folder) => {
            const { url } = folder;
            if (url.startsWith(uri)) {
                if (url.length < root.length || !root) {
                    root = url;
                }
            }
        });

        root = root || url.dirname(uri);
        const promises = [
            ".prettierrc",
            ".prettierrc.json",
            ".prettierrc.yaml",
            ".prettierrc.yml",
            ".prettierrc.toml",
            ".prettierrc.js",
            ".prettier.config.js",
            ".prettierrc.mjs",
            ".prettierrc.config.mjs",
            ".prettierrc.cjs",
            ".prettierrc.config.cjs",
        ].map(async (filename) => {
            const configFile = url.join(root, filename);
            if (await fs(configFile).exists()) {
                return configFile;
            }
        });

        const configFiles = await Promise.all(promises);
        const configFile = configFiles.find((configFile) => configFile);

        if (!configFile) return;

        switch (url.basename(configFile)) {
            case ".prettierrc":
            case ".prettierrc.json":
                return await fs(configFile).readFile('json');
            case ".prettierrc.yaml":
            case ".prettierrc.yml": {
                const text = await fs(configFile).readFile('utf-8');
                return yaml.load(text);
            }
            case ".prettierrc.toml": {
                const text = await fs(configFile).readFile('utf-8');
                return toml.parse(text);
            }
            case ".prettierrc.js":
            case "prettier.config.js":
            case ".prettierrc.mjs":
            case ".prettierrc.config.mjs": {
                const text = await fs(configFile).readFile('utf-8');
                const regex = /export\s+default(\s+const\s+\w+\s*=(?!=)|(?!\s+const\b))/;
                const addToWindow = text.replace(regex, "window.prettierConfig = ");
                // biome-ignore lint/security/noGlobalEval: trusted file
                const prettierConfig = eval(addToWindow);
                delete window.prettierConfig;
                return prettierConfig;
            }

            case ".prettierrc.cjs":
            case ".prettierrc.config.cjs": {
                const text = await fs(configFile).readFile('utf-8');
                const regex = /module\.exports\s*=\s*(\s+const\s+\w+\s*=(?!=)|(?!\s+const\b))/;
                const addToWindow = text.replace(regex, "window.prettierConfig = ");
                // biome-ignore lint/security/noGlobalEval: trusted file
                const prettierConfig = eval(addToWindow);
                delete window.prettierConfig;
                return prettierConfig;
            }
        }
    }

    get commands() {
        return [
            {
                name: "Prettier: Format Selection",
                description: "Format the selection/all with Prettier.",
                bindKey: { win: "Ctrl-Shift-F", mac: "Cmd-Shift-F" },
                exec: () => this.runSelection(),
            },
            {
                name: "Prettier Logs",
                description: "View logs of prettier errors.",
                exec: () => this.#page.show(),
            },
        ]
    }

    get settings() {
        return [
            {
                key: "openErrorPageOnErrors",
                text: "Open logs page on error",
                info: "Open logs page when an error occurs.",
                checkbox: this.prettierOptions.openErrorPageOnErrors,
            },
            {
                key: "printWidth",
                text: "Print Width",
                info: "The line length where Prettier will try wrap.",
                value: this.prettierOptions.printWidth,
                prompt: "Enter print width",
                promptType: "number",
            },
            {
                key: "tabWidth",
                text: "Tab Width",
                info: "Number of spaces per indentation level.",
                value: this.prettierOptions.tabWidth,
                prompt: "Enter tab width",
                promptType: "number",
            },
            {
                key: "useTabs",
                text: "Use Tabs",
                info: "Indent lines with tabs instead of spaces.",
                checkbox: this.prettierOptions.useTabs,
            },
            {
                key: "semi",
                text: "Semicolons",
                info: "Print semicolons at the ends of statements.",
                checkbox: this.prettierOptions.semi,
            },
            {
                key: "singleQuote",
                text: "Single Quote",
                info: "Use single quotes instead of double quotes.",
                checkbox: this.prettierOptions.singleQuote,
            },
            {
                key: "quoteProps",
                text: "Quote Props",
                info: "Change when properties in objects are quoted.",
                value: this.prettierOptions.quoteProps,
                select: ["as-needed", "consistent", "preserve"],
            },
            {
                key: "jsxSingleQuote",
                text: "JSX Single Quote",
                info: "Use single quotes instead of double quotes in JSX.",
                checkbox: this.prettierOptions.jsxSingleQuote,
            },
            {
                key: "trailingComma",
                text: "Trailing Comma",
                info: "Print trailing commas wherever possible.",
                value: this.prettierOptions.trailingComma,
                select: ["none", "es5", "all"],
            },
            {
                key: "bracketSpacing",
                text: "Bracket Spacing",
                info: "Print spaces between brackets in object literals.",
                checkbox: this.prettierOptions.bracketSpacing,
            },
            {
                key: "bracketSameLine",
                text: "Bracket Same Line",
                info: "Put the > of a multi-line JSX element at the end of the last line instead of being alone on the next line.",
                checkbox: this.prettierOptions.bracketSameLine,
            },
            {
                key: "arrowParens",
                text: "Arrow Parens",
                info: "Include parentheses around a sole arrow function parameter.",
                value: this.prettierOptions.arrowParens,
                select: ["avoid", "always"],
            },
            {
                key: "rangeStart",
                text: "Range Start",
                info: "Format only a segment of a file.",
                value: this.prettierOptions.rangeStart,
                prompt: "Enter range start",
                promptType: "number",
            },
            {
                key: "rangeEnd",
                text: "Range End",
                info: "Format only a segment of a file.",
                value: this.prettierOptions.rangeEnd,
                prompt: "Enter range end",
                promptType: "number",
                promptOptions: {
                    placeholder: this.prettierOptions.rangeEnd === Infinity ? "Infinity" : undefined,
                }
            },
            {
                key: "requirePragma",
                text: "Require Pragma",
                info: "Require either '@prettier' or '@format' to be present in the file's first docblock comment.",
                checkbox: this.prettierOptions.requirePragma,
            },
            {
                key: "insertPragma",
                text: "Insert Pragma",
                info: "Insert '@format' pragma into the docblock, if none is present.",
                checkbox: this.prettierOptions.insertPragma,
            },
            {
                key: "proseWrap",
                text: "Prose Wrap",
                info: "How to wrap prose.",
                value: this.prettierOptions.proseWrap,
                select: ["always", "never", "preserve"],
            },
            {
                key: "htmlWhitespaceSensitivity",
                text: "HTML Whitespace Sensitivity",
                info: "How to handle whitespaces in HTML.",
                value: this.prettierOptions.htmlWhitespaceSensitivity,
                select: ["css", "strict", "ignore"],
            },
            {
                key: "vueIndentScriptAndStyle",
                text: "Vue Indent Script And Style",
                info: "Indent script and style tags in Vue files.",
                checkbox: this.prettierOptions.vueIndentScriptAndStyle,
            },
            {
                key: "endOfLine",
                text: "End Of Line",
                info: "Which end of line characters to apply.",
                value: this.prettierOptions.endOfLine,
                select: ["lf", "crlf", "cr", "auto"],
            },
            {
                key: "embeddedLanguageFormatting",
                text: "Embedded Language Formatting",
                info: "Enable/disable embedded language formatting.",
                value: this.prettierOptions.embeddedLanguageFormatting,
                select: ["auto", "off"],
            },
            {
                key: "singleAttributePerLine",
                text: "Single Attribute Per Line",
                info: "Put each attribute in a separate line.",
                checkbox: this.prettierOptions.singleAttributePerLine,
            }
        ]
    }

    onSettingsChange(key, value) {
        this.prettierOptions[key] = value;
        appSettings.value[plugin.id][key] = value;
        appSettings.update();
    }
}

if (window.acode) {
    const prettier = new AcodePrettier();
    acode.setPluginInit(pluginId, (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }
        prettier.baseUrl = baseUrl;
        prettier.init($page, cacheFile, cacheFileUrl);
    }, { list: prettier.settings, cb: prettier.onSettingsChange });
    acode.setPluginUnmount(pluginId, () => {
        prettier.destroy();
    });
}
