import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class EstoqueController {

    public listarEstoque: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        // --- INÍCIO DA CORREÇÃO ---
        // A consulta agora é mais simples e correta: busca todos os produtos
        // da empresa e junta o estoque correspondente.
        const sql = `
            SELECT 
                p.id, p.nome, p.codigo_interno, p.estoque_minimo,
                IFNULL(e.quantidade, 0) as quantidade_atual
            FROM produtos p
            LEFT JOIN estoque e ON p.id = e.produto_id AND e.empresa_id = ?
            WHERE p.empresa_id = ?
            ORDER BY p.nome;
        `;
        // --- FIM DA CORREÇÃO ---
        const [estoque] = await db.query(sql, [empresaId, empresaId]);
        res.json(estoque);
    });

    public ajustarEstoque: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { produto_id, quantidade, tipo, observacao } = req.body;

        if (!produto_id || !quantidade || !tipo) {
            return res.status(400).json({ error: "Produto, quantidade e tipo são obrigatórios." });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const updateEstoqueSql = `
                INSERT INTO estoque (empresa_id, produto_id, quantidade)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantidade = quantidade + ?;
            `;
            await connection.query(updateEstoqueSql, [empresaId, produto_id, quantidade, quantidade]);

            const movimentacao = {
                empresa_id: empresaId,
                produto_id,
                tipo,
                quantidade,
                observacao
            };
            await connection.query('INSERT INTO movimentacao_estoque SET ?', [movimentacao]);
            
            await connection.commit();
            res.status(200).json({ message: "Estoque ajustado com sucesso." });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });
}