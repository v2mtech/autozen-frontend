import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Note que todas as interfaces e declarações foram removidas daqui.
// O TypeScript vai encontrá-las automaticamente no ficheiro express.d.ts.

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
    return;
  }

  const [bearer, token] = authorization.split(' ');

  if (bearer !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Token malformatado.' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    // Usamos 'any' aqui para simplificar, pois a tipagem já está garantida globalmente
    const payload = decoded as any;

    if (payload.type === 'empresa') {
      req.empresa = payload;
    } else if (payload.type === 'usuario') {
      req.usuario = payload;
    } else {
      res.status(401).json({ error: 'Tipo de token inválido.' });
      return;
    }

    next();

  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}