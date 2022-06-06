import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Create a User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUserRepository);
  });

  it("Should be able to authenticate a user", async () => {

    await createUserUseCase.execute({
      name: "New User",
      email: "user@domain.com",
      password: "password"
    })

    const userAuthenticated = await authenticateUserUseCase.execute({
      email: "user@domain.com",
      password: "password"
    });

    expect(userAuthenticated).toHaveProperty("token");
  });

  it("Should not be able to authenticate a user with a wrong password", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "user@domain.com",
        password: "wrongPassword"
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  });

  it("Should not be able to authenticate a non-existent user", () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "nonexistsuser@domain.com",
        password: "password"
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
});

});
