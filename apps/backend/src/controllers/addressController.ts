import type { Context } from 'koa';
import { addressService } from '@/services/addressService.js';
import { generateServiceId, parseServiceId, ServiceKey } from '@/utils/serverIdHandler.js';

interface AddressItem {
  addressInfoId: number;
  name: string;
  phone: string;
  address: string;
  longitude: number;
  latitude: number;
}

/**
 * 地址控制器
 * 负责处理请求、验证参数、调用服务层、返回响应
 */
export class AddressController {
  private extractRoleId(ctxUserState: { side: string; id: number }) {
    if (ctxUserState.side === 'client') {
      return { userId: ctxUserState.id };
    } else if (ctxUserState.side === 'merchant') {
      return { merchantId: ctxUserState.id };
    }
    throw new Error('Invalid payload: userId or merchantId is required');
  }

  /**
   * 转换地址为标准返回格式
   */
  private transformAddress(addressItem: AddressItem) {
    const { addressInfoId, name, phone, address, longitude, latitude } = addressItem;

    return {
      addressInfoId: generateServiceId(addressInfoId, ServiceKey.addressInfo),
      name,
      phone,
      address,
      location: [longitude, latitude],
    };
  }

  /**
   * 获取地址簿列表
   */
  async getAddressList(ctx: Context): Promise<void> {
    try {
      const addressList = await addressService.getAddressList({
        ...this.extractRoleId(ctx.state['user']),
      });

      ctx.status = 200;
      ctx.body = {
        _data: addressList.map((addressItem) => this.transformAddress(addressItem)),
        _message: '获取地址簿列表成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取地址簿列表失败',
      };
    }
  }

  /**
   * 添加地址
   */
  async createAddress(ctx: Context): Promise<void> {
    try {
      const { name, phone, address } = ctx.request.body as {
        name?: string;
        phone?: string;
        address?: string;
      };

      const result = await addressService.createAddress({
        ...this.extractRoleId(ctx.state['user']),
        name: name as string,
        phone: phone as string,
        address: address as string,
      });

      ctx.status = 201;
      ctx.body = {
        _data: this.transformAddress(result),
        _message: '添加地址成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '添加地址失败',
      };
    }
  }

  /**
   * 更新地址
   */
  async updateAddress(ctx: Context): Promise<void> {
    try {
      const { addressInfoId, name, phone, address } = ctx.request.body as {
        addressInfoId?: string;
        name?: string;
        phone?: string;
        address?: string;
      };

      if (!addressInfoId) {
        ctx.status = 400;
        ctx.body = {
          _message: '缺少地址信息ID',
        };
        return;
      }

      await addressService.updateAddress({
        ...this.extractRoleId(ctx.state['user']),
        addressInfoId: parseServiceId(addressInfoId).id,
        name: name as string,
        phone: phone as string,
        address: address as string,
      });

      ctx.status = 200;
      ctx.body = {
        _message: '更新地址成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '更新地址失败',
      };
    }
  }

  /**
   * 删除地址
   */
  async deleteAddress(ctx: Context): Promise<void> {
    try {
      const { addressInfoId } = ctx.params as {
        addressInfoId: string;
      };

      const result = await addressService.deleteAddress({
        ...this.extractRoleId(ctx.state['user']),
        addressInfoId: parseServiceId(addressInfoId).id,
      });

      ctx.status = 200;
      ctx.body = {
        _data: this.transformAddress(result),
        _message: '删除地址成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '删除地址失败',
      };
    }
  }

  /**
   * 获取默认地址
   */
  async getDefaultAddress(ctx: Context): Promise<void> {
    try {
      const address = await addressService.getDefaultAddress({
        ...this.extractRoleId(ctx.state['user']),
      });
      if (!address) {
        ctx.status = 400;
        ctx.body = {
          _message: '未设置默认地址',
        };
        return;
      }
      ctx.status = 200;
      ctx.body = {
        _data: this.transformAddress(address),
        _message: '获取默认地址成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取默认地址失败',
      };
    }
  }
  /**
   * 设置默认地址
   */
  async setDefaultAddress(ctx: Context): Promise<void> {
    try {
      const { addressInfoId } = ctx.request.body as {
        addressInfoId?: string;
      };

      if (!addressInfoId) {
        ctx.status = 400;
        ctx.body = {
          _message: '缺少地址信息ID',
        };
        return;
      }
      console.log('controller', this.extractRoleId(ctx.state['user']));
      const result = await addressService.setDefaultAddress({
        ...this.extractRoleId(ctx.state['user']),
        addressInfoId: parseServiceId(addressInfoId).id,
      });

      ctx.status = 200;
      ctx.body = {
        _data: this.transformAddress(result),
        _message: '设置默认地址成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '设置默认地址失败',
      };
    }
  }
}

export const addressController = new AddressController();
