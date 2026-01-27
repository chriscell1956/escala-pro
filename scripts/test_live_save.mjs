
import fs from 'fs';

async function testSave() {
    try {
        const payload = JSON.parse(fs.readFileSync('test_save_payload.json', 'utf8'));
        console.log("Sending payload:", JSON.stringify(payload, null, 2));

        const res = await fetch('https://escalapro.vercel.app/api/presets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error("Response:", text);
        } else {
            console.log("Success! Status:", res.status);
            const json = await res.json();
            console.log("Response JSON:", JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

testSave();
