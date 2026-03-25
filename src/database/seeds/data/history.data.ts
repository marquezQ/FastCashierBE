// Definimos una estructura estriada para que sea fácil recorrer e insertar
export const historicalData = [
  // ===================== MES: ENERO 2026 =====================
  {
    month: 'January 2026',
    session: {
      userId: 3, // Maria Lopez (Cajera 1)
      initialAmount: 200, // Caja inicial
      openingDate: new Date('2026-01-15T08:00:00.000Z'), // Mitad de enero
      closingDate: new Date('2026-01-15T18:00:00.000Z'), // Cerrado el mismo día
      status: 'CLOSED', // Sesión cerrada
      totalCash: 162, // Ventas en efectivo de las órdenes de abajo (56 + 70 + 36)
      totalQr: 209, // Ventas QR de las órdenes de abajo (116 + 93)
      totalSales: 371, // 162 + 209
      orderCount: 5,
      // Esperado en efectivo: 200 (inicial) + 162 (ventas efectivo) = 362
      // Reporta tener 20 Bs menos (-20 de faltante)
      closingCashAmount: 342, 
      closingQrAmount: 209, // QR exacto
      difference: -20, 
      observations: 'Sesión histórica automatizada - Enero 2026. Faltante de 20 Bs reportado.',
    },
    orders: [
      {
        cashierId: 3,
        cookId: 5, // Juana Perez
        paymentMethod: 'CASH',
        orderType: 'DINE_IN',
        customer: 'Cliente Enero 1',
        orderDate: new Date('2026-01-15T09:30:00.000Z'),
        orderStatus: 'DELIVERED', // Histórico siempre debe estar entregado
        items: [
          { productId: 1, quantity: 2 }, // Broaster Económico x 2 (15 c/u -> ojo: precio actual es 20, usaremos 2) = 40
          { productId: 7, quantity: 2 }, // Gaseosa Personal x 2 (8 c/u) = 16
        ],
        amountPaid: 60, // Total es 56, paga con 60, cambio 4
      },
      {
        cashierId: 3,
        cookId: 5, // Juana Perez
        paymentMethod: 'QR',
        orderType: 'TAKEOUT',
        customer: 'Cliente Enero 2',
        orderDate: new Date('2026-01-15T10:15:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 3, quantity: 1 }, // Combo Familiar x 1 (100 c/u)
          { productId: 9, quantity: 1 }, // Jarra Limonada x 1 (16 c/u)
        ],
        amountPaid: 116, // Total es 116, QR exacto
      },
      {
        cashierId: 3,
        cookId: 5, // Juana Perez
        paymentMethod: 'CASH',
        orderType: 'DINE_IN',
        customer: 'Cliente Enero 3',
        orderDate: new Date('2026-01-15T13:45:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 6, quantity: 2 }, // Cajita Feliz x 2 (35 c/u)
        ],
        amountPaid: 100, // Total es 70, paga con 100, cambio 30
      },
      {
        cashierId: 3,
        cookId: 5, // Juana Perez
        paymentMethod: 'QR',
        orderType: 'DINE_IN',
        customer: 'Cliente Enero 4',
        orderDate: new Date('2026-01-15T15:00:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 5, quantity: 3 }, // Cono Pipocas x 3 (25 c/u) = 75
          { productId: 8, quantity: 3 }, // Vaso Limonada x 3 (6 c/u) = 18
        ],
        amountPaid: 93, // Total es 93, QR exacto
      },
      {
        cashierId: 3,
        cookId: 5, // Juana Perez
        paymentMethod: 'CASH',
        orderType: 'TAKEOUT',
        customer: 'Cliente Enero 5',
        orderDate: new Date('2026-01-15T17:30:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 2, quantity: 1 }, // Broaster 2 Presas x 1 (30 c/u)
          { productId: 11, quantity: 1 }, // Vaso Tostada x 1 (6 c/u)
        ],
        amountPaid: 40, // Total 36, paga con 40, cambio 4
      },
    ],
  },

  // ===================== MES: FEBRERO 2026 =====================
  {
    month: 'February 2026',
    session: {
      userId: 4, // Diego Maradona (Cajero 2)
      initialAmount: 300, // Caja inicial
      openingDate: new Date('2026-02-14T08:00:00.000Z'), // San Valentin
      closingDate: new Date('2026-02-14T18:00:00.000Z'), // Cerrado el mismo día
      status: 'CLOSED', 
      totalCash: 286, // (200 + 36 + 50)
      totalQr: 192, // (76 + 116)
      totalSales: 478,
      orderCount: 5,
      // Esperado en efectivo: 300 (inicial) + 286 (ventas) = 586
      // Reporta tener 10 Bs menos (-10 de faltante)
      closingCashAmount: 576, 
      closingQrAmount: 192, // QR exacto
      difference: -10,
      observations: 'Sesión histórica automatizada - Febrero 2026. Faltante de 10 Bs reportado.',
    },
    orders: [
      {
        cashierId: 4,
        cookId: 6,
        paymentMethod: 'QR',
        orderType: 'DINE_IN',
        customer: 'Pareja Febrero 1',
        orderDate: new Date('2026-02-14T12:30:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 2, quantity: 2 }, // Broaster 2 Presas x 2 (30 c/u = 60)
          { productId: 10, quantity: 1 }, // Jarra Tostada x 1 (16 c/u)
        ],
        amountPaid: 76,
      },
      {
        cashierId: 4,
        cookId: 6,
        paymentMethod: 'CASH',
        orderType: 'TAKEOUT',
        customer: 'Familia Febrero 2',
        orderDate: new Date('2026-02-14T14:15:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 3, quantity: 2 }, // Combo Familiar x 2 (100 c/u = 200)
        ],
        amountPaid: 200,
      },
      {
        cashierId: 4,
        cookId: 6,
        paymentMethod: 'CASH',
        orderType: 'DINE_IN',
        customer: 'Cliente Febrero 3',
        orderDate: new Date('2026-02-14T15:45:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 4, quantity: 1 }, // Tenders x 1 (30 c/u)
          { productId: 11, quantity: 1 }, // Vaso Tostada x 1 (6 c/u)
        ],
        amountPaid: 50, // Total 36, paga con 50
      },
      {
        cashierId: 4,
        cookId: 6,
        paymentMethod: 'QR',
        orderType: 'TAKEOUT',
        customer: 'Grupo Febrero 4',
        orderDate: new Date('2026-02-14T16:20:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 5, quantity: 4 }, // Cono Pipocas x 4 (25 c/u = 100)
          { productId: 9, quantity: 1 }, // Jarra Limonada x 1 (16 c/u)
        ],
        amountPaid: 116,
      },
      {
        cashierId: 4,
        cookId: 6,
        paymentMethod: 'CASH',
        orderType: 'DINE_IN',
        customer: 'Pareja Febrero 5',
        orderDate: new Date('2026-02-14T17:10:00.000Z'),
        orderStatus: 'DELIVERED',
        items: [
          { productId: 1, quantity: 1 }, // Broaster Económico x 1 (20)
          { productId: 4, quantity: 1 }, // Tenders (30)
        ],
        amountPaid: 60, // Total 50, paga con 60
      },
    ],
  },
];
