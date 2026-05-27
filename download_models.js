const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modelsDir = path.join(__dirname, 'Backend', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/';
const baseFiles = [
    'ssd_mobilenetv1_model',
    'face_landmark_68_model',
    'face_recognition_model'
];

async function download() {
    for (const base of baseFiles) {
        // Download manifest
        const manifest = `${base}-weights_manifest.json`;
        const manifestUrl = `${baseUrl}${manifest}?raw=true`;
        console.log(`Downloading ${manifest}...`);
        try {
            execSync(`curl.exe -L "${manifestUrl}" -o "${path.join(modelsDir, manifest)}"`);
        } catch (e) {}

        // Download shards 1 and 2
        for (let i = 1; i <= 2; i++) {
            const shard = `${base}-shard${i}`;
            const shardUrl = `${baseUrl}${shard}?raw=true`;
            console.log(`Downloading ${shard}...`);
            try {
                // We use curl.exe and ignore errors if shard 2 doesn't exist
                execSync(`curl.exe -L "${shardUrl}" -o "${path.join(modelsDir, shard)}"`);
                
                // Check if file is too small (meaning it's a 404 page or something)
                const stats = fs.statSync(path.join(modelsDir, shard));
                if (stats.size < 1000) {
                    fs.unlinkSync(path.join(modelsDir, shard));
                    console.log(`Skipped ${shard} (not found)`);
                } else {
                    console.log(`✅ Success: ${shard}`);
                }
            } catch (err) {
                console.log(`Skipped ${shard}`);
            }
        }
    }
    console.log("Done!");
}

download();
