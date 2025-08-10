import request from "supertest";
import app from "../src/app"; // Your Express app
import { registerUser } from "../src/services/auth.service";
import { sendOtpService } from "../src/services/otp.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

jest.mock("../src/services/auth.service");
jest.mock("../src/services/otp.service");

const mockedRegisterUser = registerUser as jest.Mock;
const mockedSendOtpService = sendOtpService as jest.Mock;

describe("POST /api/v1/auth/register", () => {
  const endpoint = "/api/v1/auth/register";

  const baseBody = {
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    password: "password123",
    role: "CLIENT",
    phone: "1234567890",
    referredByCode: null,
    acceptedPersonalData: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register user and send OTP (201)", async () => {
    const fakeUser = { id: "123", email: baseBody.email };
    mockedRegisterUser.mockResolvedValue(fakeUser);
    mockedSendOtpService.mockResolvedValue(undefined);

    const res = await request(app).post(endpoint).send(baseBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockedRegisterUser).toHaveBeenCalledWith(
      baseBody.email,
      baseBody.password,
      baseBody.firstName,
      baseBody.lastName,
      baseBody.role,
      true,
      baseBody.phone,
      baseBody.referredByCode
    );
    expect(mockedSendOtpService).toHaveBeenCalledWith(baseBody.email);
  });

  it("should return 409 for duplicate email", async () => {
    mockedRegisterUser.mockRejectedValue(
      new PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "4.0.0",
        meta: { target: "email" },
      })
    );

    const res = await request(app).post(endpoint).send(baseBody);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Duplicate entry/);
  });

  it("should return 400 for generic creation error", async () => {
    mockedRegisterUser.mockRejectedValue(new Error("Some DB error"));

    const res = await request(app).post(endpoint).send(baseBody);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.step).toBe("registerUser");
  });

  it("should return 500 if OTP sending fails", async () => {
    const fakeUser = { id: "123", email: baseBody.email };
    mockedRegisterUser.mockResolvedValue(fakeUser);
    mockedSendOtpService.mockRejectedValue(new Error("Email service down"));

    const res = await request(app).post(endpoint).send(baseBody);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.step).toBe("sendOtpService");
  });
});
