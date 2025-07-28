import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { startReminderCronJob } from './services/cronJobs';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3333;

app.use(cors());
app.use(express.json());



app.use('/uploads', express.static(path.resolve('uploads')));

app.use(routes);

app.listen(port, () => {
  console.log(`🚀 Servidor backend rodando na porta ${port}`);
  startReminderCronJob();
});