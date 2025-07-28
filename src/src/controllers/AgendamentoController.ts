import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

function toMySQLDateTime(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export class AgendamentoController {

    public create: RequestHandler = asyncHandler(async (req, res, next) => {
        const { servicos_ids, empresa_id, data_hora_inicio, voucher_id, funcionario_id } = req.body;
        const usuarioId = req.usuario?.id;
        if (!servicos_ids || !Array.isArray(servicos_ids) || servicos_ids.length === 0 || !empresa_id || !data_hora_inicio || !usuarioId) {
            return res.status(400).json({ error: 'Dados essenciais em falta ou em formato incorreto.' });
        }
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [servicosDb] = await connection.query('SELECT id, duracao_minutos, preco FROM servicos WHERE id IN (?)', [servicos_ids]);
            const servicos = servicosDb as any[];
            if (servicos.length !== servicos_ids.length) {
                await connection.rollback();
                return res.status(404).json({ error: 'Um ou mais serviços não foram encontrados.' });
            }
            const duracaoTotalMinutos = servicos.reduce((acc, s) => acc + s.duracao_minutos, 0);
            const precoTotalServicos = servicos.reduce((acc, s) => acc + parseFloat(s.preco), 0);
            let desconto_aplicado_valor = 0;
            if (voucher_id) {
                const [voucherRows] = await connection.query('SELECT * FROM usuarios_vouchers_cashback WHERE id = ? AND usuario_id = ? AND empresa_id = ? AND status = "disponivel"', [voucher_id, usuarioId, empresa_id]);
                const voucher = (voucherRows as any)[0];
                if (!voucher) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Voucher inválido ou já utilizado.' });
                }
                desconto_aplicado_valor = (precoTotalServicos * parseFloat(voucher.percentual_desconto)) / 100;
            }
            const dataInicio = new Date(data_hora_inicio);
            const dataFim = new Date(dataInicio.getTime() + duracaoTotalMinutos * 60000);
            const newAgendamento = {
                empresa_id: parseInt(empresa_id, 10), usuario_id: usuarioId, data_hora_inicio: toMySQLDateTime(dataInicio),
                data_hora_fim: toMySQLDateTime(dataFim), status: 'agendado', voucher_utilizado_id: voucher_id || null,
                desconto_aplicado_valor: desconto_aplicado_valor.toFixed(2), funcionario_id: funcionario_id || null
            };
            const [result] = await connection.query('INSERT INTO agendamentos SET ?', [newAgendamento]);
            const agendamentoId = (result as any).insertId;
            const agendamentoServicosData = servicos_ids.map(servico_id => [agendamentoId, servico_id]);
            await connection.query('INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES ?', [agendamentoServicosData]);
            if (voucher_id) {
                await connection.query('UPDATE usuarios_vouchers_cashback SET status = "utilizado", agendamento_id_uso = ? WHERE id = ?', [agendamentoId, voucher_id]);
            }
            await connection.commit();
            res.status(201).json({ id: agendamentoId, ...newAgendamento });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });

    public updateStatus: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { status, forma_pagamento_id, condicao_pagamento_id } = req.body;
        const empresaId = req.empresa?.id;
        const allowedStatus = ['agendado', 'em andamento', 'aguardando cliente', 'aguardando peça', 'concluido', 'cancelado'];
        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({ error: 'Status fornecido é inválido.' });
        }
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [agendamentoRows] = await connection.query('SELECT * FROM agendamentos WHERE id = ? AND empresa_id = ?', [id, empresaId]);
            const agendamentoAtual = (agendamentoRows as any)[0];
            if (!agendamentoAtual) {
                await connection.rollback();
                return res.status(404).json({ error: 'Agendamento não encontrado ou não pertence a esta empresa.' });
            }
            if (agendamentoAtual.status === 'concluido' || agendamentoAtual.status === 'cancelado') {
                await connection.rollback();
                return res.status(403).json({ error: `Não é possível editar um agendamento com o status "${agendamentoAtual.status}".` });
            }
            const dataToUpdate: any = { status };
            if (status === 'concluido') {
                if (!forma_pagamento_id || !condicao_pagamento_id) {
                     await connection.rollback();
                     return res.status(400).json({ error: 'Para concluir um agendamento, a forma e condição de pagamento são obrigatórias.'});
                }
                dataToUpdate.forma_pagamento_id = forma_pagamento_id;
                dataToUpdate.condicao_pagamento_id = condicao_pagamento_id;
            }
            await connection.query('UPDATE agendamentos SET ? WHERE id = ?', [dataToUpdate, id]);
            
            if (status === 'concluido' && agendamentoAtual.funcionario_id) {
                const servicosSql = `SELECT servico_id, preco FROM agendamento_servicos JOIN servicos ON servico_id = id WHERE agendamento_id = ?`;
                const [servicosDoAgendamento] = await connection.query(servicosSql, [id]);
                const regrasSql = `SELECT * FROM comissao_regras WHERE empresa_id = ? AND ativo = 1`;
                const [regras] = await connection.query(regrasSql, [empresaId]);

                for (const servico of (servicosDoAgendamento as any[])) {
                    let regraAplicada = (regras as any[]).find(r => r.aplica_em_servico_id === servico.servico_id) 
                                     || (regras as any[]).find(r => r.aplica_em_servico_id == null);
                    if (regraAplicada) {
                        let valor_comissao = 0;
                        if (regraAplicada.tipo === 'percentual') {
                            valor_comissao = (parseFloat(servico.preco) * parseFloat(regraAplicada.valor)) / 100;
                        } else {
                            valor_comissao = parseFloat(regraAplicada.valor);
                        }
                        const comissaoData = {
                            agendamento_id: id,
                            funcionario_id: agendamentoAtual.funcionario_id,
                            servico_id: servico.servico_id,
                            regra_id: regraAplicada.id,
                            base_calculo: servico.preco,
                            percentual_aplicado: regraAplicada.tipo === 'percentual' ? regraAplicada.valor : null,
                            valor_fixo_aplicado: regraAplicada.tipo === 'fixo' ? regraAplicada.valor : null,
                            valor_comissao: valor_comissao.toFixed(2)
                        };
                        await connection.query('INSERT INTO agendamento_comissoes SET ?', comissaoData);
                    }
                }
            }

            await connection.commit();
            res.status(200).json({ id, status });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });
    
    public listByEmpresa: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;
        const sql = `
            SELECT 
                a.id, a.data_hora_inicio, a.data_hora_fim, a.status, a.funcionario_id,
                u.nome as usuario_nome, 
                u.telefone as usuario_telefone,
                f.nome as funcionario_nome,
                GROUP_CONCAT(s.nome SEPARATOR ', ') as servicos_nomes
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            LEFT JOIN servicos s ON ags.servico_id = s.id
            LEFT JOIN funcionarios f ON a.funcionario_id = f.id
            WHERE a.empresa_id = ?
            GROUP BY a.id ORDER BY a.data_hora_inicio DESC
        `;
        const [agendamentos] = await db.query(sql, [empresaId]);
        const eventosFormatados = (agendamentos as any[]).map(ag => {
            const statusColors: { [key: string]: string } = {
                agendado: '#f59e0b', 'em andamento': '#3b82f6', 'concluido': '#22c55e', 
                'cancelado': '#ef4444', 'aguardando cliente': '#8b5cf6', 'aguardando peça': '#eab308'
            };
            return {
                id: ag.id, title: `${ag.usuario_nome} - ${ag.funcionario_nome || 'Sem funcionário'}`,
                start: ag.data_hora_inicio, end: ag.data_hora_fim, color: statusColors[ag.status] || '#6b7280',
                extendedProps: { 
                    status: ag.status, 
                    cliente: ag.usuario_nome, 
                    servicos: ag.servicos_nomes, 
                    funcionario_id: ag.funcionario_id,
                    cliente_telefone: ag.usuario_telefone
                }
            };
        });
        res.json(eventosFormatados);
    });

    public listByUsuario: RequestHandler = asyncHandler(async (req, res, next) => {
        const usuarioId = req.usuario?.id;
        const sql = `
            SELECT 
                a.id, a.data_hora_inicio, a.status, a.empresa_id, e.nome_fantasia AS empresa_nome_fantasia,
                av.id as avaliacao_id, 
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('nome', s.nome, 'preco', s.preco)) 
                 FROM agendamento_servicos ags 
                 JOIN servicos s ON ags.servico_id = s.id 
                 WHERE ags.agendamento_id = a.id) as servicos
            FROM agendamentos a
            JOIN empresas e ON a.empresa_id = e.id
            LEFT JOIN avaliacoes av ON a.id = av.agendamento_id
            WHERE a.usuario_id = ?
            GROUP BY a.id 
            ORDER BY a.data_hora_inicio DESC
        `;
        const [rows] = await db.query(sql, [usuarioId]);
        const agendamentos = (rows as any[]).map(ag => {
            if (ag.servicos && typeof ag.servicos === 'string') {
                ag.servicos = JSON.parse(ag.servicos);
            } else if (!ag.servicos) {
                ag.servicos = [];
            }
            return ag;
        });
        res.json(agendamentos);
    });

    public listConcluidasByUsuario: RequestHandler = asyncHandler(async (req, res, next) => {
        const usuarioId = req.usuario?.id;
        const sql = `
            SELECT 
                a.id, 
                a.data_hora_inicio, 
                e.nome_fantasia AS empresa_nome_fantasia,
                (SELECT SUM(s.preco) 
                 FROM agendamento_servicos ags 
                 JOIN servicos s ON ags.servico_id = s.id 
                 WHERE ags.agendamento_id = a.id) as valor_total
            FROM agendamentos a
            JOIN empresas e ON a.empresa_id = e.id
            WHERE a.usuario_id = ? AND a.status = 'concluido'
            ORDER BY a.data_hora_inicio DESC;
        `;
        const [agendamentos] = await db.query(sql, [usuarioId]);
        res.json(agendamentos);
    });

    public getAgendamentoDetails: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const agendamentoSql = `
            SELECT a.id, a.data_hora_inicio, a.desconto_aplicado_valor, a.status, a.funcionario_id,
                e.nome_fantasia AS empresa_nome, e.nome_empresa AS empresa_razao_social, e.cnpj AS empresa_cnpj,
                u.nome AS usuario_nome, u.email AS usuario_email, u.telefone as usuario_telefone
            FROM agendamentos a
            JOIN empresas e ON a.empresa_id = e.id
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.id = ?
        `;
        const [agendamentoRows] = await db.query(agendamentoSql, [id]);

        if ((agendamentoRows as any[]).length === 0) {
            return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
        }

        const os = (agendamentoRows as any)[0];

        const servicosSql = `
            SELECT s.id, s.nome, s.descricao, s.preco, s.duracao_minutos
            FROM servicos s
            JOIN agendamento_servicos ags ON s.id = ags.servico_id
            WHERE ags.agendamento_id = ?
        `;
        const [servicosRows] = await db.query(servicosSql, [id]);
        
        const produtosSql = `
            SELECT p.id, p.nome, ap.quantidade, ap.preco_unitario as preco_venda
            FROM produtos p
            JOIN agendamento_produtos ap ON p.id = ap.produto_id
            WHERE ap.agendamento_id = ?
        `;
        const [produtosRows] = await db.query(produtosSql, [id]);

        os.servicos = servicosRows;
        os.produtos = produtosRows;

        res.json(os);
    });
    
    public getHorariosDisponiveis: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id: empresaId } = req.params;
        const { data, servicos_ids, funcionario_id } = req.query;
        if (!data || typeof data !== 'string' || !servicos_ids || typeof servicos_ids !== 'string') {
            return res.status(400).json({ error: 'A data e ao menos um ID de serviço são obrigatórios.' });
        }
        const idsArray = servicos_ids.split(',').map(Number);
        const [servicoRows] = await db.query('SELECT duracao_minutos, horarios_disponibilidade FROM servicos WHERE id IN (?)', [idsArray]);
        const servicos = servicoRows as any[];
        if (servicos.length !== idsArray.length) {
            return res.status(404).json({ error: 'Um ou mais serviços não foram encontrados.' });
        }
        const duracaoTotalMinutos = servicos.reduce((total, s) => total + s.duracao_minutos, 0);
        const disponibilidadeBase = servicos[0].horarios_disponibilidade;
        let funcionario = null;
        if (funcionario_id && typeof funcionario_id === 'string' && funcionario_id !== '') {
            const [funcRows] = await db.query('SELECT horarios_trabalho FROM funcionarios WHERE id = ?', [funcionario_id]);
            funcionario = (funcRows as any)[0];
        }
        const diaSelecionado = new Date(`${data}T12:00:00Z`);
        const diaDaSemanaIndex = diaSelecionado.getUTCDay();
        const nomeDiaDaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][diaDaSemanaIndex];
        let disponibilidadeFinal = disponibilidadeBase[nomeDiaDaSemana] || [];
        if (funcionario && funcionario.horarios_trabalho) {
            disponibilidadeFinal = funcionario.horarios_trabalho[nomeDiaDaSemana] || [];
        }
        if (disponibilidadeFinal.length === 0) {
            return res.json([]);
        }
        let sqlAgendamentos = `SELECT data_hora_inicio, data_hora_fim FROM agendamentos WHERE empresa_id = ? AND DATE(data_hora_inicio) = ? AND status != 'cancelado'`;
        const paramsAgendamentos: (string | number)[] = [empresaId, data];
        if (funcionario_id && typeof funcionario_id === 'string' && funcionario_id !== '') {
            sqlAgendamentos += ` AND funcionario_id = ?`;
            paramsAgendamentos.push(funcionario_id);
        }
        const [agendamentosDoDia] = await db.query(sqlAgendamentos, paramsAgendamentos);
        const horariosPossiveis: Date[] = [];
        disponibilidadeFinal.forEach((intervalo: string) => {
            const [inicioStr, fimStr] = intervalo.split('-');
            if (inicioStr && fimStr) {
                const [horaInicio, minInicio] = inicioStr.split(':').map(Number);
                const [horaFim, minFim] = fimStr.split(':').map(Number);
                let slotAtual = new Date(Date.UTC(diaSelecionado.getUTCFullYear(), diaSelecionado.getUTCMonth(), diaSelecionado.getUTCDate(), horaInicio, minInicio));
                let slotFim = new Date(Date.UTC(diaSelecionado.getUTCFullYear(), diaSelecionado.getUTCMonth(), diaSelecionado.getUTCDate(), horaFim, minFim));
                while (slotAtual.getTime() + duracaoTotalMinutos * 60000 <= slotFim.getTime()) {
                    horariosPossiveis.push(new Date(slotAtual));
                    slotAtual.setUTCMinutes(slotAtual.getUTCMinutes() + 15);
                }
            }
        });
        const horariosDisponiveis = horariosPossiveis.filter(horario => {
            const fimDoSlotProposto = new Date(horario.getTime() + duracaoTotalMinutos * 60000);
            return !(agendamentosDoDia as any[]).some(agendamento => {
                const inicioAgendado = new Date(agendamento.data_hora_inicio);
                const fimAgendado = new Date(agendamento.data_hora_fim);
                return horario < fimAgendado && fimDoSlotProposto > inicioAgendado;
            });
        });
        const horariosFormatados = horariosDisponiveis.map(horario => horario.toISOString().substr(11, 5));
        res.json(horariosFormatados);
    });

    public cancelByUser: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [agendamentoRows] = await connection.query('SELECT * FROM agendamentos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
            const agendamento = (agendamentoRows as any)[0];
            if (!agendamento) {
                await connection.rollback();
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }
            if (agendamento.status === 'concluido' || agendamento.status === 'cancelado') {
                await connection.rollback();
                return res.status(400).json({ error: `Não é possível cancelar um agendamento com o status "${agendamento.status}".` });
            }
            if (agendamento.voucher_utilizado_id) {
                await connection.query('UPDATE usuarios_vouchers_cashback SET status = "disponivel", agendamento_id_uso = NULL WHERE id = ?', [agendamento.voucher_utilizado_id]);
            }
            await connection.query('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [id]);
            await connection.commit();
            res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });

    public updateFuncionario: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id: agendamentoId } = req.params;
        const { funcionario_id } = req.body;
        const empresaId = req.empresa?.id;
        
        const [agendamentoRows] = await db.query('SELECT status FROM agendamentos WHERE id = ? AND empresa_id = ?', [agendamentoId, empresaId]);
        const agendamento = (agendamentoRows as any)[0];

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado ou não pertence à sua empresa.' });
        }
        if (agendamento.status === 'concluido' || agendamento.status === 'cancelado') {
            return res.status(403).json({ error: `Este agendamento está ${agendamento.status} e não pode ser alterado.` });
        }

        const idParaSalvar = (funcionario_id && funcionario_id !== '') ? funcionario_id : null;
        await db.query('UPDATE agendamentos SET funcionario_id = ? WHERE id = ?', [idParaSalvar, agendamentoId]);
        res.status(200).json({ message: 'Funcionário associado com sucesso.' });
    });

    public addServico: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id: agendamentoId } = req.params;
        const { servico_id } = req.body;
        const empresaId = req.empresa?.id;
        
        if (!servico_id) {
            return res.status(400).json({ error: 'O ID do serviço é obrigatório.' });
        }
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [agendamentoRows] = await connection.query('SELECT status FROM agendamentos WHERE id = ? AND empresa_id = ?', [agendamentoId, empresaId]);
            const agendamento = (agendamentoRows as any)[0];
            
            if (!agendamento) {
                await connection.rollback();
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }
            if (agendamento.status === 'concluido' || agendamento.status === 'cancelado') {
                await connection.rollback();
                return res.status(403).json({ error: `Este agendamento está ${agendamento.status} e não pode ser alterado.` });
            }
            
            await connection.query('INSERT INTO agendamento_servicos SET ?', { agendamento_id: agendamentoId, servico_id });
            await connection.commit();
            res.status(201).json({ message: 'Serviço adicionado com sucesso.' });

        } catch (error: any) {
            await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'Este serviço já foi adicionado a este agendamento.' });
            } else {
                next(error);
            }
        } finally {
            connection.release();
        }
    });

    public addProduto: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id: agendamentoId } = req.params;
        const { produto_id, quantidade, preco_unitario } = req.body;
        const empresaId = req.empresa?.id;

        if (!produto_id || !quantidade || !preco_unitario) {
            return res.status(400).json({ error: 'ID do produto, quantidade e preço são obrigatórios.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [agendamentoRows] = await connection.query('SELECT status FROM agendamentos WHERE id = ? AND empresa_id = ?', [agendamentoId, empresaId]);
            const agendamento = (agendamentoRows as any)[0];
            
            if (!agendamento) {
                await connection.rollback();
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }
            if (agendamento.status === 'concluido' || agendamento.status === 'cancelado') {
                await connection.rollback();
                return res.status(403).json({ error: `Este agendamento está ${agendamento.status} e não pode ser alterado.` });
            }
            
            const produtoData = {
                agendamento_id: agendamentoId,
                produto_id,
                quantidade,
                preco_unitario
            };

            await connection.query('INSERT INTO agendamento_produtos SET ?', produtoData);
            await connection.commit();
            res.status(201).json({ message: 'Produto adicionado com sucesso.' });

        } catch (error: any) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });

    public finalizarOS: RequestHandler = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { forma_pagamento_id, condicao_pagamento_id } = req.body;
        const empresaId = req.empresa?.id;

        if (!forma_pagamento_id || !condicao_pagamento_id) {
            return res.status(400).json({ error: 'Forma e condição de pagamento são obrigatórias para finalizar.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [agendamentoRows] = await connection.query('SELECT * FROM agendamentos WHERE id = ? AND empresa_id = ?', [id, empresaId]);
            const agendamentoAtual = (agendamentoRows as any)[0];

            if (!agendamentoAtual) {
                await connection.rollback();
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }

            if (agendamentoAtual.status === 'concluido' || agendamentoAtual.status === 'cancelado') {
                await connection.rollback();
                return res.status(403).json({ error: `Este agendamento já se encontra com o status "${agendamentoAtual.status}".` });
            }

            const dataToUpdate = {
                status: 'concluido',
                forma_pagamento_id,
                condicao_pagamento_id
            };

            await connection.query('UPDATE agendamentos SET ? WHERE id = ?', [dataToUpdate, id]);
            
            const [produtosVendidos] = await connection.query('SELECT * FROM agendamento_produtos WHERE agendamento_id = ?', [id]);

            for (const produto of (produtosVendidos as any[])) {
                const quantidadeVendida = produto.quantidade;
                const updateEstoqueSql = `
                    INSERT INTO estoque (empresa_id, produto_id, quantidade)
                    VALUES (?, ?, -?)
                    ON DUPLICATE KEY UPDATE quantidade = quantidade - ?;
                `;
                await connection.query(updateEstoqueSql, [empresaId, produto.produto_id, quantidadeVendida, quantidadeVendida]);

                const movimentacao = {
                    empresa_id: empresaId,
                    produto_id: produto.produto_id,
                    agendamento_id: id,
                    tipo: 'venda',
                    quantidade: -quantidadeVendida,
                    observacao: `Venda na OS #${id}`
                };
                await connection.query('INSERT INTO movimentacao_estoque SET ?', [movimentacao]);
            }

            if (agendamentoAtual.funcionario_id) {
                const servicosSql = `SELECT servico_id, preco FROM agendamento_servicos JOIN servicos ON servico_id = id WHERE agendamento_id = ?`;
                const [servicosDoAgendamento] = await connection.query(servicosSql, [id]);
                const regrasSql = `SELECT * FROM comissao_regras WHERE empresa_id = ? AND ativo = 1`;
                const [regras] = await connection.query(regrasSql, [empresaId]);

                for (const servico of (servicosDoAgendamento as any[])) {
                    let regraAplicada = (regras as any[]).find(r => r.aplica_em_servico_id === servico.servico_id) 
                                     || (regras as any[]).find(r => r.aplica_em_servico_id === null);
                    if (regraAplicada) {
                        let valor_comissao = 0;
                        if (regraAplicada.tipo === 'percentual') {
                            valor_comissao = (parseFloat(servico.preco) * parseFloat(regraAplicada.valor)) / 100;
                        } else {
                            valor_comissao = parseFloat(regraAplicada.valor);
                        }
                        const comissaoData = {
                            agendamento_id: id,
                            funcionario_id: agendamentoAtual.funcionario_id,
                            servico_id: servico.servico_id,
                            regra_id: regraAplicada.id,
                            base_calculo: servico.preco,
                            percentual_aplicado: regraAplicada.tipo === 'percentual' ? regraAplicada.valor : null,
                            valor_fixo_aplicado: regraAplicada.tipo === 'fixo' ? regraAplicada.valor : null,
                            valor_comissao: valor_comissao.toFixed(2)
                        };
                        await connection.query('INSERT INTO agendamento_comissoes SET ?', comissaoData);
                    }
                }
            }

            await connection.commit();
            res.status(200).json({ message: 'Ordem de Serviço finalizada com sucesso.' });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    });
}