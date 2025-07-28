import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class FuncionarioController {

  /**
   * Cria um novo funcionário, incluindo seus horários de trabalho.
   */
  public create: RequestHandler = async (req, res) => {
    const { nome, email, telefone, horarios_trabalho } = req.body;
    const empresaId = req.empresa?.id;

    if (!nome) {
      res.status(400).json({ error: 'O nome do funcionário é obrigatório.' });
    } else {
      try {
        const newFuncionario = {
          nome,
          email,
          telefone,
          empresa_id: empresaId,
          horarios_trabalho: JSON.stringify(horarios_trabalho || {}) // Garante que é sempre um JSON
        };
        const [result] = await db.query('INSERT INTO funcionarios SET ?', [newFuncionario]);
        const insertId = (result as any).insertId;
        
        res.status(201).json({ id: insertId, ...req.body });
      } catch (error) {
        console.error("Erro ao criar funcionário:", error);
        res.status(500).json({ error: 'Erro interno ao cadastrar funcionário.' });
      }
    }
  }

  /**
   * Lista todos os funcionários da empresa, formatando seus horários.
   */
  public listByEmpresa: RequestHandler = async (req, res) => {
    const empresaId = req.empresa?.id;
    try {
      const [funcionarios] = await db.query('SELECT id, nome, email, telefone, horarios_trabalho FROM funcionarios WHERE empresa_id = ? ORDER BY nome ASC', [empresaId]);
      
      const funcionariosFormatados = (funcionarios as any[]).map(func => {
        let horarios = null;
        if (func.horarios_trabalho) {
          // Se for uma string, faz o parse. Se já for um objeto, usa diretamente.
          if (typeof func.horarios_trabalho === 'string') {
            try {
              horarios = JSON.parse(func.horarios_trabalho);
            } catch (e) {
              console.error("Erro ao fazer parse dos horários do funcionário:", e);
              horarios = null; // Define como nulo em caso de erro no parse
            }
          } else {
            horarios = func.horarios_trabalho; // Já é um objeto
          }
        }
        return { ...func, horarios_trabalho: horarios };
      });

      res.json(funcionariosFormatados);
    } catch (error) {
      console.error("Erro ao listar funcionários:", error);
      res.status(500).json({ error: 'Erro interno ao listar funcionários.' });
    }
  }
  
  /**
   * Lista todos os funcionários de uma empresa para o público (sem dados sensíveis).
   */
 public listByEmpresaFromPublic: RequestHandler = async (req, res) => {
    const { id: empresaId } = req.params;
    try {
      const [funcionarios] = await db.query('SELECT id, nome FROM funcionarios WHERE empresa_id = ? ORDER BY nome ASC', [empresaId]);
      res.json(funcionarios);
    } catch (error) {
      console.error("Erro ao listar funcionários para o público:", error);
      res.status(500).json({ error: 'Erro interno ao listar funcionários.' });
    }
  }

  /**
   * Atualiza os dados de um funcionário, incluindo os horários.
   */
  public update: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresa?.id;
    const { nome, email, telefone, horarios_trabalho } = req.body;

    try {
      const dadosParaAtualizar = {
        nome,
        email,
        telefone,
        horarios_trabalho: JSON.stringify(horarios_trabalho || {})
      };

      const [result] = await db.query('UPDATE funcionarios SET ? WHERE id = ? AND empresa_id = ?', [dadosParaAtualizar, id, empresaId]);

      if ((result as any).affectedRows === 0) {
        res.status(404).json({ error: 'Funcionário não encontrado ou não pertence a esta empresa.' });
      } else {
        res.status(200).json({ message: 'Funcionário atualizado com sucesso' });
      }
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      res.status(500).json({ error: 'Erro interno ao atualizar funcionário.' });
    }
  }
  
  /**
   * MÉTODO REINTEGRADO: Gera um relatório de faturamento simples para um funcionário.
   */
  public getRelatorio: RequestHandler = async (req, res) => {
    const { id: funcionarioId } = req.params;
    const empresaId = req.empresa?.id;

    try {
      const sql = `
        SELECT
          f.nome AS funcionario_nome,
          COUNT(DISTINCT a.id) AS total_agendamentos_concluidos,
          SUM(s.preco) AS faturamento_total
        FROM agendamentos a
        JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
        JOIN servicos s ON ags.servico_id = s.id
        JOIN funcionarios f ON a.funcionario_id = f.id
        WHERE a.funcionario_id = ?
          AND a.empresa_id = ?
          AND a.status = 'concluido'
        GROUP BY f.id, f.nome;
      `;
      const [rows] = await db.query(sql, [funcionarioId, empresaId]);
      const relatorio = (rows as any)[0];

      if (!relatorio) {
        const [funcRows] = await db.query('SELECT nome FROM funcionarios WHERE id = ? AND empresa_id = ?', [funcionarioId, empresaId]);
        const funcionario = (funcRows as any)[0];

        if (!funcionario) {
          res.status(404).json({ error: 'Funcionário não encontrado ou não pertence a esta empresa.' });
        } else {
          res.json({
            funcionario_nome: funcionario.nome,
            total_agendamentos_concluidos: 0,
            faturamento_total: "0.00"
          });
        }
      } else {
        res.json(relatorio);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ error: 'Erro interno ao gerar relatório.' });
    }
  }

  /**
   * Gera um relatório detalhado de serviços prestados por um funcionário.
   */
  public getRelatorioDetalhado: RequestHandler = async (req, res) => {
    const { id: funcionarioId } = req.params;
    const empresaId = req.empresa?.id;
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    } else {
        try {
        const sql = `
            SELECT
            a.data_hora_inicio,
            s.nome AS servico_nome,
            s.preco AS servico_preco,
            u.nome as cliente_nome
            FROM agendamentos a
            JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
            JOIN servicos s ON ags.servico_id = s.id
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.funcionario_id = ?
            AND a.empresa_id = ?
            AND a.status = 'concluido'
            AND a.data_hora_inicio BETWEEN ? AND ?
            ORDER BY a.data_hora_inicio ASC;
        `;
        
        const [servicos] = await db.query(sql, [
            funcionarioId, 
            empresaId, 
            `${data_inicio} 00:00:00`, 
            `${data_fim} 23:59:59`
        ]);

        const total = (servicos as any[]).reduce((acc, servico) => acc + parseFloat(servico.servico_preco), 0);
        
        res.json({ servicos, total });

        } catch (error) {
        console.error("Erro ao gerar relatório detalhado:", error);
        res.status(500).json({ error: 'Erro interno ao gerar relatório detalhado.' });
        }
    }
  }
}