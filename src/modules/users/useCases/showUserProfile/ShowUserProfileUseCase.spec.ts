import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";


let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Create a User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUserRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUserRepository);
  });

  it("Should be able to get user information", async () => {

    await createUserUseCase.execute({
      name: "New User",
      email: "user@domain.com",
      password: "password"
    })

    const userAuthenticated = await authenticateUserUseCase.execute({
      email: "user@domain.com",
      password: "password"
    });

    const userProfile = await showUserProfileUseCase.execute(userAuthenticated.user.id as string);

    expect(userProfile).toHaveProperty("id");
    expect(userProfile.name).toBe("New User");
    expect(userProfile.email).toBe("user@domain.com");
  });

  it("Should not be able to get profile informations for a non-exists user", async () => {
    expect(async () => {
      await showUserProfileUseCase.execute("anUnavailableId");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });

});
