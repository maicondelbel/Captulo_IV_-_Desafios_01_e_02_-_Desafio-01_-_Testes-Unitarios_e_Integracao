import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

let createStatementUseCase: CreateStatementUseCase;
let createUserUseCase: CreateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Get Balance", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUserRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUserRepository);
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUserRepository, inMemoryStatementsRepository);
  });

  it("Should be able to get balance from a User", async () => {
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
      amount: 200,
      type: 'withdraw' as OperationType
    })

    const userBalance = await getBalanceUseCase.execute({
      user_id: user.id as string
    })

    expect(userBalance.balance).toBe(300);
    expect(userBalance.statement[0]).toHaveProperty("id");
    expect(userBalance.statement[0].type).toBe("deposit");
    expect(userBalance.statement[1]).toHaveProperty("id");
    expect(userBalance.statement[1].type).toBe("withdraw");

  });

  it("Should not be able to get balance with a non-existent user", async () => {
    expect(async () => {

      await getBalanceUseCase.execute({
        user_id: "non-existent user"
      })

    }).rejects.toBeInstanceOf(GetBalanceError);
  });

});
