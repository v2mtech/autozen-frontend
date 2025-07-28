import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class FormaPagamentoController {
    public list: RequestHandler = async (req, res) => {
        try {
            const [formas] = await db.query('SELECT * FROM formas_pagamento ORDER BY nome ASC');
            res.json(formas);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar formas de pagamento.' });
        }
    }

    public create: RequestHandler = async (req, res) => {
        try {
            const data = req.body;
            // Se as bandeiras forem um array, converte para string
            if (Array.isArray(data.bandeiras)) {
                data.bandeiras = data.bandeiras.join(',');
            }
            const [result] = await db.query('INSERT INTO formas_pagamento SET ?', [data]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...data });
        } catch (error) {
            console.error("Erro ao criar forma de pagamento:", error);
            res.status(500).json({ error: 'Erro ao criar forma de pagamento.' });
        }
    }

    public update: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        // Se as bandeiras forem um array, converte para string
        if (Array.isArray(data.bandeiras)) {
            data.bandeiras = data.bandeiras.join(',');
        }
        try {
            await db.query('UPDATE formas_pagamento SET ? WHERE id = ?', [data, id]);
            res.status(200).json({ message: 'Forma de pagamento atualizada com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar forma de pagamento:", error);
            res.status(500).json({ error: 'Erro ao atualizar forma de pagamento.' });
        }
    }
}