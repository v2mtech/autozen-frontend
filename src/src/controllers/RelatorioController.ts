import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

// Esta é uma função "wrapper" que lida com erros em rotas assíncronas.
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class RelatorioController {

    public getFaturamento: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim, servico_id } = req.query;
        if (!data_inicio || !data_fim) {
            return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
        }
        
        let sql = `
            SELECT a.id AS agendamento_id, a.data_hora_inicio, s.nome AS servico_nome, s.preco AS servico_preco,
                u.nome AS cliente_nome, f.nome AS funcionario_nome
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN funcionarios f ON a.funcionario_id = f.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const params: (string | number | undefined)[] = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];
        if (servico_id) {
            sql += ` AND s.id = ?`;
            params.push(servico_id as string);
        }
        sql += ` ORDER BY a.data_hora_inicio ASC;`;
        const [detalhes] = await db.query(sql, params);
        const total = (detalhes as any[]).reduce((acc, item) => acc + parseFloat(item.servico_preco), 0);
        res.json({ detalhes, total });
    });

    public getMailingClientes: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const sql = `
            SELECT DISTINCT u.nome, u.email, u.telefone, u.cpf_cnpj
            FROM usuarios u
            JOIN agendamentos a ON u.id = a.usuario_id
            WHERE a.empresa_id = ? AND a.status = 'concluido'
            ORDER BY u.nome ASC;
        `;
        const [clientes] = await db.query(sql, [empresaId]);
        res.json(clientes);
    });

    public getDashboardAnalytics: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim } = req.query;
        if (!data_inicio || !data_fim) {
            return res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
        }
        
        const params = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];
        const faturamentoSql = `
            SELECT SUM(s.preco) as faturamentoTotal
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?`;
        const [faturamentoResult] = await db.query(faturamentoSql, params);
        const faturamentoTotal = (faturamentoResult as any)[0].faturamentoTotal || 0;
        const faturamentoPorFormaSql = `
            SELECT fp.nome, SUM(s.preco) as total
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            JOIN formas_pagamento fp ON a.forma_pagamento_id = fp.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
            GROUP BY fp.nome ORDER BY total DESC`;
        const [faturamentoPorFormaPagamento] = await db.query(faturamentoPorFormaSql, params);
        const orcamentosAprovadosSql = `
            SELECT DATE(data_execucao_solicitada) as dia, COUNT(id) as quantidade
            FROM orcamentos
            WHERE empresa_id = ? AND status = 'aprovado' AND data_execucao_solicitada BETWEEN ? AND ?
            GROUP BY DATE(data_execucao_solicitada) ORDER BY dia ASC`;
        const [orcamentosAprovados] = await db.query(orcamentosAprovadosSql, params);
        const topServicosSql = `
            SELECT s.nome, COUNT(ags.servico_id) as quantidade
            FROM agendamento_servicos ags
            JOIN servicos s ON ags.servico_id = s.id
            JOIN agendamentos a ON ags.agendamento_id = a.id
            WHERE s.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
            GROUP BY s.nome ORDER BY quantidade DESC LIMIT 5`;
        const [topServicos] = await db.query(topServicosSql, params);
        const servicosPorFuncionarioSql = `
            SELECT f.nome, COUNT(a.id) as quantidade
            FROM agendamentos a
            JOIN funcionarios f ON a.funcionario_id = f.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
            GROUP BY f.nome ORDER BY quantidade DESC`;
        const [servicosPorFuncionario] = await db.query(servicosPorFuncionarioSql, params);
        res.json({
            faturamentoTotal, faturamentoPorFormaPagamento, orcamentosAprovados,
            topServicos, servicosPorFuncionario
        });
    });

    public getCurvaABC: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim } = req.query;

        if (!data_inicio || !data_fim) {
            return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
        }

        const params = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];

        const sql = `
            SELECT 
                p.nome,
                SUM(ap.quantidade) as quantidade_vendida,
                SUM(ap.quantidade * ap.preco_unitario) as valor_total
            FROM agendamento_produtos ap
            JOIN produtos p ON ap.produto_id = p.id
            JOIN agendamentos a ON ap.agendamento_id = a.id
            WHERE a.empresa_id = ? AND a.status = 'concluido'
            AND a.data_hora_inicio BETWEEN ? AND ?
            GROUP BY p.id, p.nome
            ORDER BY valor_total DESC;
        `;
        const [produtos] = await db.query(sql, params);

        const faturamentoTotal = (produtos as any[]).reduce((acc, p) => acc + parseFloat(p.valor_total), 0);

        let acumulado = 0;
        const produtosClassificados = (produtos as any[]).map(p => {
            const participacao = (parseFloat(p.valor_total) / faturamentoTotal) * 100;
            acumulado += participacao;
            let classe = 'C';
            if (acumulado <= 80) {
                classe = 'A';
            } else if (acumulado <= 95) {
                classe = 'B';
            }
            return {
                ...p,
                participacao: participacao.toFixed(2),
                acumulado: acumulado.toFixed(2),
                classe
            };
        });
        
        res.json(produtosClassificados);
    });

    public getAuditoriaEstoque: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim, produto_id } = req.query;
        
        if (!data_inicio || !data_fim) {
            return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
        }
        
        let sql = `
            SELECT 
                m.data_movimento,
                p.nome as produto_nome,
                m.tipo,
                m.quantidade,
                m.observacao,
                m.agendamento_id
            FROM movimentacao_estoque m
            JOIN produtos p ON m.produto_id = p.id
            WHERE m.empresa_id = ? AND m.data_movimento BETWEEN ? AND ?
        `;
        const params: (string | number | undefined)[] = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];

        if (produto_id && produto_id !== 'todos') {
            sql += ` AND m.produto_id = ?`;
            params.push(produto_id as string);
        }

        sql += ` ORDER BY m.data_movimento DESC;`;

        const [movimentacoes] = await db.query(sql, params);
        res.json(movimentacoes);
    });

    public getPosicaoEstoque: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const sql = `
            SELECT 
                p.codigo_interno,
                g.nome as grupo_nome,
                p.nome as produto_nome,
                IFNULL(e.quantidade, 0) as quantidade_estoque
            FROM produtos p
            LEFT JOIN produto_grupos g ON p.grupo_id = g.id
            LEFT JOIN estoque e ON p.id = e.produto_id AND e.empresa_id = ?
            WHERE p.empresa_id = ?
            ORDER BY g.nome, p.nome;
        `;
        const [posicao] = await db.query(sql, [empresaId, empresaId]);
        res.json(posicao);
    });

    // --- NOVO MÉTODO PARA O DRE ---
    public getDRE: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const { data_inicio, data_fim } = req.query;

        if (!data_inicio || !data_fim) {
            return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
        }

        const params = [empresaId, `${data_inicio} 00:00:00`, `${data_fim} 23:59:59`];

        // 1. Receita Bruta de Serviços
        const receitaServicosSql = `
            SELECT SUM(s.preco) as total
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const [receitaServicosResult] = await db.query(receitaServicosSql, params);
        const receitaBrutaServicos = parseFloat((receitaServicosResult as any)[0].total || 0);

        // 2. Receita Bruta de Produtos
        const receitaProdutosSql = `
            SELECT SUM(ap.quantidade * ap.preco_unitario) as total
            FROM agendamentos a
            JOIN agendamento_produtos ap ON a.id = ap.agendamento_id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const [receitaProdutosResult] = await db.query(receitaProdutosSql, params);
        const receitaBrutaProdutos = parseFloat((receitaProdutosResult as any)[0].total || 0);

        // 3. Custo dos Serviços Prestados (CSP)
        const custoServicosSql = `
            SELECT SUM(s.custo_servico) as total
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const [custoServicosResult] = await db.query(custoServicosSql, params);
        const custoServicos = parseFloat((custoServicosResult as any)[0].total || 0);

        // 4. Custo das Mercadorias Vendidas (CMV)
        const custoProdutosSql = `
            SELECT SUM(ap.quantidade * p.preco_unitario) as total
            FROM agendamentos a
            JOIN agendamento_produtos ap ON a.id = ap.agendamento_id
            JOIN produtos p ON ap.produto_id = p.id
            WHERE a.empresa_id = ? AND a.status = 'concluido' AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const [custoProdutosResult] = await db.query(custoProdutosSql, params);
        const custoProdutos = parseFloat((custoProdutosResult as any)[0].total || 0);
        
        // 5. Despesas com Vendas (Comissões)
        const comissoesSql = `
            SELECT SUM(ac.valor_comissao) as total
            FROM agendamento_comissoes ac
            JOIN agendamentos a ON ac.agendamento_id = a.id
            WHERE a.empresa_id = ? AND a.data_hora_inicio BETWEEN ? AND ?
        `;
        const [comissoesResult] = await db.query(comissoesSql, params);
        const despesasComissoes = parseFloat((comissoesResult as any)[0].total || 0);
        
        // --- Montagem do DRE ---
        const receitaBrutaTotal = receitaBrutaServicos + receitaBrutaProdutos;
        // Simplificação: Impostos calculados como 10% da receita bruta. Idealmente, isto viria das regras fiscais.
        const impostosSobreVendas = receitaBrutaTotal * 0.10; 
        const receitaLiquida = receitaBrutaTotal - impostosSobreVendas;
        const custosTotais = custoServicos + custoProdutos;
        const lucroBruto = receitaLiquida - custosTotais;
        const despesasOperacionais = despesasComissoes; // Aqui entrariam outras despesas
        const lucroLiquido = lucroBruto - despesasOperacionais;

        const dre = {
            receitaBrutaServicos,
            receitaBrutaProdutos,
            receitaBrutaTotal,
            impostosSobreVendas,
            receitaLiquida,
            custoServicos,
            custoProdutos,
            custosTotais,
            lucroBruto,
            despesasComissoes,
            despesasOperacionais,
            lucroLiquido
        };

        res.json(dre);
    });
}