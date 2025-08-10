"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app")); // Your Express app
const auth_service_1 = require("../src/services/auth.service");
const otp_service_1 = require("../src/services/otp.service");
const library_1 = require("@prisma/client/runtime/library");
jest.mock("../src/services/auth.service");
jest.mock("../src/services/otp.service");
const mockedRegisterUser = auth_service_1.registerUser;
const mockedSendOtpService = otp_service_1.sendOtpService;
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
        const res = await (0, supertest_1.default)(app_1.default).post(endpoint).send(baseBody);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(mockedRegisterUser).toHaveBeenCalledWith(baseBody.email, baseBody.password, baseBody.firstName, baseBody.lastName, baseBody.role, true, baseBody.phone, baseBody.referredByCode);
        expect(mockedSendOtpService).toHaveBeenCalledWith(baseBody.email);
    });
    it("should return 409 for duplicate email", async () => {
        mockedRegisterUser.mockRejectedValue(new library_1.PrismaClientKnownRequestError("Duplicate", {
            code: "P2002",
            clientVersion: "4.0.0",
            meta: { target: "email" },
        }));
        const res = await (0, supertest_1.default)(app_1.default).post(endpoint).send(baseBody);
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Duplicate entry/);
    });
    it("should return 400 for generic creation error", async () => {
        mockedRegisterUser.mockRejectedValue(new Error("Some DB error"));
        const res = await (0, supertest_1.default)(app_1.default).post(endpoint).send(baseBody);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.step).toBe("registerUser");
    });
    it("should return 500 if OTP sending fails", async () => {
        const fakeUser = { id: "123", email: baseBody.email };
        mockedRegisterUser.mockResolvedValue(fakeUser);
        mockedSendOtpService.mockRejectedValue(new Error("Email service down"));
        const res = await (0, supertest_1.default)(app_1.default).post(endpoint).send(baseBody);
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.step).toBe("sendOtpService");
    });
});
