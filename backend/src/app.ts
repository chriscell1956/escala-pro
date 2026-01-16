
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Enhanced CORS
const corsOptions = {
    origin: true, // Reflects the request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight with same options

// app.use(helmet()); 
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ message: 'API Escala Pro (Etapa 2) is running' });
});

import escalasRoutes from './routes/escala.routes';
import alocacaoRoutes from './routes/alocacao.routes';
import conflitosRoutes from './routes/conflitos.routes';
import folgasRoutes from './routes/folga.routes';
import dadosRoutes from './routes/dados.routes';

import authRoutes from './routes/authRoutes';
import lancadorRoutes from './routes/lancadorRoutes';
import postosRoutes from './routes/postosRoutes';
import vigilantesRoutes from './routes/vigilantes.routes';

app.use('/api/escalas', escalasRoutes);
app.use('/api/alocacao', alocacaoRoutes);
app.use('/api/conflitos', conflitosRoutes);
app.use('/api/folgas', folgasRoutes);
app.use('/api/dados', dadosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/lancador', lancadorRoutes);
app.use('/api/postos', postosRoutes);
app.use('/api/vigilantes', vigilantesRoutes);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port} `);
    });
}

export default app;
