import path from 'path';
import fs from 'fs';
import { app, shell } from 'electron';

export const fileService = {
    saveFile: async (filePath, buffer) => {
        const fileName = path.basename(filePath);
        const destDir = path.join(app.getPath('userData'), 'attachments');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const destPath = path.join(destDir, fileName);
        fs.writeFileSync(destPath, Buffer.from(buffer));
        return destPath;
    },
    openFile: (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            shell.openPath(filePath);
        }
    },
    readFile: (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
        return null;
    },
};
