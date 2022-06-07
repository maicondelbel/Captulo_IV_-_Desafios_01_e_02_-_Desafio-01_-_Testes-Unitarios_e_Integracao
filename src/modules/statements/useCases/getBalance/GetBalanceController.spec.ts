import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

let connection: Connection;

describe("Get Balance", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${id}', 'Test User', 'user@domain.com', '${password}')`)

  })

  it("Should not be able to get statement balance from a non-authenticated user", async () => {

    const response = await request(app).get("/api/v1/statements/balance");

    expect(response.status).toBe(401);

  });

  it("Should be able to get statement balance from a user", async () => {

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
    })

    await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 200,
      description: "Test Withdraw"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    const response = await request(app).get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(300);
    expect(response.body.statement[0].type).toBe("deposit");
    expect(response.body.statement[1].type).toBe("withdraw");

  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
