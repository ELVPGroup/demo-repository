import { addressModel } from '@/models/addressModel.js';
import { amapClient } from '@evlp/shared/utils/amapClient.js';
import { deliveryAreaService } from '@/services/deliveryAreaService.js';
import type { Prisma } from 'generated/prisma/client.js';
import prisma from '@/db.js';

interface BaseAddressPayload {
  userId?: number;
  merchantId?: number;
}

interface CreateAddressPayload extends BaseAddressPayload {
  name: string;
  phone: string;
  address: string;
}

interface UpdateAddressPayload extends BaseAddressPayload {
  addressInfoId: number;
  name?: string;
  phone?: string;
  address?: string;
}

interface DeleteAddressPayload extends BaseAddressPayload {
  addressInfoId: number;
}

interface SetDefaultAddressPayload extends BaseAddressPayload {
  addressInfoId: number;
}

export class AddressService {
  /**
   * 提取 userId 或 merchantId
   */
  private extractRoleId(payload: BaseAddressPayload): { userId?: number; merchantId?: number } {
    if (payload.userId) {
      return { userId: payload.userId };
    }
    if (payload.merchantId) {
      return { merchantId: payload.merchantId };
    }
    throw new Error('Invalid payload: userId or merchantId is required');
  }

  /**
   * 获取商家/用户的地址列表
   */
  async getAddressList(payload: BaseAddressPayload) {
    const where = this.extractRoleId(payload) as Prisma.AddressInfoWhereInput;
    const addressList = await addressModel.findMany({ ...where });
    return addressList;
  }

  /**
   * 验证地址并创建带有坐标的地址对象
   */
  async geocodeAndBuildCreateData(payload: CreateAddressPayload) {
    const roleId = this.extractRoleId(payload);
    const geo = await amapClient.geocode(payload.address);
    if (!geo.location) {
      throw new Error('输入的地址无法解析坐标');
    }
    const [longitude, latitude] = geo.location;
    return {
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      longitude,
      latitude,
      ...roleId,
    };
  }

  /**
   * 添加地址
   */
  async createAddress(payload: CreateAddressPayload) {
    const roleId = this.extractRoleId(payload);
    // 检查是否已存在地址
    const existingCount = await prisma.addressInfo.count({
      where: roleId,
    });

    const data = await this.geocodeAndBuildCreateData(payload);
    const newAddress = await addressModel.create(data);

    // 如果是第一个地址，设为默认地址
    if (existingCount === 0) {
      await this.setDefaultAddress({
        ...roleId,
        addressInfoId: newAddress.addressInfoId,
      });
    }

    return newAddress;
  }

  /**
   * 更新地址
   */
  async updateAddress(payload: UpdateAddressPayload) {
    const { addressInfoId, name, phone, address } = payload;
    const roleId = this.extractRoleId(payload);

    // 构建动态更新字段（只包含提供的字段）
    const updateData: Prisma.AddressInfoUpdateInput = {};
    if (name) updateData['name'] = name;
    if (phone) updateData['phone'] = phone;
    if (address) {
      updateData['address'] = address;
      const geo = await amapClient.geocode(address);
      if (!geo.location) {
        throw new Error('输入的地址无法解析坐标');
      }
      const [longitude, latitude] = geo.location;
      updateData['longitude'] = longitude;
      updateData['latitude'] = latitude;
    }

    const existingAddress = await addressModel.findById(addressInfoId);
    if (!existingAddress) {
      throw new Error('地址不存在');
    }
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有提供更新字段');
    }
    if (
      existingAddress.userId !== roleId.userId &&
      existingAddress.merchantId !== roleId.merchantId
    ) {
      console.log('update address failed: no permission', existingAddress, roleId);

      throw new Error('没有更新该地址的权限');
    }

    const updatedAddress = await addressModel.updateById(addressInfoId, updateData);
    return updatedAddress;
  }

  /**
   * 删除地址
   */
  async deleteAddress(payload: DeleteAddressPayload) {
    const { addressInfoId } = payload;
    const roleId = this.extractRoleId(payload);

    const existingAddress = await addressModel.findById(addressInfoId);
    if (!existingAddress) {
      throw new Error('地址不存在');
    }
    if (
      existingAddress.userId !== roleId.userId &&
      existingAddress.merchantId !== roleId.merchantId
    ) {
      console.log('delete address failed: no permission', existingAddress, roleId);

      throw new Error('没有删除该地址的权限');
    }

    const deletedAddress = await addressModel.deleteById(existingAddress.addressInfoId);
    return deletedAddress;
  }

  /**
   * 获取默认地址
   */
  async getDefaultAddress(payload: BaseAddressPayload) {
    const roleIds = this.extractRoleId(payload);
    if (!roleIds.userId && !roleIds.merchantId) {
      throw new Error('缺少用户ID或商家ID');
    }
    const role = roleIds.userId
      ? await prisma.user.findUnique({
          where: { userId: roleIds.userId },
          include: {
            defaultAddress: true,
          },
        })
      : await prisma.merchant.findUnique({
          where: { merchantId: roleIds.merchantId! },
          include: {
            defaultAddress: true,
          },
        });
    if (!role) {
      throw new Error('用户或商家不存在');
    }
    return role.defaultAddress;
  }

  /**
   * 设置默认地址
   */
  async setDefaultAddress(payload: SetDefaultAddressPayload) {
    const { addressInfoId } = payload;
    const roleId = this.extractRoleId(payload);

    const address = await addressModel.findById(addressInfoId);
    if (!address) {
      throw new Error('地址不存在');
    }

    if (roleId.userId && address.userId !== roleId.userId) {
      throw new Error('没有权限设置该地址为默认地址');
    }
    if (roleId.merchantId && address.merchantId !== roleId.merchantId) {
      throw new Error('没有权限设置该地址为默认地址');
    }

    if (roleId.userId) {
      await prisma.user.update({
        where: { userId: roleId.userId },
        data: { defaultAddressId: addressInfoId },
      });
    } else if (roleId.merchantId) {
      await prisma.merchant.update({
        where: { merchantId: roleId.merchantId },
        data: { defaultAddressId: addressInfoId },
      });
      // 更新商家的配送区域中心点
      await deliveryAreaService.upsert({
        merchantId: roleId.merchantId,
        center: [address.longitude, address.latitude],
        radius: 50000, // 默认配送范围50km
      });
    }

    return address;
  }
}

export const addressService = new AddressService();
