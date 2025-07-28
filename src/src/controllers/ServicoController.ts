import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class ServicoController {

  create: RequestHandler = async (req, res): Promise<any> => {
    // Adicionado 'custo_servico'
    const { nome, descricao, duracao_minutos, preco, custo_servico, horarios_disponibilidade, grupo_id, regra_fiscal_id } = req.body;
    const empresaId = req.empresa?.id;

    if (!nome || !duracao_minutos || !preco) {
        return res.status(400).json({ error: 'Dados essenciais faltando: nome, duração e preço.' });
    }

    try {
        const newServico = { 
            nome,
            descricao,
            duracao_minutos,
            preco,
            custo_servico: custo_servico || 0.00, // <-- Adicionado com valor padrão
            empresa_id: empresaId, 
            horarios_disponibilidade: JSON.stringify(horarios_disponibilidade),
            grupo_id: grupo_id || null,
            regra_fiscal_id: regra_fiscal_id || null
        };
        const [result] = await db.query('INSERT INTO servicos SET ?', [newServico]);
        const insertId = (result as any).insertId;
        
        return res.status(201).json({ id: insertId, ...req.body });

    } catch (error) {
        console.error("Erro no método create do ServicoController:", error);
        return res.status(500).json({ error: 'Erro interno ao criar serviço.' });
    }
  }

  listByEmpresa: RequestHandler = async (req, res): Promise<any> => {
    const empresaId = req.empresa?.id;
    try {
        // Query atualizada para buscar o custo
        const sql = `
            SELECT 
                s.id, s.nome, s.descricao, s.duracao_minutos, s.preco, s.custo_servico, s.horarios_disponibilidade,
                s.grupo_id, s.regra_fiscal_id,
                sg.nome as grupo_nome,
                rf.nome_regra as regra_fiscal_nome
            FROM servicos s
            LEFT JOIN servico_grupos sg ON s.grupo_id = sg.id
            LEFT JOIN regras_fiscais rf ON s.regra_fiscal_id = rf.id
            WHERE s.empresa_id = ?
        `;
        const [servicos] = await db.query(sql, [empresaId]);
        
        const servicosFormatados = (servicos as any[]).map(servico => ({
            ...servico,
            horarios_disponibilidade: typeof servico.horarios_disponibilidade === 'string' 
                ? JSON.parse(servico.horarios_disponibilidade) 
                : servico.horarios_disponibilidade
        }));

        return res.json(servicosFormatados);
    } catch (error) {
        console.error("Erro no método listByEmpresa do ServicoController:", error);
        return res.status(500).json({ error: 'Erro interno ao listar serviços.' });
    }
  }

  listByEmpresaFromPublic: RequestHandler = async (req, res): Promise<void> => {
    const empresaId = req.params.id; 
    if (!empresaId) {
      res.status(400).json({ message: "ID da empresa é obrigatório" });
      return;
    }
    
    try {
      // Não expõe o custo publicamente
      const [servicos] = await db.query('SELECT id, nome, descricao, duracao_minutos, preco FROM servicos WHERE empresa_id = ?', [empresaId]);
      res.json(servicos);
      return;
    } catch (error) {
      console.error("Erro no método listByEmpresaFromPublic do ServicoController:", error);
      res.status(500).json({ message: 'Erro interno ao listar serviços.' });
      return;
    }
  }

  update: RequestHandler = async (req, res): Promise<any> => {
    const { id } = req.params;
    // Adicionado 'custo_servico'
    const { nome, descricao, duracao_minutos, preco, custo_servico, horarios_disponibilidade, grupo_id, regra_fiscal_id } = req.body;
    const empresaId = req.empresa?.id;

    try {
        const updateData = {
            nome,
            descricao,
            duracao_minutos,
            preco, 
            custo_servico: custo_servico || 0.00, // <-- Adicionado
            horarios_disponibilidade: JSON.stringify(horarios_disponibilidade),
            grupo_id: grupo_id || null,
            regra_fiscal_id: regra_fiscal_id || null
        };

        const [result] = await db.query('UPDATE servicos SET ? WHERE id = ? AND empresa_id = ?', 
            [updateData, id, empresaId]
        );
        
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado ou não pertence a esta empresa.' });
        }

        return res.status(200).json({ id, ...req.body });
    } catch (error) {
        console.error("Erro no método update do ServicoController:", error);
        return res.status(500).json({ error: 'Erro interno ao atualizar serviço.' });
    }
  }

  delete: RequestHandler = async (req, res): Promise<any> => {
    const { id } = req.params;
    const empresaId = req.empresa?.id;

    try {
      const [result] = await db.query('DELETE FROM servicos WHERE id = ? AND empresa_id = ?', [id, empresaId]);
      
      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: 'Serviço não encontrado ou não pertence a esta empresa.' });
      }

      return res.status(204).send(); 
    } catch (error: any) {
      console.error("Erro no método delete do ServicoController:", error);
      
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'Não é possível excluir o serviço, pois ele possui agendamentos vinculados.' });
      }
      
      return res.status(500).json({ error: 'Erro interno ao excluir serviço.' });
    }
  }
}