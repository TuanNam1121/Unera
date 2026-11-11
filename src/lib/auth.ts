import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { USER_ROLES, ACCOUNT_STATUS } from "@/constants";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 ngày (FR-AUTH-10)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập đầy đủ email và mật khẩu");
        }

        await connectToDatabase();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("Tài khoản không tồn tại trong hệ thống");
        }

        // FR-AUTH-08: Kiểm tra trạng thái tài khoản
        if (user.status === ACCOUNT_STATUS.DISABLED) {
          throw new Error("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị.");
        }

        if (!user.password) {
          throw new Error("Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Mật khẩu không chính xác");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    // FR-AUTH-03: Tự động khởi tạo tài khoản khi đăng nhập Google OAuth lần đầu
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        await connectToDatabase();
        const normalizedEmail = user.email.toLowerCase().trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dbUser: any = await User.findOne({ email: normalizedEmail });

        if (dbUser) {
          if (dbUser.status === ACCOUNT_STATUS.DISABLED) {
            return false; // Chặn tài khoản bị vô hiệu hóa
          }
          // Cập nhật avatar nếu có
          if (!dbUser.avatar && user.image) {
            dbUser.avatar = user.image;
            await dbUser.save();
          }
        } else {
          // Tạo tài khoản sinh viên mới (FR-AUTH-01 / FR-AUTH-03)
          dbUser = await User.create({
            name: user.name || normalizedEmail.split("@")[0] || "Sinh viên",
            email: normalizedEmail,
            role: USER_ROLES.STUDENT,
            status: ACCOUNT_STATUS.ACTIVE,
            avatar: user.image ?? undefined,
            emailVerified: new Date(),
          });

          // Tạo StudentProfile tương ứng
          await StudentProfile.create({
            userId: dbUser._id.toString(),
            fullName: dbUser.name,
            skills: [],
            achievements: [],
            developmentGoals: {},
          });
        }

        // Gán id và role vào object user để dùng trong jwt callback
        user.id = dbUser._id.toString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (user as any).role = dbUser.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (user as any).status = dbUser.status;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role || USER_ROLES.STUDENT;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.status = (user as any).status || ACCOUNT_STATUS.ACTIVE;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role || USER_ROLES.STUDENT;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).status = token.status || ACCOUNT_STATUS.ACTIVE;
      }
      return session;
    },
  },
});
