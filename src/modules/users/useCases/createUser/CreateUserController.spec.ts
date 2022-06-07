import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

let connection: Connection;

describe("Create a User", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

  })

  it("Should be able to create a user", async () => {

    const response = await request(app).post("/api/v1/users").send({
      name: "User test",
      email: "user@domain.com",
      password: "password"
    });

    expect(response.status).toBe(201);

  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
