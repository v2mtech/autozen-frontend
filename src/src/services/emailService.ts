import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configure o "Transportador" do Nodemailer
// As credenciais são carregadas do seu arquivo .env para segurança.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false, // true para porta 465, false para outras
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Interface para os detalhes do lembrete
interface ReminderDetails {
    clienteNome: string;
    clienteEmail: string;
    empresaNome: string;
    dataHora: Date;
    servicosNomes: string;
}

// 2. Crie a função que envia o e-mail
export async function sendReminderEmail(details: ReminderDetails) {
    const dataFormatada = details.dataHora.toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
    });

    const mailOptions = {
        from: `NaniSound Agendamentos <${process.env.EMAIL_USER}>`,
        to: details.clienteEmail,
        subject: `Lembrete de Agendamento em ${details.empresaNome}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Olá, ${details.clienteNome}!</h2>
                <p>Este é um lembrete do seu agendamento na <strong>${details.empresaNome}</strong>.</p>
                <p><strong>Serviços:</strong> ${details.servicosNomes}</p>
                <p><strong>Data e Hora:</strong> ${dataFormatada}</p>
                <p>Caso precise reagendar ou cancelar, por favor, entre em contato com o estabelecimento ou acesse nossa plataforma.</p>
                <br>
                <p>Atenciosamente,</p>
                <p>Equipe NaniSound</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Lembrete enviado para ${details.clienteEmail}`);
    } catch (error) {
        console.error(`Erro ao enviar e-mail para ${details.clienteEmail}:`, error);
    }
}