import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class FornecedorController {
    public list: RequestHandler = async (req, res) => {
        try {
            const [fornecedores] = await db.query('SELECT * FROM fornecedores ORDER BY nome_fantasia ASC');
            res.json(fornecedores);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar fornecedores.' });
        }
    }

    public create: RequestHandler = async (req, res) => {
        try {
            const [result] = await db.query('INSERT INTO fornecedores SET ?', [req.body]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...req.body });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar fornecedor.' });
        }
    }

    public update: RequestHandler = async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('UPDATE fornecedores SET ? WHERE id = ?', [req.body, id]);
            res.status(200).json({ message: 'Fornecedor atualizado com sucesso.' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar fornecedor.' });
        }
    }
}