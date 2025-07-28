import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class ProdutoController {
    public list: RequestHandler = async (req, res) => {
        const empresaId = req.empresa?.id;
        try {
            const sql = `
                SELECT 
                    p.*, 
                    g.nome as grupo_nome, 
                    f.nome_fantasia as fornecedor_nome
                FROM produtos p
                LEFT JOIN produto_grupos g ON p.grupo_id = g.id
                LEFT JOIN fornecedores f ON p.fornecedor_id = f.id
                WHERE p.empresa_id = ?
                ORDER BY p.nome ASC
            `;
            const [produtos] = await db.query(sql, [empresaId]);
            res.json(produtos);
        } catch (error) {
            console.error("Erro ao listar produtos:", error);
            res.status(500).json({ error: 'Erro ao listar produtos.' });
        }
    }

    public create: RequestHandler = async (req, res) => {
        const empresaId = req.empresa?.id;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Adiciona o empresa_id aos dados do novo produto
            const produtoData = { ...req.body, empresa_id: empresaId, status: req.body.status || 'ativo' };
            
            // 2. Insere o novo produto na tabela 'produtos'
            const [result] = await connection.query('INSERT INTO produtos SET ?', [produtoData]);
            const insertId = (result as any).insertId;

            // 3. Automaticamente cria o registo de estoque inicial para este produto na loja
            const estoqueInicial = {
                empresa_id: empresaId,
                produto_id: insertId,
                quantidade: 0 // O estoque começa sempre com zero
            };
            await connection.query('INSERT INTO estoque SET ?', [estoqueInicial]);

            await connection.commit();
            res.status(201).json({ id: insertId, ...produtoData });
        } catch (error) {
            await connection.rollback();
            console.error("Erro ao criar produto:", error);
            res.status(500).json({ error: 'Erro ao criar produto.' });
        } finally {
            connection.release();
        }
    }

    public update: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const empresaId = req.empresa?.id;
        try {
            // Verifica se o produto existe
            await db.query('UPDATE produtos SET ? WHERE id = ? AND empresa_id = ?', [req.body, id, empresaId]);
            res.status(200).json({ message: 'Produto atualizado com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            res.status(500).json({ error: 'Erro ao atualizar produto.' });
        }
    }

    public toggleStatus: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const empresaId = req.empresa?.id;

        if (!status || !['ativo', 'inativo'].includes(status)) {
            res.status(400).json({ error: 'Status inválido.' });
            return;
        }

        try {
            // Verifica se o produto existe
            await db.query('UPDATE produtos SET status = ? WHERE id = ? AND empresa_id = ?', [status, id, empresaId]);
            res.status(200).json({ message: `Produto ${status === 'ativo' ? 'ativado' : 'desativado'} com sucesso.` });
        } catch (error) {
            console.error("Erro ao alterar status do produto:", error);
            res.status(500).json({ error: 'Erro ao alterar status do produto.' });
        }
    }
}