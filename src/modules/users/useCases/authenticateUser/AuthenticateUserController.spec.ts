import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

let connection: Connection;

describe("Authenticate a User", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${id}', 'Test User', 'user@domain.com', '${password}')`)

  })

  it("Should be able to authenticate a user", async () => {

    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password"
    });

    expect(response.body).toHaveProperty("token");

  });

  it("Should not be able to authenticate a user with a wrong password", async () => {

    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "wrongPassword"
    });

    expect(response.status).toBe(401);

  });

  it("Should not be able to authenticate a user non-existent", async () => {

    const response = await request(app).post("/api/v1/sessions").send({
      email: "non-existentuser@domain.com",
      password: "password"
    });

    expect(response.status).toBe(401);

  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
