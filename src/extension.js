"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
// class YamlDefinitionProvider implements vscode.DefinitionProvider {
//     provideDefinition(
//         document: vscode.TextDocument,
//         position: vscode.Position,
//         token: vscode.CancellationToken
//     ): vscode.ProviderResult<vscode.Definition> {
//         const word = document.getText(document.getWordRangeAtPosition(position));
//         if (path.extname(word) === '.yml') {
//             const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
//             if (workspaceFolder) {
//                 const definitionPath = path.join(workspaceFolder.uri.fsPath, word);
//                 const uri = vscode.Uri.file(definitionPath);
//                 const location = new vscode.Location(uri, new vscode.Position(0, 0));
//                 return location;
//             }
//         }
//     }
// }
function formatKetherCode(code) {
    const lines = code.split(/\r?\n/);
    const formattedLines = lines.map((line) => {
        // 检测行的原始缩进（tab 数量）
        const originalIndentMatch = line.match(/^\s*/);
        const originalIndent = originalIndentMatch ? originalIndentMatch[0] : '';
        // 去除行首的缩进后剩余部分进行处理
        let lineContent = line.substr(originalIndent.length);
        if (lineContent.startsWith('#') || lineContent.trim() === '') {
            // 对注释或空行不做处理，只保留缩进
            return originalIndent + lineContent;
        }
        // 保证字符串两侧有空格
        lineContent = lineContent.replace(/("[^"]*")/g, ' $1 ');
        // 保证括号两侧有空格
        lineContent = lineContent.replace(/(\[|\])/g, ' $1 ');
        // 确保操作符两侧有空格
        lineContent = lineContent.replace(/(math\s+(add|sub|mul|div))\s+\[/g, '$1 [ ');
        // 确保关键字两侧有空格，同时忽略了之前关键字后面的 inline
        lineContent = lineContent.replace(/(def|script\s+(run|stop)|check|for|break|call|actionbar|subtitle|title)\b/g, '$1 ');
        // 修正 while 关键字的空格问题
        lineContent = lineContent.replace(/(\bwhile\b)\s+(?!as)/g, '$1 ');
        // 规范化空格，但避免删除命令行中的空格
        lineContent = lineContent.replace(/(?<!["'])\s+(?!["']|$)/g, ' ');
        // 恢复原始缩进并返回处理好的行
        return originalIndent + lineContent.trimRight();
    });
    // 将处理好的行重新合并为字符串
    return formattedLines.join('\n');
}
function activate(context) {
    // context.subscriptions.push(vscode.languages.registerDefinitionProvider(
    //     { scheme: 'file', language: 'kether' }, 
    //     new YamlDefinitionProvider()
    // ));
    let disposable = vscode.commands.registerCommand('extension.ketherDefinition', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const word = document.getText(selection);
            if (!word) {
                vscode.window.showErrorMessage('选中的文本不包含文件名。');
                return;
            }
            const searchPattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '', `**/${word}`);
            vscode.workspace.findFiles(searchPattern, null, 1).then(files => {
                if (files.length > 0) {
                    const fileUri = files[0];
                    vscode.workspace.openTextDocument(fileUri).then(doc => {
                        vscode.window.showTextDocument(doc);
                    }, err => {
                        console.error('Error opening file:', err);
                        vscode.window.showErrorMessage(`无法打开文件: ${fileUri.fsPath}`);
                    });
                }
                else {
                    vscode.window.showErrorMessage(`没有找到文件: ${word}`);
                }
            }, err => {
                console.error('Error searching files:', err);
                vscode.window.showErrorMessage(`搜索文件时出错: ${word}`);
            });
        }
        else {
            vscode.window.showErrorMessage('当前没有打开的编辑器。');
        }
    });
    context.subscriptions.push(disposable, vscode.languages.registerDocumentFormattingEditProvider('kether', {
        provideDocumentFormattingEdits(document) {
            const formattedCode = formatKetherCode(document.getText());
            const entireRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            return [vscode.TextEdit.replace(entireRange, formattedCode)];
        },
    }));
}
exports.activate = activate;
