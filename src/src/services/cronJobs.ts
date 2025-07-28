import cron from 'node-cron';
import { db } from '../database';
import { sendReminderEmail } from './emailService';

// Função que busca agendamentos e envia lembretes
async function checkForReminders() {
    console.log('Executando verificação de lembretes de agendamento...');
    
    try {
        // Busca agendamentos que ocorrerão entre 24 e 25 horas a partir de agora,
        // que ainda não tiveram lembrete enviado e não foram cancelados.
        const sql = `
            SELECT 
                a.id,
                a.data_hora_inicio,
                u.nome as cliente_nome,
                u.email as cliente_email,
                e.nome_fantasia as empresa_nome,
                GROUP_CONCAT(s.nome SEPARATOR ', ') as servicos_nomes
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            JOIN empresas e ON a.empresa_id = e.id
            LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            LEFT JOIN servicos s ON ags.servico_id = s.id
            WHERE 
                a.data_hora_inicio BETWEEN NOW() + INTERVAL 24 HOUR AND NOW() + INTERVAL 25 HOUR
                AND a.lembrete_enviado = 0
                AND a.status != 'cancelado'
            GROUP BY a.id;
        `;
        const [agendamentosParaLembrar] = await db.query(sql);

        if ((agendamentosParaLembrar as any[]).length === 0) {
            console.log('Nenhum agendamento para lembrar nesta hora.');
            return;
        }

        for (const ag of (agendamentosParaLembrar as any[])) {
            await sendReminderEmail({
                clienteNome: ag.cliente_nome,
                clienteEmail: ag.cliente_email,
                empresaNome: ag.empresa_nome,
                dataHora: new Date(ag.data_hora_inicio),
                servicosNomes: ag.servicos_nomes
            });
            // Marca o agendamento como "lembrete enviado" para não enviar novamente
            await db.query('UPDATE agendamentos SET lembrete_enviado = 1 WHERE id = ?', [ag.id]);
        }

    } catch (error) {
        console.error('Erro na tarefa de verificação de lembretes:', error);
    }
}

// Agenda a tarefa para rodar a cada hora, no minuto 0.
export function startReminderCronJob() {
    // '0 * * * *' = Roda no minuto 0 de toda hora.
    cron.schedule('0 * * * *', checkForReminders, {
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Tarefa agendada (Cron Job) para lembretes de e-mail foi iniciada.');
}