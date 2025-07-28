import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class GrupoController {
    public list: RequestHandler = async (req, res) => {
        try {
            // Simplificado para buscar apenas da tabela correta
            const [grupos] = await db.query('SELECT * FROM produto_grupos ORDER BY nome ASC');
            res.json(grupos);
        } catch (error) {
            console.error("Erro ao listar grupos:", error);
            res.status(500).json({ error: 'Erro ao listar grupos.' });
        }
    }

    public create: RequestHandler = async (req, res) => {
        try {
            // Removida qualquer lógica de regra fiscal daqui
            const [result] = await db.query('INSERT INTO produto_grupos SET ?', [req.body]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...req.body });
        } catch (error) {
            console.error("Erro ao criar grupo:", error);
            res.status(500).json({ error: 'Erro ao criar grupo.' });
        }
    }

    public update: RequestHandler = async (req, res) => {
        const { id } = req.params;
        try {
             // Removida qualquer lógica de regra fiscal daqui
            await db.query('UPDATE produto_grupos SET ? WHERE id = ?', [req.body, id]);
            res.status(200).json({ message: 'Grupo atualizado com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar grupo:", error);
            res.status(500).json({ error: 'Erro ao atualizar grupo.' });
        }
    }
}