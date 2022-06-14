import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

export class CreateTransferController {
  async execute(request: Request, response: Response) {
    const { id: user_id } = request.user;
    const { amount, description } = request.body;
    const { recipient_id } = request.params;

    const createTransfer = container.resolve(CreateTransferUseCase);

    const transfer = await createTransfer.create({
      amount,
      description,
      recipient_id,
      user_id
    })

    return response.status(201).json(transfer);
  }
}
