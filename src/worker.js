import prettier from "prettier/standalone";
import prettierPlugins from './prettierPlugins';


self.onmessage = async (e) => {
    const { id, code, cursorOptions, action, scriptUrl, isSelection, selectionRange } = e.data;
    if (action === "load script") {
        importScripts(scriptUrl);
        self.postMessage({ action: "script loaded" });
        return;
    }

    cursorOptions.plugins = prettierPlugins;
    try {
        // For selections, use format() instead of formatWithCursor()
        const res = isSelection
            ? await prettier.format(code, cursorOptions)
            : await prettier.formatWithCursor(code, cursorOptions);
        self.postMessage({ id, action: "code format", res, isSelection, selectionRange });
    } catch (error) {
        self.postMessage({ id, action: "code format", error });
    }
};
