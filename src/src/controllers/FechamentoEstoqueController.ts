import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class FechamentoEstoqueController {

    /**
     * Processa os dados do inventário enviados pelo frontend e os compara com o estoque atual.
     */
    public processarInventario: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const inventario: { id: number, contagem: number }[] = req.body;

        if (!inventario || !Array.isArray(inventario)) {
            return res.status(400).json({ error: "Dados de inventário inválidos." });
        }

        const produtoIds = inventario.map(p => p.id);
        if (produtoIds.length === 0) {
            return res.json([]);
        }

        // --- INÍCIO DA CORREÇÃO ---
        // A consulta agora busca os produtos e DEPOIS faz um LEFT JOIN com o estoque da empresa.
        // Isto garante que o nome do produto seja sempre encontrado.
        const sql = `
            SELECT 
                p.id, p.nome,
                IFNULL(e.quantidade, 0) as quantidade_sistema
            FROM produtos p
            LEFT JOIN estoque e ON p.id = e.produto_id AND e.empresa_id = ?
            WHERE p.id IN (?);
        `;
        // --- FIM DA CORREÇÃO ---
        
        const [estoqueAtualRows] = await db.query(sql, [empresaId, produtoIds]);
        const estoqueAtualMap = new Map((estoqueAtualRows as any[]).map(p => [p.id, p]));

        const resultado = inventario.map(itemInventario => {
            const produtoInfo = estoqueAtualMap.get(itemInventario.id);
            const quantidade_sistema = produtoInfo ? parseInt(produtoInfo.quantidade_sistema) : 0;
            const contagem = itemInventario.contagem;
            const diferenca = contagem - quantidade_sistema;
            return {
                id: itemInventario.id,
                nome: produtoInfo ? produtoInfo.nome : 'Produto Desconhecido',
                quantidade_sistema,
                contagem,
                diferenca
            };
        });

        res.json(resultado);
    });

    /**
     * Confirma os ajustes do inventário, atualizando o estoque e registando as movimentações. (Botão Verde)
     */
    public confirmarAjuste: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const ajustes: { id: number, contagem: number, diferenca: number }[] = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const ajuste of ajustes) {
                if (ajuste.diferenca !== 0) {
                    const updateEstoqueSql = `
                        INSERT INTO estoque (empresa_id, produto_id, quantidade)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantidade = ?;
                    `;
                    await connection.query(updateEstoqueSql, [empresaId, ajuste.id, ajuste.contagem, ajuste.contagem]);

                    const tipoMovimentacao = ajuste.diferenca > 0 ? 'ajuste_positivo' : 'ajuste_negativo';
                    const movimentacao = {
                        empresa_id: empresaId,
                        produto_id: ajuste.id,
                        tipo: tipoMovimentacao,
                        quantidade: ajuste.diferenca,
                        observacao: `Ajuste de inventário (Contagem: ${ajuste.contagem})`
                    };
                    await connection.query('INSERT INTO movimentacao_estoque SET ?', [movimentacao]);
                }
            }

            await connection.commit();
            res.status(200).json({ message: "Inventário finalizado e estoque ajustado com sucesso." });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });

    /**
     * Corrige o estoque lançando as diferenças negativas como uma venda genérica. (Botão Amarelo)
     */
    public corrigirEstoqueVendaNaoRegistada: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const ajustes: { id: number, contagem: number, diferenca: number }[] = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const ajuste of ajustes) {
                if (ajuste.diferenca < 0) {
                    const updateEstoqueSql = `
                        INSERT INTO estoque (empresa_id, produto_id, quantidade)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantidade = ?;
                    `;
                    await connection.query(updateEstoqueSql, [empresaId, ajuste.id, ajuste.contagem, ajuste.contagem]);

                    const movimentacao = {
                        empresa_id: empresaId,
                        produto_id: ajuste.id,
                        tipo: 'venda',
                        quantidade: ajuste.diferenca,
                        observacao: `Correção de inventário (venda não registada)`
                    };
                    await connection.query('INSERT INTO movimentacao_estoque SET ?', [movimentacao]);
                }
            }

            await connection.commit();
            res.status(200).json({ message: "Correção de perdas de estoque aplicada com sucesso." });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });
}