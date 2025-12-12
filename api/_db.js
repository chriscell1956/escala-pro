import { promises as fs } from 'fs';
import path from 'path';

// Caminho para o banco de dados.
// NOTA: Na Vercel (produção), o sistema de arquivos é somente leitura.
// A gravação funcionará apenas em ambiente local ou temporariamente em /tmp.
const DB_PATH = path.join(process.cwd(), 'database.json');

export async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Se o arquivo não existir, retorna a estrutura inicial vazia
        return { users: [], schedules: {}, logs: {} };
    }
}

export async function saveDB(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error("Erro ao salvar banco de dados:", err);
        return false;
    }
}