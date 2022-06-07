import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

let connection: Connection;

describe("Create Statement", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${id}', 'Test User', 'user@domain.com', '${password}')`)

  })

  it("Should not be able to make a deposit from a non-authenticated user", async () => {

    const response = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: "Test Deposit"
    });

    expect(response.status).toBe(401);

  });

  it("Should be able to make a deposit", async () => {

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: "Test Deposit"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(500);
    expect(response.body.description).toBe("Test Deposit");

  });

  it("Should not be able to make a withdraw from a non-authenticated user", async () => {

    const response = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 200,
      description: "Test Withdraw"
    });

    expect(response.status).toBe(401);

  });

  it("Should be able to make a withdraw", async () => {

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 200,
      description: "Test Withdraw"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(200);
    expect(response.body.description).toBe("Test Withdraw");

  });


  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
