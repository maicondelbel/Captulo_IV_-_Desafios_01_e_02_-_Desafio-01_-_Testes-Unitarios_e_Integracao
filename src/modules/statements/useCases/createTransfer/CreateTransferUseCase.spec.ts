import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { CreateTransferError } from "./CreateTransferError";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let createTransferUseCase: CreateTransferUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createUserUseCase: CreateUserUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Create Statement", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUserRepository, inMemoryStatementsRepository);
    createTransferUseCase = new CreateTransferUseCase(inMemoryUserRepository, inMemoryStatementsRepository);
  });

  it("Should be able to create a new transfer", async () => {
    const senderUser = await createUserUseCase.execute({
      name: "Sender User",
      email: "senderuser@domain.com",
      password: "password"
    });

    await createStatementUseCase.execute({
      user_id: senderUser.id as string,
      description: "Deposit test",
      amount: 500,
      type: OperationType.DEPOSIT,
    })

    const recipientUser = await createUserUseCase.execute({
      name: "Recipient User",
      email: "recepientuser@domain.com",
      password: "password"
    });

    const makeTransfer = await createTransferUseCase.create({
      recipient_id: recipientUser.id as string,
      user_id: senderUser.id as string,
      description: "Transfer test",
      amount: 200,
    })

    expect(makeTransfer).toHaveProperty("id");
    expect(makeTransfer.type).toBe("transfer");
    expect(makeTransfer.amount).toBe(200);
  });

  it("Should not be able to create a new transfer with insuficient funds", async () => {
    const senderUser = await createUserUseCase.execute({
      name: "Sender User",
      email: "senderuser@domain.com",
      password: "password"
    });

    await createStatementUseCase.execute({
      user_id: senderUser.id as string,
      description: "Deposit test",
      amount: 100,
      type: OperationType.DEPOSIT,
    })

    const recipientUser = await createUserUseCase.execute({
      name: "Recipient User",
      email: "recepientuser@domain.com",
      password: "password"
    });

    await expect(
       createTransferUseCase.create({
        recipient_id: recipientUser.id as string,
        user_id: senderUser.id as string,
        description: "Transfer test",
        amount: 200,
      })
    ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  it("Should not be able to create a new transfer to a non-existent Recipient User", async () => {
    const senderUser = await createUserUseCase.execute({
      name: "Sender User",
      email: "senderuser@domain.com",
      password: "password"
    });

    await createStatementUseCase.execute({
      user_id: senderUser.id as string,
      description: "Deposit test",
      amount: 300,
      type: OperationType.DEPOSIT,
    })

    await expect(
       createTransferUseCase.create({
        recipient_id: "non-existent-user-recipient-id",
        user_id: senderUser.id as string,
        description: "Transfer test",
        amount: 200,
      })
    ).rejects.toBeInstanceOf(CreateTransferError.UserRecipientNotFound);
  });

  it("Should not be able to create a transfer with a non-existent user", async () => {
    const recipientUser = await createUserUseCase.execute({
      name: "Sender User",
      email: "senderuser@domain.com",
      password: "password"
    });

    await expect(
       createTransferUseCase.create({
        recipient_id: recipientUser.id as string,
        user_id: "non-existent-user-id",
        description: "Transfer test",
        amount: 200,
      })
    ).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });
});
