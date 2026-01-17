// import fetch from 'node-fetch'; // Built-in in Node 18+

async function testAdapter() {
  try {
    console.log("Testing GET /api/escala/202601...");
    const res = await fetch("http://localhost:3001/api/escala/202601");

    if (!res.ok) {
      console.error(`Request failed: ${res.status} ${res.statusText}`);
      const txt = await res.text();
      console.error(txt);
      return;
    }

    const json = await res.json();

    if (!json.dados || !Array.isArray(json.dados)) {
      console.error("Invalid response format: Expected { dados: [...] }");
      console.log("Received:", JSON.stringify(json).substring(0, 200));
      return;
    }

    console.log(`✅ Success! Received ${json.dados.length} vigilantes.`);

    // Check content sample
    const sample = json.dados[0];
    console.log("Sample Vig:", JSON.stringify(sample, null, 2));

    if (json.dados.length === 0) {
      console.warn("⚠️ Warning: List is empty. Check if database has data.");
    }
  } catch (e) {
    console.error("Connection error:", e.message);
    console.log("Make sure the server is running!");
  }
}

testAdapter();
