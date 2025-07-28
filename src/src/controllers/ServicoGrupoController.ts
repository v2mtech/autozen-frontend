import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class ServicoGrupoController {
    public list: RequestHandler = async (req, res): Promise<any> => {
        const empresaId = req.empresa?.id;
        try {
            // Junta com regras_fiscais para já trazer o nome da regra
            const sql = `
                SELECT 
                    sg.*, 
                    rf.nome_regra 
                FROM servico_grupos sg
                LEFT JOIN regras_fiscais rf ON sg.regra_fiscal_id = rf.id
                WHERE sg.empresa_id = ? 
                ORDER BY sg.nome ASC
            `;
            const [grupos] = await db.query(sql, [empresaId]);
            res.json(grupos);
        } catch (error) {
            console.error("Erro ao listar grupos de serviço:", error);
            res.status(500).json({ error: 'Erro ao listar grupos de serviço.' });
        }
    }

    public create: RequestHandler = async (req, res): Promise<any> => {
        const empresaId = req.empresa?.id;
        const data = { ...req.body, empresa_id: empresaId };
        try {
            const [result] = await db.query('INSERT INTO servico_grupos SET ?', [data]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...data });
        } catch (error) {
            console.error("Erro ao criar grupo de serviço:", error);
            res.status(500).json({ error: 'Erro ao criar grupo de serviço.' });
        }
    }

    public update: RequestHandler = async (req, res): Promise<any> => {
        const { id } = req.params;
        const empresaId = req.empresa?.id;
        try {
            await db.query('UPDATE servico_grupos SET ? WHERE id = ? AND empresa_id = ?', [req.body, id, empresaId]);
            res.status(200).json({ message: 'Grupo de serviço atualizado com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar grupo de serviço:", error);
            res.status(500).json({ error: 'Erro ao atualizar grupo de serviço.' });
        }
    }
}