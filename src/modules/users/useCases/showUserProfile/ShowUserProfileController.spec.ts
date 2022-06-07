import { Connection } from "typeorm";
import createConnection from "../../../../database"
import { app } from "../../../../app"
import request from "supertest";

import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs";

let connection: Connection;

describe("Show User Profile", () => {
  beforeAll(async () => {

    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("password", 8);

    await connection.query(`INSERT INTO USERS (id, name, email, password) values ('${id}', 'Test User', 'user@domain.com', '${password}')`)

  });

  it("Should be able to get user profile", async () => {

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "user@domain.com",
      password: "password",
    });

    const { token } = responseToken.body;

    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${token}`
    })

    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test User");
    expect(response.body.email).toBe("user@domain.com");

  });

  it("Should not be able to get user profile from a non-authenticated user", async () => {

    const response = await request(app).get("/api/v1/profile");

    expect(response.status).toBe(401);

  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
})
