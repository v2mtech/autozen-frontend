import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UsuarioController {

  create: RequestHandler = async (req, res) => {
    const { 
        nome, email, telefone, senha, tipo_documento, cpf_cnpj, cep, 
        endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, 
        endereco_estado, complemento, veiculo_marca, veiculo_modelo,
        veiculo_ano, veiculo_placa, veiculo_cor 
    } = req.body;

    if (!nome || !email || !senha) {
      res.status(400).json({ error: 'Dados essenciais em falta: nome, email e senha.' });
      return;
    }
    try {
      const [existingUser] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if ((existingUser as any[]).length > 0) {
        res.status(409).json({ error: 'Este email já está registado.' });
        return;
      }

      const senha_hash = await bcrypt.hash(senha, 8);
      
      const newUser = { 
        nome, email, telefone, senha_hash, tipo_documento, cpf_cnpj, cep, 
        endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, 
        endereco_estado, complemento, veiculo_marca, veiculo_modelo,
        veiculo_ano, veiculo_placa, veiculo_cor 
      };

      const [result] = await db.query('INSERT INTO usuarios SET ?', [newUser]);
      const insertId = (result as any).insertId;
      
      const userParaRetorno = { ...newUser };
      delete (userParaRetorno as any).senha_hash;

      res.status(201).json({ id: insertId, ...userParaRetorno });
    } catch (error) {
      console.error("Erro no método create do UsuarioController:", error);
      res.status(500).json({ error: 'Erro interno no servidor ao registar utilizador.' });
    }
  }

  login: RequestHandler = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }
    try {
      const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      const usuario = (rows as any)[0];
      if (!usuario) {
        res.status(401).json({ error: 'Email ou senha inválidos.' });
        return;
      }
      const isPasswordCorrect = await bcrypt.compare(senha, usuario.senha_hash);
      if (!isPasswordCorrect) {
        res.status(401).json({ error: 'Email ou senha inválidos.' });
        return;
      }
      const token = jwt.sign({ id: usuario.id, email: usuario.email, type: 'usuario' }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
      delete usuario.senha_hash;
      res.status(200).json({ usuario, token });
    } catch (error) {
      console.error("Erro no método login do UsuarioController:", error);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }

  getProfile: RequestHandler = async (req, res) => {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        res.status(401).json({ error: 'ID do utilizador não encontrado no token.' });
        return;
    }

    try {
      const [rows] = await db.query('SELECT id, nome, email, telefone, tipo_documento, cpf_cnpj, cep, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, complemento, veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa, veiculo_cor FROM usuarios WHERE id = ?', [usuarioId]);
      const usuario = (rows as any)[0];
      if (!usuario) {
        res.status(404).json({ error: 'Utilizador não encontrado.' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno ao procurar perfil.' });
    }
  }

  update: RequestHandler = async (req, res) => {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        res.status(401).json({ error: 'ID do utilizador não encontrado no token.' });
        return;
    }
    
    const { 
        nome, email, telefone, senha, tipo_documento, cpf_cnpj, cep, 
        endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, 
        endereco_estado, complemento, veiculo_marca, veiculo_modelo,
        veiculo_ano, veiculo_placa, veiculo_cor
    } = req.body;
    
    let senha_hash;
    if (senha) {
      senha_hash = await bcrypt.hash(senha, 8);
    }

    const updatedData: any = { 
        nome, email, telefone, tipo_documento, cpf_cnpj, cep, 
        endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, 
        endereco_estado, complemento, veiculo_marca, veiculo_modelo,
        veiculo_ano, veiculo_placa, veiculo_cor
    };

    if (senha_hash) {
        updatedData.senha_hash = senha_hash;
    }
    
    Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);

    try {
      await db.query('UPDATE usuarios SET ? WHERE id = ?', [updatedData, usuarioId]);
      res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      console.error("Erro ao atualizar o perfil do utilizador:", error);
      res.status(500).json({ error: 'Erro interno ao atualizar o perfil.' });
    }
  }

  public listAll: RequestHandler = async (req, res) => {
        // Validação simples para garantir que apenas uma empresa possa aceder a esta lista
        if (req.empresa?.id) {
            try {
                // Seleciona apenas clientes que já interagiram com a empresa (opcional, mas recomendado)
                const [rows] = await db.query('SELECT id, nome, email FROM usuarios ORDER BY nome ASC');
                res.json(rows);
            } catch (error) {
                res.status(500).json({ error: 'Erro interno ao listar utilizadores.' });
            }
        } else {
            res.status(403).json({ error: 'Acesso não autorizado.' });
        }
    }

}