import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testEdit() {
    try {
        console.log('1. Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            matricula: 'MASTER',
            senha: '123456'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('2. Create Post...');
        const createRes = await axios.post(`${API_URL}/postos`, {
            nome: 'EDIT_TEST_' + Date.now(),
            campus: 'CAMPUS I',
            equipe: 'A',
            jornada_nome: '12x36',
            hora_inicio: '06:00',
            hora_fim: '18:00',
            refeicao: '12:00 - 13:00'
        }, { headers });

        const postoId = createRes.data.id;
        console.log('Created Post ID:', postoId);

        console.log('3. Update Post (Change Name & Time)...');
        const updateRes = await axios.put(`${API_URL}/postos/${postoId}`, {
            nome: 'EDITED_NAME_' + Date.now(),
            campus: 'CAMPUS II', // Changed
            equipe: 'B',       // Changed
            jornada_nome: '12x36',
            hora_inicio: '07:00', // Changed
            hora_fim: '19:00',    // Changed
            refeicao: '13:00 - 14:00' // Changed
        }, { headers });

        console.log('Update Response:', updateRes.data);

        if (updateRes.data.success) {
            console.log('SUCCESS! Post Updated.');

            // Cleanup
            await axios.delete(`${API_URL}/postos/${postoId}`, { headers });
            console.log('Cleaned up test post.');
        } else {
            console.error('Update Failed:', updateRes.data);
        }

    } catch (error: any) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testEdit();
