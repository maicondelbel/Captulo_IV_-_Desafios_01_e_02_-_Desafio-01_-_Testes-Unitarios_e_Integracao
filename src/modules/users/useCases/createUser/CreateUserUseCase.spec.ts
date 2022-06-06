import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase"


let createUserUseCase: CreateUserUseCase;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Create a User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
  });

  it("Should be able to create a new User", async () => {

    const user = await createUserUseCase.execute({
      name: "New User",
      email: "newuser@domain.com",
      password: "password"
    });

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("password");

  });

  it("Should not be able to create a user with same email", async () => {
    expect(async () => {

      await createUserUseCase.execute({
        name: "New User",
        email: "newuser@domain.com",
        password: "password"
      });


      await createUserUseCase.execute({
        name: "New User 2",
        email: "newuser@domain.com",
        password: "password"
      });

    }).rejects.toBeInstanceOf(CreateUserError);

  });
});
