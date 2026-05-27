const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modelsDir = path.join(__dirname, 'Backend', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/';
const tinyFiles = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1'
];

async function download() {
    for (const file of tinyFiles) {
        const target = path.join(modelsDir, file);
        const url = `${baseUrl}${file}?raw=true`;
        console.log(`Downloading ${file}...`);
        try {
            execSync(`curl.exe -L "${url}" -o "${target}"`);
            console.log(`✅ Success: ${file}`);
        } catch (err) {
            console.error(`❌ Failed: ${file}`, err);
        }
    }
    console.log("Done!");
}

download();
