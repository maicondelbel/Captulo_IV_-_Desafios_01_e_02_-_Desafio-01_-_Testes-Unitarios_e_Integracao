import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateTransferError } from "./CreateTransferError";
import { ICreateTransferDTO } from "./ICreateTransferDTO";

@injectable()
export class CreateTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async create({user_id, amount, description, recipient_id}: ICreateTransferDTO) {

    const user = await this.usersRepository.findById(user_id);
    const userRecipient = await this.usersRepository.findById(recipient_id);

    if(!user) {
      throw new CreateStatementError.UserNotFound();
    }

    if(!userRecipient) {
      throw new CreateTransferError.UserRecipientNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({ user_id });

    if (balance < amount) {
      throw new CreateStatementError.InsufficientFunds()
    }

    await this.statementsRepository.create({
      user_id,
      type: OperationType.TRANSFER,
      amount,
      description
    });

    const statementOperation = await this.statementsRepository.create({
      user_id: recipient_id,
      sender_id: user_id,
      type: OperationType.TRANSFER,
      amount,
      description
    });

    return statementOperation;
  }
}

