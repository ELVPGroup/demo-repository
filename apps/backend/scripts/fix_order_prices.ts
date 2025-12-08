
import prisma from '../src/db.js';

async function main() {
  console.log('Start fixing order prices...');

  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log(`Found ${orders.length} orders.`);

  for (const order of orders) {
    const totalPrice = order.orderItems.reduce((acc, item) => {
      return acc + Number(item.product.price) * item.quantity;
    }, 0);

    // Update the order with the calculated total price
    await prisma.order.update({
      where: { orderId: order.orderId },
      data: {
        totalPrice: totalPrice,
      },
    });
  }

  console.log('All orders updated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
