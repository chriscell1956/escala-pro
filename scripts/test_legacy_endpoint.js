async function testEndpoint() {
  try {
    console.log("📡 Testando endpoint LegacyAdapter...");
    const res = await fetch("http://localhost:3001/api/vigilantes");

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    console.log(`✅ Recebido JSON com ${data.length} vigilantes.`);

    // Valida se tem dias
    const withDays = data.filter((v) => v.dias && v.dias.length > 0);
    console.log(`📅 Vigilantes com escala (dias > 0): ${withDays.length}`);

    if (withDays.length > 0) {
      console.log("Exemplo de retorno:");
      console.log(JSON.stringify(withDays[0], null, 2));
    } else {
      console.warn("⚠️ NENHUM vigilante tem dias alocados no JSON retornado!");
    }
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

testEndpoint();
