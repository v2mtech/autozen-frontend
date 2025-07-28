import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

function toMySQLDateTime(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export class OrcamentoController {
    
    public create: RequestHandler = asyncHandler(async (req, res, next) => {
        const usuarioId = req.usuario?.id;
        const { empresa_id, descricao, data_orcamento } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!empresa_id || !usuarioId) {
            return res.status(400).json({ error: 'ID da empresa e do utilizador são obrigatórios.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const newOrcamento = {
                usuario_id: usuarioId,
                empresa_id,
                descricao,
                data_orcamento: toMySQLDateTime(data_orcamento || new Date()),
                status: 'solicitado'
            };
            const [result] = await connection.query('INSERT INTO orcamentos SET ?', [newOrcamento]);
            const orcamentoId = (result as any).insertId;

            if (files && files.length > 0) {
                const imagensParaSalvar = files.map(file => [ orcamentoId, `/uploads/${file.filename}` ]);
                await connection.query('INSERT INTO orcamento_imagens (orcamento_id, url_imagem) VALUES ?', [imagensParaSalvar]);
            }

            await connection.commit();
            res.status(201).json({ id: orcamentoId, ...newOrcamento });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });

    public createByEmpresa: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { usuario_id, descricao, servicos_selecionados, produtos_selecionados, condicao_pagamento_id, data_validade, valor_total } = req.body;

        if (!usuario_id || !empresaId) {
            return res.status(400).json({ error: 'ID do cliente e da empresa são obrigatórios.' });
        }

        const newOrcamento = {
            usuario_id,
            empresa_id: empresaId,
            descricao,
            servicos_selecionados: JSON.stringify(servicos_selecionados || []),
            produtos_selecionados: JSON.stringify(produtos_selecionados || []),
            condicao_pagamento_id,
            data_orcamento: toMySQLDateTime(new Date()),
            data_validade,
            valor_total,
            status: 'aguardando cliente'
        };
        const [result] = await db.query('INSERT INTO orcamentos SET ?', [newOrcamento]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id: insertId, ...newOrcamento });
    });
    
    public updateByEmpresa: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const empresaId = req.empresa?.id;
        const { descricao, servicos_selecionados, produtos_selecionados, condicao_pagamento_id, notas_funcionario, data_validade, valor_total, status } = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [orcamentoRows] = await connection.query('SELECT status FROM orcamentos WHERE id = ? AND empresa_id = ?', [id, empresaId]);
            const orcamentoAtual = (orcamentoRows as any)[0];

            if (!orcamentoAtual) {
                await connection.rollback();
                return res.status(404).json({ error: 'Orçamento não encontrado ou não pertence a esta empresa.' });
            }

            if (orcamentoAtual.status === 'aprovado' || orcamentoAtual.status === 'cancelado') {
                await connection.rollback();
                return res.status(403).json({ error: `Não é possível editar um orçamento com o status "${orcamentoAtual.status}".` });
            }
            
            const dataToUpdate: any = {
                descricao,
                servicos_selecionados: JSON.stringify(servicos_selecionados || []),
                produtos_selecionados: JSON.stringify(produtos_selecionados || []),
                condicao_pagamento_id,
                notas_funcionario,
                data_validade,
                valor_total,
                status
            };

            Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

            await connection.query('UPDATE orcamentos SET ? WHERE id = ?', [dataToUpdate, id]);
            
            await connection.commit();
            res.status(200).json({ message: 'Orçamento atualizado com sucesso.' });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });
    
    public listByEmpresa: RequestHandler = asyncHandler(async (req, res, next) => {
        const sql = `
            SELECT 
                o.*, 
                u.nome as nome_cliente,
                u.telefone as cliente_telefone
            FROM orcamentos o
            JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.empresa_id = ? ORDER BY o.data_orcamento DESC
        `;
        const [orcamentos] = await db.query(sql, [req.empresa?.id]);
        res.json(orcamentos);
    });

    public listByCliente: RequestHandler = asyncHandler(async (req, res, next) => {
        const sql = `
            SELECT o.*, e.nome_fantasia as nome_empresa
            FROM orcamentos o
            JOIN empresas e ON o.empresa_id = e.id
            WHERE o.usuario_id = ? ORDER BY o.data_orcamento DESC
        `;
        const [orcamentos] = await db.query(sql, [req.usuario?.id]);
        res.json(orcamentos);
    });
    
    public getById: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        const empresaId = req.empresa?.id;

        const [rows] = await db.query('SELECT * FROM orcamentos WHERE id = ? AND (usuario_id = ? OR empresa_id = ?)', [id, usuarioId, empresaId]);
        const orcamento = (rows as any)[0];
        if (!orcamento) {
            return res.status(404).json({ error: 'Orçamento não encontrado ou acesso não permitido.' });
        }
        const [imagensRows] = await db.query('SELECT id, url_imagem FROM orcamento_imagens WHERE orcamento_id = ?', [id]);
        orcamento.imagens = imagensRows;
        
        orcamento.servicos_selecionados = typeof orcamento.servicos_selecionados === 'string' ? JSON.parse(orcamento.servicos_selecionados || '[]') : orcamento.servicos_selecionados || [];
        orcamento.produtos_selecionados = typeof orcamento.produtos_selecionados === 'string' ? JSON.parse(orcamento.produtos_selecionados || '[]') : orcamento.produtos_selecionados || [];
        
        res.json(orcamento);
    });

    public clienteAprova: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        const { nome_aprovador, documento_aprovador, mensagem_aprovacao, data_execucao_solicitada, funcionario_id_solicitado, assinatura_digital } = req.body;
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [orcamentoRows] = await connection.query('SELECT * FROM orcamentos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
            const orcamento = (orcamentoRows as any)[0];
            if (!orcamento || orcamento.status !== 'aguardando cliente') {
                await connection.rollback();
                return res.status(403).json({ error: 'Orçamento não encontrado ou não pode ser aprovado.' });
            }
            
            // --- INÍCIO DA CORREÇÃO ---
            const servicos = Array.isArray(orcamento.servicos_selecionados) 
                ? orcamento.servicos_selecionados 
                : JSON.parse(orcamento.servicos_selecionados || '[]');
            
            const produtos = Array.isArray(orcamento.produtos_selecionados)
                ? orcamento.produtos_selecionados
                : JSON.parse(orcamento.produtos_selecionados || '[]');

            if (servicos.length === 0 && produtos.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Orçamento não contém serviços ou produtos para agendar.' });
            }
            
            const servicosIds = servicos.map((s: any) => s.id);
            let duracaoTotal = 0;
            if(servicosIds.length > 0) {
                const [servicosDb] = await connection.query('SELECT SUM(duracao_minutos) as duracaoTotal FROM servicos WHERE id IN (?)', [servicosIds]);
                duracaoTotal = (servicosDb as any)[0].duracaoTotal || 60;
            }

            const dataInicio = new Date(data_execucao_solicitada);
            const dataFim = new Date(dataInicio.getTime() + duracaoTotal * 60000);

            const newAgendamento = {
                empresa_id: orcamento.empresa_id,
                usuario_id: usuarioId,
                data_hora_inicio: toMySQLDateTime(dataInicio),
                data_hora_fim: toMySQLDateTime(dataFim),
                status: 'agendado',
                funcionario_id: funcionario_id_solicitado || null,
                desconto_aplicado_valor: 0,
            };
            const [agendamentoResult] = await connection.query('INSERT INTO agendamentos SET ?', [newAgendamento]);
            const agendamentoId = (agendamentoResult as any).insertId;
            
            // Insere os serviços na nova OS
            if (servicos.length > 0) {
                const servicosParaAgendar = servicos.map((s: any) => [agendamentoId, s.id]);
                await connection.query('INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES ?', [servicosParaAgendar]);
            }
            
            // Insere os produtos na nova OS
            if (produtos.length > 0) {
                const produtosParaAgendar = produtos.map((p: any) => [agendamentoId, p.id, 1, p.preco_venda]); // Assumindo quantidade 1
                await connection.query('INSERT INTO agendamento_produtos (agendamento_id, produto_id, quantidade, preco_unitario) VALUES ?', [produtosParaAgendar]);
            }

            const updateSql = `
                UPDATE orcamentos SET 
                    status = "aprovado", agendamento_id = ?, nome_aprovador = ?, 
                    documento_aprovador = ?, mensagem_aprovacao = ?, data_execucao_solicitada = ?, 
                    funcionario_id_solicitado = ?, assinatura_digital = ? 
                WHERE id = ?
            `;
            const updateParams = [
                agendamentoId, nome_aprovador, documento_aprovador, mensagem_aprovacao, 
                toMySQLDateTime(data_execucao_solicitada), funcionario_id_solicitado || null, assinatura_digital, id
            ];
            await connection.query(updateSql, updateParams);
            
            await connection.commit();
            res.status(200).json({ message: 'Orçamento aprovado e agendado com sucesso!', agendamentoId });
        } catch (error) {
            await connection.rollback();
            const errorMessage = error instanceof Error ? error.message : 'Erro interno ao aprovar o orçamento.';
            next(new Error(errorMessage));
        } finally {
            connection.release();
        }
    });
    
    public clienteCancela: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        
        const [result] = await db.query('UPDATE orcamentos SET status = "cancelado" WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado ou não pertence a este utilizador.' });
        }
        res.status(200).json({ message: 'Orçamento cancelado com sucesso.' });
    });
}