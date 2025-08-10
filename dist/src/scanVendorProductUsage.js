"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const targetKeywords = ["sendMail"]; // ✅ Only scanning for 'product'
const targetExtensions = [".ts"];
const baseDir = path_1.default.join(__dirname, "controllers"); // 👈 Only scan ./services
const matches = [];
function scanFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
        targetKeywords.forEach((keyword) => {
            if (line.includes(keyword)) {
                matches.push({ file: filePath, line: idx + 1, text: line.trim() });
            }
        });
    });
}
function walkDir(dir) {
    const files = fs_1.default.readdirSync(dir);
    for (const file of files) {
        const fullPath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        }
        else if (targetExtensions.includes(path_1.default.extname(file))) {
            scanFile(fullPath);
        }
    }
}
// Check if services folder exists
if (!fs_1.default.existsSync(baseDir)) {
    console.error("❌ 'services' folder not found at expected location.");
    process.exit(1);
}
walkDir(baseDir);
// Output results
if (matches.length === 0) {
    console.log("✅ No product references found in services folder.");
}
else {
    console.log(`🔍 Found ${matches.length} 'product' references in 'services':\n`);
    matches.forEach((match) => {
        console.log(`📄 ${match.file} [Line ${match.line}]: ${match.text}`);
    });
}
