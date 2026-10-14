import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { IRepository } from '../storage/Repository.js';
import { config } from '../config.js';

export interface AuthTokenPayload {
  userId: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export class AuthService {
  constructor(private repo: IRepository) {}

  async initializeDefaultAdmin(): Promise<void> {
    const existing = await this.repo.getAdmin(config.adminDefaultUser);
    if (!existing) {
      const hash = await bcrypt.hash(config.adminDefaultPass, 10);
      await this.repo.createAdmin(config.adminDefaultUser, hash);
      console.log(`[AUTH] Administrador padrão inicializado: '${config.adminDefaultUser}'`);
    }
  }

  async login(username: string, pass: string): Promise<{ token: string; username: string } | null> {
    const admin = await this.repo.getAdmin(username);
    if (!admin) return null;

    const valid = await bcrypt.compare(pass, admin.passwordHash);
    if (!valid) return null;

    const payload: AuthTokenPayload = {
      userId: admin.id,
      username: admin.username
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '24h'
    });

    return { token, username: admin.username };
  }

  middleware() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Não autorizado. Token de autenticação não fornecido.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
        req.user = decoded;
        next();
      } catch (err) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
    };
  }
}
