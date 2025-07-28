import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class AvaliacaoController {

    /**
     * Cliente cria uma nova avaliação para um agendamento concluído.
     */
    public create: RequestHandler = async (req, res) => {
        const { agendamento_id, nota, comentario } = req.body;
        const usuarioId = req.usuario?.id;

        if (!agendamento_id || !nota) {
            res.status(400).json({ error: 'ID do agendamento e nota são obrigatórios.' });
        } else {
            try {
                // Verifica se o agendamento pertence ao usuário e se está concluído
                const [agendamentoRows] = await db.query(
                    'SELECT id, empresa_id FROM agendamentos WHERE id = ? AND usuario_id = ? AND status = "concluido"',
                    [agendamento_id, usuarioId]
                );
                const agendamento = (agendamentoRows as any)[0];

                if (!agendamento) {
                    res.status(403).json({ error: 'Você não pode avaliar este agendamento ou ele não foi concluído.' });
                } else {
                    const newAvaliacao = {
                        agendamento_id,
                        usuario_id: usuarioId,
                        empresa_id: agendamento.empresa_id,
                        nota,
                        comentario
                    };
        
                    const [result] = await db.query('INSERT INTO avaliacoes SET ?', [newAvaliacao]);
                    const insertId = (result as any).insertId;
        
                    res.status(201).json({ id: insertId, ...newAvaliacao });
                }

            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({ error: 'Este agendamento já foi avaliado.' });
                } else {
                    console.error("Erro ao criar avaliação:", error);
                    res.status(500).json({ error: 'Erro interno ao criar avaliação.' });
                }
            }
        }
    }

    /**
     * Lista todas as avaliações de uma empresa específica (rota pública).
     */
    public listByEmpresa: RequestHandler = async (req, res) => {
        const { id: empresaId } = req.params;

        try {
            const sql = `
                SELECT 
                    a.id,
                    a.nota,
                    a.comentario,
                    a.criado_em,
                    u.nome as usuario_nome
                FROM avaliacoes a
                JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.empresa_id = ?
                ORDER BY a.criado_em DESC
            `;
            const [avaliacoes] = await db.query(sql, [empresaId]);
            res.json(avaliacoes);
        } catch (error) {
            console.error("Erro ao listar avaliações:", error);
            res.status(500).json({ error: 'Erro interno ao listar avaliações.' });
        }
    }
}