import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

const SALT_ROUNDS = 12;


const register = async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest("name, email, and password are required");
    }

    if (password.length < 8) {
      throw ApiError.badRequest("Password must be at least 8 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiError.badRequest("Invalid email format");
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      throw ApiError.conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    return ApiResponse.created(res, "User registered successfully", {
      user: newUser,
    });
};


const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("email and password are required");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.name = user.name;

   
    const redirectTo = req.session.pendingAuthorizeUrl;
    if (redirectTo) {
      delete req.session.pendingAuthorizeUrl;
      return res.redirect(redirectTo);
    }

    return ApiResponse.ok(res, "Login successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
};

const logout = (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        return next(ApiError.internal("Could not end session"));
      }
      res.clearCookie("connect.sid");
      return ApiResponse.ok(res, "Logged out successfully");
    });
};


const getCurrentUser = async (req, res, next) => {
    if (!req.session?.userId) {
      throw ApiError.unauthorized("Not logged in");
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      throw ApiError.notfound("User not found");
    }

    return ApiResponse.ok(res, "User fetched", { user });
};

export { register, login, logout, getCurrentUser };