import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testLancador() {
    try {
        console.log('1. Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            matricula: 'MASTER',
            senha: '123456'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('2. Fetch Postos WITHOUT Escala ID (Should work now)...');
        // Passing random year/month to trigger "No Scale Found" logic
        const res = await axios.get(`${API_URL}/lancador/postos?ano=2099&mes=12`, { headers });

        console.log('Response Keys (Campuses):', Object.keys(res.data));

        const firstCampus = Object.keys(res.data)[0];
        if (firstCampus) {
            console.log(`Posts in ${firstCampus}:`, res.data[firstCampus].length);
            console.log('First Post:', res.data[firstCampus][0].setores.nome);
            console.log('Allocations (Should be empty):', res.data[firstCampus][0].alocacoes);
        } else {
            console.log('No posts found?');
        }

    } catch (error: any) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLancador();
