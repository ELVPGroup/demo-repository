import prisma from '../db.js';

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
    const where = this.extractRoleId(payload);
    const addressList = await prisma.addressInfo.findMany({ where: { ...where } });
    return addressList;
  }

  /**
   * 添加地址
   */
  async createAddress(payload: CreateAddressPayload) {
    const { name, phone, address } = payload;
    const roleId = this.extractRoleId(payload);
    const newAddress = await prisma.addressInfo.create({
      data: {
        name,
        phone,
        address,
        longitude: 0,
        latitude: 0,
        ...roleId,
      },
    });
    return newAddress;
  }

  /**
   * 更新地址
   */
  async updateAddress(payload: UpdateAddressPayload) {
    const { addressInfoId, name, phone, address } = payload;
    const roleId = this.extractRoleId(payload);

    // 构建动态更新字段（只包含提供的字段）
    const updateData: Record<string, string> = {};
    if (name) updateData['name'] = name;
    if (phone) updateData['phone'] = phone;
    if (address) updateData['address'] = address;

    const existingAddress = await prisma.addressInfo.findUnique({
      where: { addressInfoId },
    });
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

    const updatedAddress = await prisma.addressInfo.update({
      where: { addressInfoId },
      data: updateData,
    });
    return updatedAddress;
  }

  /**
   * 删除地址
   */
  async deleteAddress(payload: DeleteAddressPayload) {
    const { addressInfoId } = payload;
    const roleId = this.extractRoleId(payload);

    const existingAddress = await prisma.addressInfo.findUnique({
      where: { addressInfoId },
    });
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

    const deletedAddress = await prisma.addressInfo.delete({
      where: { addressInfoId: existingAddress.addressInfoId },
    });
    return deletedAddress;
  }
}

export const addressService = new AddressService();
