import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

let createStatementUseCase: CreateStatementUseCase;
let createUserUseCase: CreateUserUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Get Statement Operation", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUserRepository, inMemoryStatementsRepository);
    getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUserRepository, inMemoryStatementsRepository);
  });

  it("Should be able to get statement from a Deposit", async () => {
    const user = await createUserUseCase.execute({
      name: "New User",
      email: "newuser@domain.com",
      password: "password"
    });

    const makeDepositResponse = await createStatementUseCase.execute({
      user_id: user.id as string,
      description: "Deposit test",
      amount: 500,
      type: 'deposit' as OperationType
    });

    const statement = await getStatementOperationUseCase.execute({
      user_id: makeDepositResponse.user_id as string,
      statement_id: makeDepositResponse.id as string
    });

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toBe(500);
    expect(statement.type).toBe("deposit");

  });

  it("Should be able to get statement from a Withdraw", async () => {
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

    const makeWithdrawResponse = await createStatementUseCase.execute({
      user_id: user.id as string,
      description: "Withdraw test",
      amount: 300,
      type: 'withdraw' as OperationType
    })

    const statement = await getStatementOperationUseCase.execute({
      user_id: makeWithdrawResponse.user_id as string,
      statement_id: makeWithdrawResponse.id as string
    });

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toBe(300);
    expect(statement.type).toBe("withdraw");

  });

  it("Should not be able to get statement from a non-existent user id", async () => {
    expect(async () => {

      await getStatementOperationUseCase.execute({
        user_id: "non-existent-user-id",
        statement_id: "non-existent-operation-id"
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)

  });

  it("Should not be able to get statement from a non-existent statement operation id", async () => {
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

      await getStatementOperationUseCase.execute({
        user_id: user.id as string,
        statement_id: "non-existent-operation-id"
      });

    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)

  });

});
