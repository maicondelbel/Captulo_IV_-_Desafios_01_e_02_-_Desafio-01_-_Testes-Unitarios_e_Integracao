import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

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
  });

  it("Should be able to create a new deposit", async () => {
    const user = await createUserUseCase.execute({
      name: "New User",
      email: "newuser@domain.com",
      password: "password"
    });

    const makeDeposit = await createStatementUseCase.execute({
      user_id: user.id as string,
      description: "Deposit test",
      amount: 500,
      type: 'deposit' as OperationType
    })

    expect(makeDeposit).toHaveProperty("id");
    expect(makeDeposit.type).toBe("deposit");
    expect(makeDeposit.amount).toBe(500);

  });

  it("Should be able to create a new withdraw", async () => {
    const user = await createUserUseCase.execute({
      name: "New User",
      email: "newuser@domain.com",
      password: "password"
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      description: "Deposit test",
      amount: 500,
      type: 'deposit' as OperationType
    })

    const makeWithdraw = await createStatementUseCase.execute({
      user_id: user.id as string,
      description: "Withdraw test",
      amount: 200,
      type: 'withdraw' as OperationType
    })

    expect(makeWithdraw).toHaveProperty("id");
    expect(makeWithdraw.type).toBe("withdraw");
    expect(makeWithdraw.amount).toBe(200);

  });

  it("Should not be able to create a statement with a non-existent user", async () => {
    expect(async () => {

      await createStatementUseCase.execute({
        user_id: "non-existent user",
        description: "Deposit test",
        amount: 500,
        type: 'deposit' as OperationType
      })

    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);

  });

  it("Should not be able to create a statement with insufficient funds", async () => {
    expect(async () => {

      const user = await createUserUseCase.execute({
        name: "New User",
        email: "newuser@domain.com",
        password: "password"
      });

      await createStatementUseCase.execute({
        user_id: user.id as string,
        description: "Deposit test",
        amount: 500,
        type: 'deposit' as OperationType
      })

      await createStatementUseCase.execute({
        user_id: user.id as string,
        description: "Withdraw test",
        amount: 700,
        type: 'withdraw' as OperationType
      })

    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);

  });

});
