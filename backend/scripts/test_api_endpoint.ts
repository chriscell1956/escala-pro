import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testApi() {
    try {
        console.log('1. Logging in to get token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            matricula: 'MASTER',
            senha: '123456'
        });

        const token = loginRes.data.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        console.log('2. Creating Post via API...');
        const postPayload = {
            nome: 'API_TEST_' + Date.now(),
            campus: 'CAMPUS I',
            equipe: 'A',
            jornada_nome: '12x36',
            hora_inicio: '06:00',
            hora_fim: '18:00',
            refeicao: '12:00 - 13:00'
        };

        const createRes = await axios.post(`${API_URL}/postos`, postPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('SUCCESS! Post Created:', createRes.data);

    } catch (error: any) {
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Error Data:', error.response.data);
        } else if (error.request) {
            console.error('API No Response (Server down?):', error.message);
        } else {
            console.error('API Setup Error:', error.message);
        }
    }
}

testApi();
