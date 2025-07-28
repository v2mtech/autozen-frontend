import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class ComissaoController {

    public listRegras: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const sql = `
            SELECT r.*, s.nome as servico_nome
            FROM comissao_regras r
            LEFT JOIN servicos s ON r.aplica_em_servico_id = s.id
            WHERE r.empresa_id = ?
        `;
        const [regras] = await db.query(sql, [empresaId]);
        res.json(regras);
    });

    public createRegra: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const data = { ...req.body, empresa_id: empresaId };
        const [result] = await db.query('INSERT INTO comissao_regras SET ?', [data]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id: insertId, ...data });
    });

    public updateRegra: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const empresaId = req.empresa?.id;
        await db.query('UPDATE comissao_regras SET ? WHERE id = ? AND empresa_id = ?', [req.body, id, empresaId]);
        res.status(200).json({ message: 'Regra atualizada com sucesso.' });
    });

    public getRelatorioComissao: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim, funcionario_id } = req.query;

        if (!data_inicio || !data_fim) {
            res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
            return;
        }

        let sql = `
            SELECT 
                f.nome as funcionario_nome, s.nome as servico_nome,
                ac.base_calculo, ac.valor_comissao, ac.data_criacao
            FROM agendamento_comissoes ac
            JOIN funcionarios f ON ac.funcionario_id = f.id
            JOIN servicos s ON ac.servico_id = s.id
            JOIN agendamentos a ON ac.agendamento_id = a.id
            WHERE a.empresa_id = ? AND ac.data_criacao BETWEEN ? AND ?
        `;
        const params: (string | number | undefined)[] = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];

        if (funcionario_id && funcionario_id !== 'todos') {
            sql += ` AND ac.funcionario_id = ?`;
            params.push(funcionario_id as string);
        }
        
        sql += ` ORDER BY ac.data_criacao DESC`;
        const [detalhes] = await db.query(sql, params);

        const graficoSql = `
            SELECT f.nome as funcionario_nome, SUM(ac.valor_comissao) as total_comissao
            FROM agendamento_comissoes ac
            JOIN funcionarios f ON ac.funcionario_id = f.id
            JOIN agendamentos a ON ac.agendamento_id = a.id
            WHERE a.empresa_id = ? AND ac.data_criacao BETWEEN ? AND ?
            GROUP BY f.nome
            ORDER BY total_comissao DESC
        `;
        const [dadosGrafico] = await db.query(graficoSql, params);

        res.json({ detalhes, dadosGrafico });
    });
}