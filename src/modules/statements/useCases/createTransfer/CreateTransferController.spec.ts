import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

let connection: Connection;
let senderUserId: string = uuidV4();
let recipientUserId: string = uuidV4();

describe("Create Statement", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${senderUserId}', 'Sender User', 'senderuser@domain.com', '${password}')`)
    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${recipientUserId}', 'Recipient User', 'recipientuser@domain.com', '${password}')`)
  })

  it("Should not be able to make a transfer from a non-authenticated user", async () => {
    const response = await request(app).post("/api/v1/statements/transfer/recipient-user-id")
    .send({
      amount: 500,
      description: "Transfer Test"
    });

    expect(response.status).toBe(401);
  });

  it("Should be able to make a transfer", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "senderuser@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: "Deposit to Transfer Test"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    const response = await request(app).post(`/api/v1/statements/transfer/${recipientUserId}`)
    .send({
      amount: 200,
      description: "Transfer Test"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(200);
    expect(response.body.sender_id).toBe(senderUserId);
  });

  it("Should not be able to make a transfer with insuficient funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "senderuser@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).post(`/api/v1/statements/transfer/${recipientUserId}`)
    .send({
      amount: 700,
      description: "Transfer Test"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient funds");
  });

  it("Should not be able to create a new transfer to a non-existent Recipient User", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "senderuser@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).post(`/api/v1/statements/transfer/${uuidV4()}`)
    .send({
      amount: 700,
      description: "Transfer Test"
    })
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User recipient not found");
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
