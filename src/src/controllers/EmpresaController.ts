import { Request, Response, RequestHandler, NextFunction } from 'express';
import { db } from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Esta é uma função "wrapper" que lida com erros em rotas assíncronas.
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class EmpresaController {

  public create: RequestHandler = asyncHandler(async (req, res, next) => {
    const { 
        nome_empresa, nome_fantasia, email, telefone, endereco_rua_numero, 
        endereco_cidade, endereco_estado, cep, endereco_bairro, complemento, 
        senha, cnpj, nome_responsavel, tel_responsavel,
        inscricao_estadual, inscricao_municipal, regime_tributario 
    } = req.body;

    if (!email || !senha || !cnpj || !nome_empresa) {
      return res.status(400).json({ error: 'Dados essenciais em falta: email, senha, cnpj, nome_empresa.' });
    }
    
    const [existingEmpresa] = await db.query('SELECT id FROM empresas WHERE email = ? OR cnpj = ?', [email, cnpj]);
    if ((existingEmpresa as any[]).length > 0) {
      return res.status(409).json({ error: 'Email ou CNPJ já registado.' });
    }
    
    const senha_hash = await bcrypt.hash(senha, 8);
    const newEmpresa: any = {
      nome_empresa, nome_fantasia, email, telefone, endereco_rua_numero,
      endereco_cidade, endereco_estado, cep, endereco_bairro, complemento, senha_hash,
      cnpj, nome_responsavel, tel_responsavel,
      inscricao_estadual, inscricao_municipal, regime_tributario
    };
    
    if (req.file) {
      newEmpresa.logo_url = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query('INSERT INTO empresas SET ?', [newEmpresa]);
    const insertId = (result as any).insertId;
    
    delete newEmpresa.senha_hash;
    res.status(201).json({ id: insertId, ...newEmpresa });
  });

  public login: RequestHandler = asyncHandler(async (req, res, next) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const [rows] = await db.query('SELECT * FROM empresas WHERE email = ?', [email]);
    const empresa = (rows as any)[0];
    if (!empresa) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const isPasswordCorrect = await bcrypt.compare(senha, empresa.senha_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const token = jwt.sign({ id: empresa.id, email: empresa.email, type: 'empresa' }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    delete empresa.senha_hash;
    res.status(200).json({ empresa, token });
  });
  
  public getProfile: RequestHandler = asyncHandler(async (req, res, next) => {
    const empresaId = req.empresa?.id;
    if (!empresaId) {
      return res.status(401).json({ error: 'ID da empresa não encontrado no token de autenticação.' });
    }

    // --- CORREÇÃO AQUI: Adicionados os novos campos à query ---
    const sql = `
        SELECT id, nome_empresa, nome_fantasia, email, telefone, 
               endereco_rua_numero, endereco_cidade, endereco_estado, cep, 
               endereco_bairro, complemento, cnpj, nome_responsavel, 
               tel_responsavel, logo_url, inscricao_estadual, 
               inscricao_municipal, regime_tributario 
        FROM empresas 
        WHERE id = ?
    `;
    const [rows] = await db.query(sql, [empresaId]);
    const empresa = (rows as any)[0];
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    res.json(empresa);
  });

  public update: RequestHandler = asyncHandler(async (req, res, next) => {
    const empresaId = req.empresa?.id;
    if (!empresaId) {
      return res.status(401).json({ error: 'ID da empresa não encontrado no token de autenticação.' });
    }

    // --- CORREÇÃO AQUI: Adicionados os novos campos ---
    const { 
        nome_empresa, nome_fantasia, email, telefone, endereco_rua_numero, 
        endereco_cidade, endereco_estado, cep, endereco_bairro, complemento, 
        cnpj, nome_responsavel, tel_responsavel,
        inscricao_estadual, inscricao_municipal, regime_tributario
    } = req.body;
    
    const updatedData: any = {
      nome_empresa, nome_fantasia, email, telefone, endereco_rua_numero,
      endereco_cidade, endereco_estado, cep, endereco_bairro, complemento,
      cnpj, nome_responsavel, tel_responsavel,
      inscricao_estadual, inscricao_municipal, regime_tributario
    };

    if (req.file) {
      updatedData.logo_url = `/uploads/${req.file.filename}`;
    }

    Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);

    await db.query('UPDATE empresas SET ? WHERE id = ?', [updatedData, empresaId]);
    res.json({ message: 'Perfil atualizado com sucesso!', logo_url: updatedData.logo_url });
  });

  public listAll: RequestHandler = asyncHandler(async (req, res, next) => {
    const sql = `SELECT id, nome_fantasia, endereco_cidade, endereco_estado, logo_url FROM empresas;`;
    const [rows] = await db.query(sql);
    res.json(rows);
  });

  public getById: RequestHandler = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const sqlEmpresa = `SELECT id, nome_fantasia, endereco_cidade, endereco_estado, logo_url FROM empresas WHERE id = ?;`;
    const [rowsEmpresa] = await db.query(sqlEmpresa, [id]);
    const empresa = (rowsEmpresa as any)[0];

    if (!empresa) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }
    
    const sqlVideos = `SELECT id, titulo, url_video FROM empresa_videos WHERE empresa_id = ?;`;
    const [videos] = await db.query(sqlVideos, [id]);
    empresa.videos = videos;
    res.json(empresa);
  });

  public addVideo: RequestHandler = asyncHandler(async (req, res, next) => {
    const empresaId = req.empresa?.id;
    const { titulo, url_video } = req.body;

    if (!titulo || !url_video) {
      return res.status(400).json({ error: 'Título e URL do vídeo são obrigatórios.' });
    }
    if (!empresaId) {
      return res.status(401).json({ error: 'Empresa não autenticada.' });
    }
    
    const newVideo = { empresa_id: empresaId, titulo, url_video };
    const [result] = await db.query('INSERT INTO empresa_videos SET ?', [newVideo]);
    const insertId = (result as any).insertId;
    res.status(201).json({ id: insertId, ...newVideo });
  });

  public updateVideo: RequestHandler = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const { titulo, url_video } = req.body;
    const empresaId = req.empresa?.id;

    if (!titulo || !url_video) {
      return res.status(400).json({ error: 'Título e URL do vídeo são obrigatórios.' });
    }
    
    const [result] = await db.query(
      'UPDATE empresa_videos SET titulo = ?, url_video = ? WHERE id = ? AND empresa_id = ?',
      [titulo, url_video, videoId, empresaId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado ou não pertence a esta empresa.' });
    }
    
    res.status(200).json({ message: 'Vídeo atualizado com sucesso.' });
  });

  public deleteVideo: RequestHandler = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const empresaId = req.empresa?.id;

    const [result] = await db.query(
      'DELETE FROM empresa_videos WHERE id = ? AND empresa_id = ?',
      [videoId, empresaId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado ou não pertence a esta empresa.' });
    }
    
    res.status(200).json({ message: 'Vídeo excluído com sucesso.' });
  });
}