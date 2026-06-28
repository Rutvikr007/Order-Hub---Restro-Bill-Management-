import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import * as orderService from "../services/orderService";
import { emitOrderCreated, emitOrderStatusUpdated } from "../sockets";
import { CreateOrderInput, ListOrdersQuery, UpdateOrderStatusInput } from "../validators/orderValidators";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateOrderInput;
  const order = await orderService.createOrder(input);

  emitOrderCreated(order.store_id, order);

  res.status(201).json({ data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListOrdersQuery;
  const result = await orderService.listOrdersByStore(query);

  res.status(200).json(result);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json({ data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateOrderStatusInput;
  const order = await orderService.updateOrderStatus(req.params.id, input);

  emitOrderStatusUpdated(order.store_id, order);

  res.status(200).json({ data: order });
});
