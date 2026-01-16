import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testEspelho() {
    try {
        console.log('1. Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            matricula: 'MASTER',
            senha: '123456'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get first scale
        const scales = await axios.get(`${API_URL}/escalas`, { headers });
        if (scales.data.length === 0) {
            console.log('No scales found. Create one first.');
            return;
        }
        const escalaId = scales.data[0].id;
        console.log(`Testing Espelho for Escala ID: ${escalaId}`);

        const res = await axios.get(`${API_URL}/escalas/${escalaId}/espelho`, { headers });

        console.log(`Received ${res.data.length} vigilantes.`);
        if (res.data.length > 0) {
            console.log('First Vigilante:', res.data[0].vigilante.nome);
            console.log('Allocations:', JSON.stringify(res.data[0].dias, null, 2));
        }

    } catch (error: any) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testEspelho();
