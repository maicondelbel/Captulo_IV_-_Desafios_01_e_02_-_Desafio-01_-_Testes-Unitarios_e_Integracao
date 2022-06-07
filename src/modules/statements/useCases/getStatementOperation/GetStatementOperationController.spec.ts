import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

import { GetStatementOperationError } from "./GetStatementOperationError"

let connection: Connection;

describe("Get Statement Operation", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${id}', 'Test User', 'user@domain.com', '${password}')`)

  })

  it("Should not be able to get statement operation from a non-authenticated user", async () => {

    const id = uuidV4();

    const response = await request(app).get(`/api/v1/statements/${id}`);

    expect(response.status).toBe(401);

  });

  it("Should not be able to get statement operation from a non-existent operation id", async () => {

    const id = uuidV4();

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).get(`/api/v1/statements/${id}`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(404);

  });

  it("Should not be able to get statement operation from a deposit operation id", async () => {

    const id = uuidV4();

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const makeDepositResponse = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: "Test Deposit"
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    const depositId = makeDepositResponse.body.id;

    const response = await request(app).get(`/api/v1/statements/${depositId}`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body.amount).toBe('500.00');
    expect(response.body.type).toBe("deposit");
    expect(response.body.description).toBe("Test Deposit");

  });

  it("Should not be able to get statement operation from a withdraw operation id", async () => {

    const id = uuidV4();

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: "Test Deposit"
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    const makeWithdrawResponse = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 300,
      description: "Test Withdraw"
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    const withdrawId = makeWithdrawResponse.body.id;

    const response = await request(app).get(`/api/v1/statements/${withdrawId}`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body.amount).toBe('300.00');
    expect(response.body.type).toBe("withdraw");
    expect(response.body.description).toBe("Test Withdraw");

  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
