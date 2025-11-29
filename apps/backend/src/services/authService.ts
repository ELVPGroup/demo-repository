import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { ServiceKey, generateServiceId } from '../utils/serverIdHandler.js';

const JWT_SECRET = process.env['JWT_SECRET'] || '';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '1h';

export type RequestSide = 'client' | 'merchant';

interface RegisterPayload {
  side: RequestSide;
  name: string;
  phone: string;
  password: string;
}

interface LoginPayload {
  side: RequestSide;
  phone: string;
  password: string;
}

interface TokenPayload {
  side: RequestSide;
  id: number;
  phone: string;
}

export class AuthService {
  /**
   * 用户注册
   */
  async register(payload: RegisterPayload) {
    const { side, name, phone, password } = payload;

    // 检查用户是否已存在
    const existingRole =
      side === 'client'
        ? await prisma.user.findUnique({
            where: { phone },
          })
        : await prisma.merchant.findUnique({
            where: { phone },
          });

    if (existingRole) {
      throw new Error('用户已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const role =
      side === 'client'
        ? await prisma.user.create({
            data: {
              name,
              phone,
              password: hashedPassword,
            },
          })
        : await prisma.merchant.create({
            data: {
              name,
              phone,
              password: hashedPassword,
            },
          });

    // 生成 JWT token
    const roleId =
      side === 'client'
        ? (role as { userId: number }).userId
        : (role as { merchantId: number }).merchantId;

    const token = this.generateToken({
      side,
      id: roleId,
      phone: role.phone,
    });

    return {
      side,
      id:
        side === 'client'
          ? generateServiceId(roleId, ServiceKey.client)
          : generateServiceId(roleId, ServiceKey.merchant),
      name: role.name,
      token,
    };
  }

  /**
   * 用户登录
   */
  async login(payload: LoginPayload) {
    const { side, phone, password } = payload;

    // 查找用户或商家
    const role =
      side === 'client'
        ? await prisma.user.findUnique({
            where: { phone },
          })
        : await prisma.merchant.findUnique({
            where: { phone },
          });

    if (!role) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, role.password);

    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    // 生成 JWT token
    const roleId =
      side === 'client'
        ? (role as { userId: number }).userId
        : (role as { merchantId: number }).merchantId;

    const token = this.generateToken({
      side,
      id: roleId,
      phone: role.phone,
    });

    return {
      side,
      id:
        side === 'client'
          ? generateServiceId(roleId, ServiceKey.client)
          : generateServiceId(roleId, ServiceKey.merchant),
      name: role.name,
      token,
    };
  }

  /**
   * 生成 JWT token
   */
  private generateToken(payload: TokenPayload): string {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * 验证 JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch {
      throw new Error('Token 无效或已过期');
    }
  }

  /**
   * 从 token 中提取用户信息
   */
  async getUserFromToken(token: string) {
    const decoded = this.verifyToken(token);

    if (decoded.side === 'client') {
      const user = await prisma.user.findUnique({
        where: { userId: decoded.id },
        select: {
          userId: true,
          name: true,
          phone: true,
        },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return user;
    } else {
      const merchant = await prisma.merchant.findUnique({
        where: { merchantId: decoded.id },
        select: {
          merchantId: true,
          name: true,
          phone: true,
        },
      });

      if (!merchant) {
        throw new Error('商家不存在');
      }

      return merchant;
    }
  }
}

export const authService = new AuthService();
