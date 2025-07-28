import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class CondicaoPagamentoController {
    public list: RequestHandler = async (req, res) => {
        try {
            // CORREÇÃO: Removido o espaço no nome da tabela "condicoes_pagamento"
            const [condicoes] = await db.query('SELECT * FROM condicoes_pagamento WHERE empresa_id = ?', [req.empresa?.id]);
            res.json(condicoes);
        } catch (error) {
            console.error("Erro ao listar condições de pagamento:", error);
            res.status(500).json({ error: 'Erro ao listar condições de pagamento.' });
        }
    }

    public create: RequestHandler = async (req, res) => {
        try {
            const data = { ...req.body, empresa_id: req.empresa?.id };
            const [result] = await db.query('INSERT INTO condicoes_pagamento SET ?', [data]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...data });
        } catch (error) {
            console.error("Erro ao criar condição de pagamento:", error);
            res.status(500).json({ error: 'Erro ao criar condição de pagamento.' });
        }
    }
    
    public update: RequestHandler = async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('UPDATE condicoes_pagamento SET ? WHERE id = ? AND empresa_id = ?', [req.body, id, req.empresa?.id]);
            res.status(200).json({ message: 'Condição de pagamento atualizada.' });
        } catch (error) {
            console.error("Erro ao atualizar condição de pagamento:", error);
            res.status(500).json({ error: 'Erro ao atualizar condição de pagamento.' });
        }
    }
}